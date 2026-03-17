import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { conversationId, format = "md", options = {} } = await req.json();
    if (!conversationId) throw new Error("Missing conversationId");

    const { includeMetadata = true, includeWatermark = true } = options;

    // Fetch messages
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (msgError) throw msgError;
    if (!messages || messages.length === 0) throw new Error("No messages found");

    // Fetch conversation title
    const { data: conv } = await supabase
      .from("conversations")
      .select("title, created_at")
      .eq("id", conversationId)
      .single();

    const title = conv?.title || "HufiAi Chat";
    const date = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

    let content = "";
    let contentType = "";
    let fileExtension = "";

    if (format === "txt") {
      content = (includeMetadata ? `${title}\nExportiert: ${date}\n${"=".repeat(40)}\n\n` : "") +
        messages.map(m => `${m.role === "user" ? "👤 Du" : "🤖 HufiAi"}:\n${m.content}`).join("\n\n---\n\n") +
        (includeWatermark ? "\n\n---\nExportiert von HufiAi · hufiai.lovable.app" : "");
      contentType = "text/plain;charset=utf-8";
      fileExtension = "txt";
    } else if (format === "md") {
      content = (includeMetadata ? `# ${title}\n_Exportiert: ${date}_\n\n` : "") +
        messages.map(m => `## ${m.role === "user" ? "👤 Du" : "🤖 HufiAi"}\n\n${m.content}`).join("\n\n---\n\n") +
        (includeWatermark ? "\n\n---\n_Exportiert von HufiAi · hufiai.lovable.app_" : "");
      contentType = "text/markdown;charset=utf-8";
      fileExtension = "md";
    } else if (format === "html") {
      content = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:720px;margin:40px auto;padding:0 20px;background:#fafafa;color:#1a1a1a}
.header{text-align:center;padding:20px 0;border-bottom:2px solid #e5e5e5;margin-bottom:30px}
.header h1{font-size:24px;margin:0}.header p{color:#666;margin:8px 0 0;font-size:14px}
.msg{margin:16px 0;display:flex}.msg-user{justify-content:flex-end}.msg-ai{justify-content:flex-start}
.bubble{max-width:75%;padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.6}
.msg-user .bubble{background:#2563eb;color:white;border-bottom-right-radius:4px}
.msg-ai .bubble{background:white;border:1px solid #e5e5e5;border-bottom-left-radius:4px}
.watermark{text-align:center;color:#999;font-size:11px;padding:20px 0;border-top:1px solid #e5e5e5;margin-top:30px}
</style></head><body>
${includeMetadata ? `<div class="header"><h1>🐴 ${title}</h1><p>${date}</p></div>` : ""}
${messages.map(m => `<div class="msg msg-${m.role === "user" ? "user" : "ai"}"><div class="bubble">${m.content.replace(/\n/g, "<br>")}</div></div>`).join("")}
${includeWatermark ? '<div class="watermark">Exportiert von HufiAi · hufiai.lovable.app</div>' : ""}
</body></html>`;
      contentType = "text/html;charset=utf-8";
      fileExtension = "html";
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    // Log export
    await supabase.from("chat_exports").insert({
      user_id: user.id,
      conversation_id: conversationId,
      format,
    });

    return new Response(content, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="HufiAi-Chat-${Date.now()}.${fileExtension}"`,
      },
    });
  } catch (e) {
    console.error("export-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
