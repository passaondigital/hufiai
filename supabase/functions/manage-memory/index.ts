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

    // ACTION: extract_facts
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
              content: `Du bist ein Memory-Extraktor. Analysiere den Chat und extrahiere wichtige Fakten.
Kategorien: goal, preference, fact, experience, skill
Maximal 5 Fakten. Bewerte importance (1-5) und confidence (0.0-1.0).`,
            },
            { role: "user", content: chatContent },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_facts",
                description: "Extract memory facts from conversation",
                parameters: {
                  type: "object",
                  properties: {
                    facts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          fact: { type: "string" },
                          category: { type: "string", enum: ["goal", "preference", "fact", "experience", "skill"] },
                          importance: { type: "integer", minimum: 1, maximum: 5 },
                          confidence: { type: "number", minimum: 0, maximum: 1 }
                        },
                        required: ["fact", "category", "importance", "confidence"],
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

      // Dedup
      const { data: existing } = await supabase.from("user_memory").select("fact").eq("user_id", user.id);
      const existingSet = new Set((existing || []).map((f: any) => f.fact.toLowerCase()));
      const newFacts = extractedFacts.filter((f: any) => !existingSet.has(f.fact.toLowerCase()));

      if (newFacts.length > 0) {
        await supabase.from("user_memory").insert(
          newFacts.map((f: any) => ({
            user_id: user.id,
            fact: f.fact,
            category: f.category,
            importance: f.importance,
            confidence: f.confidence,
            source_conversation_id: conversationId || null,
          }))
        );
      }

      // Create snapshot
      const { data: allFacts } = await supabase.from("user_memory").select("category").eq("user_id", user.id);
      if (allFacts) {
        const catCounts: Record<string, number> = {};
        allFacts.forEach((f: any) => { catCounts[f.category || "fact"] = (catCounts[f.category || "fact"] || 0) + 1; });
        const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
        await supabase.from("memory_snapshots").insert({
          user_id: user.id, facts_count: allFacts.length, top_categories: topCats,
        });
      }

      return new Response(JSON.stringify({ extracted: newFacts.length, facts: newFacts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: check_reminders
    if (action === "check_reminders") {
      const userMessage = chatMessages?.[chatMessages.length - 1]?.content || "";

      const { data: activeReminders } = await supabase
        .from("user_reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const triggered: any[] = [];
      for (const reminder of activeReminders || []) {
        if (reminder.type === "topic" && reminder.trigger_topic) {
          const topics = reminder.trigger_topic.toLowerCase().split(",").map((t: string) => t.trim());
          if (topics.some((t: string) => userMessage.toLowerCase().includes(t))) {
            triggered.push(reminder);
            await supabase.from("user_reminders").update({
              reminded_count: (reminder.reminded_count || 0) + 1,
              last_reminded_at: new Date().toISOString(),
            }).eq("id", reminder.id);
          }
        }
      }

      // Link relevant memories to conversation
      if (conversationId) {
        const { data: memories } = await supabase.from("user_memory").select("id, fact").eq("user_id", user.id);
        if (memories) {
          const relevant = memories.filter((m: any) => {
            const words = m.fact.toLowerCase().split(/\s+/);
            return words.some((w: string) => w.length > 3 && userMessage.toLowerCase().includes(w));
          }).slice(0, 5);

          for (const mem of relevant) {
            await supabase.from("conversation_memory_links").upsert({
              conversation_id: conversationId, memory_id: mem.id, relevance_score: 0.7,
            }, { onConflict: "conversation_id,memory_id" });
            await supabase.from("user_memory").update({
              use_count: (mem as any).use_count ? (mem as any).use_count + 1 : 1,
              last_used_at: new Date().toISOString(),
            }).eq("id", mem.id);
          }
        }
      }

      return new Response(JSON.stringify({ triggered }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: get_context
    if (action === "get_context") {
      const [memRes, remRes, profRes] = await Promise.all([
        supabase.from("user_memory").select("fact, category, importance").eq("user_id", user.id).order("importance", { ascending: false }).limit(30),
        supabase.from("user_reminders").select("reminder_text, trigger_topic, type").eq("user_id", user.id).eq("is_active", true),
        supabase.from("profiles").select("ai_memory").eq("user_id", user.id).single(),
      ]);

      const context = {
        facts: (memRes.data || []).map((f: any) => `[${f.category}|★${f.importance}] ${f.fact}`).join("\n"),
        reminders: (remRes.data || []).map((r: any) => `Reminder: ${r.reminder_text}${r.trigger_topic ? ` (Thema: ${r.trigger_topic})` : ""}`).join("\n"),
        legacyMemory: profRes.data?.ai_memory || "",
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
