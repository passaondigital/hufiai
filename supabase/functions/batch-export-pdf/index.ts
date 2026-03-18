import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Nicht autorisiert");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Nicht autorisiert");

    const { conversation_ids, format = "separate", template = "report" } = await req.json();
    if (!conversation_ids?.length) throw new Error("conversation_ids required");

    // Create batch record
    const { data: batchRecord, error: batchErr } = await adminClient
      .from("pdf_batch_exports")
      .insert({
        user_id: user.id,
        conversation_ids,
        export_status: "processing",
        output_format: format === "combined" ? "combined_pdf" : "separate_pdfs",
      })
      .select()
      .single();

    if (batchErr) throw new Error("Batch-Eintrag konnte nicht erstellt werden");

    if (format === "combined") {
      // Delegate to generate-pdf with combined mode
      const pdfRes = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          conversation_ids,
          batch_action: "combined",
          template,
          include_prompts: true,
          include_metadata: true,
          include_toc: true,
        }),
      });

      if (!pdfRes.ok) {
        await adminClient.from("pdf_batch_exports").update({
          export_status: "failed",
          completed_at: new Date().toISOString(),
        }).eq("id", batchRecord.id);
        throw new Error("PDF-Generierung fehlgeschlagen");
      }

      const pdfBuffer = await pdfRes.arrayBuffer();

      // Upload combined PDF
      const storagePath = `${user.id}/batch-${Date.now()}-combined.pdf`;
      await adminClient.storage.from("pdf-exports").upload(storagePath, new Uint8Array(pdfBuffer), {
        contentType: "application/pdf",
      });
      const { data: urlData } = adminClient.storage.from("pdf-exports").getPublicUrl(storagePath);

      await adminClient.from("pdf_batch_exports").update({
        export_status: "completed",
        completed_at: new Date().toISOString(),
        zip_file_url: urlData?.publicUrl || null,
      }).eq("id", batchRecord.id);

      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="HufiAi-Batch-Combined-${Date.now()}.pdf"`,
        },
      });
    }

    // Separate PDFs mode – generate each one sequentially
    const results: { conversation_id: string; title: string; success: boolean; error?: string }[] = [];

    for (const cid of conversation_ids) {
      try {
        const pdfRes = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            apikey: supabaseKey,
          },
          body: JSON.stringify({
            conversation_ids: [cid],
            batch_action: "individual",
            template,
            include_prompts: true,
            include_metadata: true,
            include_toc: true,
          }),
        });

        if (pdfRes.ok) {
          results.push({ conversation_id: cid, title: cid.slice(0, 8), success: true });
        } else {
          results.push({ conversation_id: cid, title: cid.slice(0, 8), success: false, error: "Generation failed" });
        }
      } catch (e: any) {
        results.push({ conversation_id: cid, title: cid.slice(0, 8), success: false, error: e.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const status = successCount === conversation_ids.length ? "completed" : successCount > 0 ? "completed" : "failed";

    await adminClient.from("pdf_batch_exports").update({
      export_status: status,
      completed_at: new Date().toISOString(),
    }).eq("id", batchRecord.id);

    return new Response(JSON.stringify({
      batch_id: batchRecord.id,
      total: conversation_ids.length,
      success: successCount,
      failed: conversation_ids.length - successCount,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("batch-export-pdf error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unbekannter Fehler" }), {
      status: err.message?.includes("autorisiert") ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
