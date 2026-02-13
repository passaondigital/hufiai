import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("Nicht authentifiziert");

    const { attachment_id } = await req.json();
    if (!attachment_id) throw new Error("attachment_id required");

    // Fetch attachment record - verify ownership
    const { data: attachment, error: fetchErr } = await supabase
      .from("chat_attachments")
      .select("*")
      .eq("id", attachment_id)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !attachment) throw new Error("Attachment nicht gefunden oder kein Zugriff");

    // Download file from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("chat-attachments")
      .download(attachment.storage_path);

    if (dlErr || !fileData) throw new Error("Datei konnte nicht geladen werden");

    const fileType = attachment.file_type || "";
    const fileName = attachment.file_name || "";
    let extractedText = "";

    // For images: use Lovable AI vision to describe/extract text
    if (fileType.startsWith("image/")) {
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const mimeType = fileType || "image/jpeg";

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Du bist ein Experte für Bildanalyse in der Pferdebranche. Beschreibe das Bild detailliert und sachlich. Verwende eine empathisch-sachliche Tonalität: unterstützend und professionell, niemals allwissend. Nutze Formulierungen wie 'Basierend auf dem Bildmaterial...' oder 'Ein möglicher Befund wäre...'. Betone, dass eine fachliche Begutachtung vor Ort unverzichtbar ist. Wenn Text im Bild ist, extrahiere ihn vollständig. Wenn es ein Huf-/Pferde-Foto ist, beschreibe den Zustand fachlich." },
            { role: "user", content: [
              { type: "text", text: `Analysiere dieses Bild (${fileName}). Extrahiere allen Text und beschreibe den Inhalt detailliert.` },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
            ] }
          ],
        }),
      });

      if (aiResponse.status === 429) {
        await supabase.from("chat_attachments").update({ extraction_status: "rate_limited" }).eq("id", attachment_id);
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte später erneut versuchen." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        await supabase.from("chat_attachments").update({ extraction_status: "credits_exhausted" }).eq("id", attachment_id);
        return new Response(JSON.stringify({ error: "KI-Credits aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        extractedText = aiData.choices?.[0]?.message?.content || "";
      }
    }
    // For text-based files: read directly
    else if (
      fileType.startsWith("text/") ||
      fileType === "application/json" ||
      fileType === "application/xml" ||
      fileName.endsWith(".md") ||
      fileName.endsWith(".csv") ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".json") ||
      fileName.endsWith(".yaml") ||
      fileName.endsWith(".yml")
    ) {
      extractedText = await fileData.text();
    }
    // For PDFs: use AI to extract (send as base64)
    else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Extrahiere den gesamten Text aus diesem PDF-Dokument. Bewahre die Struktur (Überschriften, Listen, Tabellen) so gut wie möglich. Antworte nur mit dem extrahierten Text, keine Kommentare." },
            { role: "user", content: [
              { type: "text", text: `Extrahiere den vollständigen Text aus diesem PDF (${fileName}).` },
              { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } }
            ] }
          ],
        }),
      });

      if (aiResponse.status === 429) {
        await supabase.from("chat_attachments").update({ extraction_status: "rate_limited" }).eq("id", attachment_id);
        return new Response(JSON.stringify({ error: "Rate limit erreicht." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        await supabase.from("chat_attachments").update({ extraction_status: "credits_exhausted" }).eq("id", attachment_id);
        return new Response(JSON.stringify({ error: "KI-Credits aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        extractedText = aiData.choices?.[0]?.message?.content || "";
      }
    }
    // For DOCX and other office formats: basic text extraction attempt
    else {
      extractedText = `[Datei: ${fileName}, Typ: ${fileType}, Größe: ${attachment.file_size} Bytes. Automatische Textextraktion für diesen Dateityp wird noch nicht unterstützt.]`;
    }

    // Update attachment with extracted text
    const status = extractedText ? "completed" : "unsupported";
    await supabase.from("chat_attachments").update({
      extracted_text: extractedText || null,
      extraction_status: status,
    }).eq("id", attachment_id);

    return new Response(JSON.stringify({ 
      extracted_text: extractedText,
      status 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
