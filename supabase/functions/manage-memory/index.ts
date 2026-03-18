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

    const { action, conversationId, messages: chatMessages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ACTION: extract_facts - Extract facts from recent chat messages
    if (action === "extract_facts") {
      if (!chatMessages || chatMessages.length === 0) throw new Error("No messages");

      const chatContent = chatMessages
        .map((m: any) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
        .join("\n\n");

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
              content: `Du bist ein Memory-Extraktor. Analysiere den Chat und extrahiere wichtige Fakten über den User und seine Pferde.
              
Regeln:
- Nur konkrete, nützliche Fakten extrahieren (keine Allgemeinheiten)
- Kategorien: pferd, gesundheit, futter, haltung, training, business, persönlich
- Maximal 5 Fakten pro Analyse
- Keine Duplikate zu bestehenden Fakten

Antworte NUR mit einem JSON-Array von Objekten: [{"fact": "...", "category": "..."}]`,
            },
            { role: "user", content: chatContent },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_facts",
                description: "Extract facts from the conversation",
                parameters: {
                  type: "object",
                  properties: {
                    facts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          fact: { type: "string" },
                          category: { type: "string", enum: ["pferd", "gesundheit", "futter", "haltung", "training", "business", "persönlich", "general"] }
                        },
                        required: ["fact", "category"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["facts"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "extract_facts" } },
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits aufgebraucht" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error: ${aiResp.status}`);
      }

      const aiData = await aiResp.json();
      let extractedFacts: any[] = [];
      
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const args = JSON.parse(toolCall.function.arguments);
        extractedFacts = args.facts || [];
      }

      // Check for duplicates
      const { data: existingFacts } = await supabase
        .from("memory_facts")
        .select("fact")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const existingSet = new Set((existingFacts || []).map((f: any) => f.fact.toLowerCase()));
      const newFacts = extractedFacts.filter((f: any) => !existingSet.has(f.fact.toLowerCase()));

      if (newFacts.length > 0) {
        await supabase.from("memory_facts").insert(
          newFacts.map((f: any) => ({
            user_id: user.id,
            fact: f.fact,
            category: f.category,
            source: "auto",
            conversation_id: conversationId || null,
          }))
        );
      }

      return new Response(JSON.stringify({ extracted: newFacts.length, facts: newFacts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: check_reminders - Check if any reminders should fire for current message
    if (action === "check_reminders") {
      const userMessage = chatMessages?.[chatMessages.length - 1]?.content || "";

      const { data: activeReminders } = await supabase
        .from("user_reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .eq("is_triggered", false);

      const triggered: any[] = [];
      for (const reminder of activeReminders || []) {
        if (reminder.reminder_type === "topic" && reminder.trigger_topic) {
          const topics = reminder.trigger_topic.toLowerCase().split(",").map((t: string) => t.trim());
          if (topics.some((t: string) => userMessage.toLowerCase().includes(t))) {
            triggered.push(reminder);
            await supabase.from("user_reminders").update({ is_triggered: true, triggered_at: new Date().toISOString() }).eq("id", reminder.id);
          }
        }
      }

      return new Response(JSON.stringify({ triggered }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: get_context - Get full memory context for chat injection
    if (action === "get_context") {
      const [factsRes, remindersRes, profileRes] = await Promise.all([
        supabase.from("memory_facts").select("fact, category").eq("user_id", user.id).eq("is_active", true).limit(50),
        supabase.from("user_reminders").select("message, trigger_topic, reminder_type").eq("user_id", user.id).eq("is_active", true).eq("is_triggered", false),
        supabase.from("profiles").select("ai_memory").eq("user_id", user.id).single(),
      ]);

      const context = {
        facts: (factsRes.data || []).map((f: any) => `[${f.category}] ${f.fact}`).join("\n"),
        reminders: (remindersRes.data || []).map((r: any) => `Reminder: ${r.message}${r.trigger_topic ? ` (bei Thema: ${r.trigger_topic})` : ""}`).join("\n"),
        legacyMemory: profileRes.data?.ai_memory || "",
      };

      return new Response(JSON.stringify(context), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("manage-memory error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
