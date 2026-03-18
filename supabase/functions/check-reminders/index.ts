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

    const { userMessage, conversationId } = await req.json();
    if (!userMessage) throw new Error("Missing userMessage");

    const messageLower = userMessage.toLowerCase();

    // 1. Check topic-based reminders
    const { data: topicReminders } = await supabase
      .from("user_reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("type", "topic");

    const triggeredReminders: any[] = [];

    for (const reminder of topicReminders || []) {
      if (!reminder.trigger_topic) continue;
      const topics = reminder.trigger_topic.toLowerCase().split(",").map((t: string) => t.trim());
      const matched = topics.some((topic: string) => {
        // Support multi-word topics and partial matches
        if (topic.length <= 3) return messageLower.includes(` ${topic} `) || messageLower.startsWith(`${topic} `) || messageLower.endsWith(` ${topic}`);
        return messageLower.includes(topic);
      });

      if (matched) {
        triggeredReminders.push({
          id: reminder.id,
          text: reminder.reminder_text,
          type: "topic",
          topic: reminder.trigger_topic,
        });

        // Update reminder stats
        await supabase.from("user_reminders").update({
          reminded_count: (reminder.reminded_count || 0) + 1,
          last_reminded_at: new Date().toISOString(),
        }).eq("id", reminder.id);
      }
    }

    // 2. Check condition-based reminders
    const { data: condReminders } = await supabase
      .from("user_reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("type", "condition");

    for (const reminder of condReminders || []) {
      if (!reminder.trigger_condition) continue;
      // Simple keyword matching for conditions
      const condLower = reminder.trigger_condition.toLowerCase();
      if (messageLower.includes(condLower)) {
        triggeredReminders.push({
          id: reminder.id,
          text: reminder.reminder_text,
          type: "condition",
          condition: reminder.trigger_condition,
        });

        await supabase.from("user_reminders").update({
          reminded_count: (reminder.reminded_count || 0) + 1,
          last_reminded_at: new Date().toISOString(),
        }).eq("id", reminder.id);
      }
    }

    // 3. Check time-based reminders (due now or overdue)
    const { data: timeReminders } = await supabase
      .from("user_reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("type", "time")
      .lte("due_date", new Date().toISOString());

    for (const reminder of timeReminders || []) {
      triggeredReminders.push({
        id: reminder.id,
        text: reminder.reminder_text,
        type: "time",
        dueDate: reminder.due_date,
      });

      await supabase.from("user_reminders").update({
        reminded_count: (reminder.reminded_count || 0) + 1,
        last_reminded_at: new Date().toISOString(),
        is_active: false, // Deactivate after triggering
      }).eq("id", reminder.id);
    }

    // 4. Link relevant memories to this conversation
    if (conversationId) {
      const { data: allMemories } = await supabase
        .from("user_memory")
        .select("id, fact")
        .eq("user_id", user.id);

      if (allMemories) {
        const messageWords = messageLower.split(/\s+/).filter((w: string) => w.length > 3);
        const relevant = allMemories.filter((m: any) => {
          const factLower = m.fact.toLowerCase();
          return messageWords.some((word: string) => factLower.includes(word));
        }).slice(0, 5);

        for (const mem of relevant) {
          await supabase.from("conversation_memory_links").upsert({
            conversation_id: conversationId,
            memory_id: mem.id,
            relevance_score: 0.7,
          }, { onConflict: "conversation_id,memory_id" });
        }
      }
    }

    // Build context string for triggered reminders
    const reminderContext = triggeredReminders.length > 0
      ? triggeredReminders.map(r => `📌 Erinnerung: ${r.text}`).join("\n")
      : "";

    return new Response(JSON.stringify({
      triggered: triggeredReminders,
      count: triggeredReminders.length,
      reminderContext,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-reminders error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
