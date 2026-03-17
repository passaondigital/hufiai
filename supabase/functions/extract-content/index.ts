import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTRACT_PROMPTS: Record<string, string> = {
  action_items: `Analysiere den folgenden Chat-Verlauf und extrahiere ALLE konkreten Action Items und To-Dos.
Formatiere sie als nummerierte Liste mit:
- Klaren, umsetzbaren Schritten
- Priorisierung (🔴 Hoch / 🟡 Mittel / 🟢 Niedrig)
- Geschätztem Zeitaufwand wenn möglich
Antworte auf Deutsch.`,

  insights: `Analysiere den folgenden Chat-Verlauf und extrahiere die KEY INSIGHTS.
Formatiere als Bullet Points mit:
- Die wichtigsten Erkenntnisse
- Überraschende oder besonders relevante Punkte
- Muster und Zusammenhänge
Antworte auf Deutsch.`,

  summary: `Erstelle eine prägnante Zusammenfassung (TL;DR) des folgenden Chat-Verlaufs.
Struktur:
1. **TL;DR** (1-2 Sätze)
2. **Kernthemen** (3-5 Bullet Points)
3. **Offene Fragen** (falls vorhanden)
Antworte auf Deutsch.`,

  checklist: `Erstelle eine praktische Checkliste aus dem folgenden Chat-Verlauf.
Formatiere als:
- [ ] Aufgabe 1
- [ ] Aufgabe 2
Gruppiere nach Kategorien wenn sinnvoll.
Antworte auf Deutsch.`,

  tldr: `Fasse den folgenden Chat-Verlauf in maximal 3 Sätzen zusammen. Fokussiere auf das Wesentliche. Antworte auf Deutsch.`,
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

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { conversationId, extractType } = await req.json();
    if (!conversationId || !extractType) throw new Error("Missing conversationId or extractType");

    const systemPrompt = EXTRACT_PROMPTS[extractType];
    if (!systemPrompt) throw new Error(`Unknown extract type: ${extractType}`);

    // Fetch conversation messages
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (msgError) throw msgError;
    if (!messages || messages.length === 0) throw new Error("No messages found");

    // Build chat content
    const chatContent = messages
      .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n\n");

    // Call AI
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
          { role: "system", content: systemPrompt },
          { role: "user", content: chatContent },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es später." }), {
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
    const extractedContent = aiData.choices?.[0]?.message?.content || "";

    // Store in extracted_content table
    await supabase.from("extracted_content").insert({
      user_id: user.id,
      conversation_id: conversationId,
      type: extractType,
      content: extractedContent,
    });

    return new Response(JSON.stringify({ content: extractedContent, type: extractType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
