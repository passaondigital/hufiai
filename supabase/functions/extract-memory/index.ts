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

    // Fetch recent messages
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("role, content, id, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (msgError) throw msgError;
    if (!messages || messages.length < 2) {
      return new Response(JSON.stringify({ extracted: 0, message: "Not enough messages" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatContent = messages
      .map((m: any) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use tool calling for structured extraction
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `Du bist ein Memory-Extraktor für ein Pferde-KI-System. Analysiere den Chat-Verlauf und extrahiere 3-5 wichtige, dauerhafte Fakten über den Nutzer und seine Pferde.

REGELN:
- Nur Fakten extrahieren, die langfristig relevant sind (keine flüchtigen Infos)
- Jeder Fakt muss eigenständig verständlich sein (ohne Chat-Kontext)
- Bewerte importance (1=nice-to-know, 5=kritisch) und confidence (0.0-1.0)
- Kategorien: goal (Ziele), preference (Vorlieben), fact (Tatsache), experience (Erfahrung), skill (Fähigkeit)
- Keine Duplikate zu bestehenden Fakten
- Auf Deutsch formulieren`,
          },
          { role: "user", content: chatContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "store_memory_facts",
              description: "Store extracted memory facts from the conversation",
              parameters: {
                type: "object",
                properties: {
                  facts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        fact: { type: "string", description: "The extracted fact, self-contained and clear" },
                        category: { type: "string", enum: ["goal", "preference", "fact", "experience", "skill"] },
                        importance: { type: "integer", minimum: 1, maximum: 5 },
                        confidence: { type: "number", minimum: 0, maximum: 1 },
                      },
                      required: ["fact", "category", "importance", "confidence"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["facts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "store_memory_facts" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Credits aufgebraucht" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      throw new Error(`AI error ${aiResp.status}: ${errText}`);
    }

    const aiData = await aiResp.json();
    let extractedFacts: any[] = [];

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        extractedFacts = args.facts || [];
      } catch { /* parse error */ }
    }

    if (extractedFacts.length === 0) {
      return new Response(JSON.stringify({ extracted: 0, message: "No facts extracted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dedup against existing memories
    const { data: existing } = await supabase
      .from("user_memory")
      .select("fact")
      .eq("user_id", user.id);

    const existingSet = new Set((existing || []).map((f: any) => f.fact.toLowerCase().trim()));
    const newFacts = extractedFacts.filter((f: any) => !existingSet.has(f.fact.toLowerCase().trim()));

    if (newFacts.length === 0) {
      return new Response(JSON.stringify({ extracted: 0, message: "All facts already known" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find last user message ID for source tracking
    const lastUserMsg = messages.filter((m: any) => m.role === "user").pop();

    // Insert new memories
    const { error: insertError } = await supabase.from("user_memory").insert(
      newFacts.map((f: any) => ({
        user_id: user.id,
        fact: f.fact,
        category: f.category,
        importance: f.importance,
        confidence: f.confidence,
        source_conversation_id: conversationId,
        source_message_id: lastUserMsg?.id || null,
      }))
    );

    if (insertError) throw insertError;

    // Update memory snapshot
    const { data: allMem } = await supabase
      .from("user_memory")
      .select("category")
      .eq("user_id", user.id);

    if (allMem) {
      const catCounts: Record<string, number> = {};
      allMem.forEach((m: any) => {
        const cat = m.category || "fact";
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
      const topCats = Object.entries(catCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([c]) => c);

      await supabase.from("memory_snapshots").insert({
        user_id: user.id,
        facts_count: allMem.length,
        top_categories: topCats,
      });
    }

    return new Response(JSON.stringify({
      extracted: newFacts.length,
      facts: newFacts.map((f: any) => ({ fact: f.fact, category: f.category, importance: f.importance })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-memory error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
