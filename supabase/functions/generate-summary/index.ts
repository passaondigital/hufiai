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

    const { conversationId } = await req.json();
    if (!conversationId) throw new Error("Missing conversationId");

    // Fetch messages
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (msgError) throw msgError;
    if (!messages || messages.length === 0) throw new Error("No messages found");

    const chatContent = messages
      .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Analysiere den folgenden Chat-Verlauf und erstelle:

1. **TL;DR** – Eine Zusammenfassung in 1-2 Sätzen.
2. **Key Insights** – Die 3-5 wichtigsten Erkenntnisse als Bullet Points.
3. **Action Items** – Konkrete nächste Schritte (falls vorhanden).
4. **Offene Fragen** – Ungeklärte Punkte (falls vorhanden).

Antworte auf Deutsch. Formatiere mit Markdown.`,
          },
          { role: "user", content: chatContent },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Credits aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const summary = aiData.choices?.[0]?.message?.content || "";

    // Store summary
    await supabase.from("extracted_content").insert({
      user_id: user.id,
      conversation_id: conversationId,
      type: "summary",
      content: summary,
    });

    // Update conversation title with TL;DR if no title set
    const { data: conv } = await supabase
      .from("conversations")
      .select("title")
      .eq("id", conversationId)
      .single();

    if (conv && (!conv.title || conv.title.startsWith("Neuer Chat"))) {
      const tldr = summary.split("\n").find(l => l.includes("TL;DR"))?.replace(/.*TL;DR[:\s]*\**/i, "").replace(/\**/g, "").trim();
      if (tldr) {
        await supabase.from("conversations").update({ title: tldr.slice(0, 80) }).eq("id", conversationId);
      }
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
