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

    // 1. Get top memories by importance, most recently used first
    const { data: memories, error: memError } = await supabase
      .from("user_memory")
      .select("id, fact, category, importance, confidence, use_count")
      .eq("user_id", user.id)
      .order("importance", { ascending: false })
      .order("last_used_at", { ascending: false, nullsFirst: false })
      .limit(15);

    if (memError) throw memError;

    // 2. Get active reminders
    const { data: reminders, error: remError } = await supabase
      .from("user_reminders")
      .select("id, reminder_text, type, trigger_topic, trigger_condition, due_date")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (remError) throw remError;

    // 3. Get legacy ai_memory from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_memory")
      .eq("user_id", user.id)
      .single();

    // 4. Get conversation-linked memories if conversationId provided
    let linkedMemories: any[] = [];
    if (conversationId) {
      const { data: links } = await supabase
        .from("conversation_memory_links")
        .select("memory_id, relevance_score")
        .eq("conversation_id", conversationId)
        .order("relevance_score", { ascending: false })
        .limit(5);

      if (links && links.length > 0) {
        const memIds = links.map((l: any) => l.memory_id);
        const { data: linked } = await supabase
          .from("user_memory")
          .select("fact, category, importance")
          .in("id", memIds);
        linkedMemories = linked || [];
      }
    }

    // Build injection context
    const sections: string[] = [];

    // Core memories (top 10 by importance)
    const topMemories = (memories || []).slice(0, 10);
    if (topMemories.length > 0) {
      sections.push("BEKANNTE FAKTEN:");
      topMemories.forEach((m: any) => {
        sections.push(`- [${m.category || "fact"}|★${m.importance}] ${m.fact}`);
      });
    }

    // Conversation-specific memories
    if (linkedMemories.length > 0) {
      sections.push("\nKONTEXT DIESER KONVERSATION:");
      linkedMemories.forEach((m: any) => {
        sections.push(`- ${m.fact}`);
      });
    }

    // Active reminders
    if (reminders && reminders.length > 0) {
      sections.push("\nAKTIVE ERINNERUNGEN (erwähne diese wenn thematisch passend):");
      reminders.forEach((r: any) => {
        let prefix = "📌";
        if (r.type === "condition") prefix = "⚡";
        if (r.type === "time") prefix = "⏰";
        sections.push(`- ${prefix} ${r.reminder_text}${r.trigger_topic ? ` [bei Thema: ${r.trigger_topic}]` : ""}`);
      });
    }

    // Legacy memory
    if (profile?.ai_memory) {
      sections.push("\nLEGACY MEMORY:");
      sections.push(profile.ai_memory);
    }

    const memoryBlock = sections.length > 0
      ? `\n\n═══ USER MEMORY (${topMemories.length} Fakten, ${reminders?.length || 0} Erinnerungen) ═══\n${sections.join("\n")}\n\nNutze dieses Wissen kontextbezogen, ohne es ungefragt zu wiederholen. Wenn eine Erinnerung thematisch passt, erwähne sie natürlich.`
      : "";

    // Update use_count for injected memories
    if (topMemories.length > 0) {
      const memIds = topMemories.map((m: any) => m.id);
      for (const id of memIds) {
        const mem = topMemories.find((m: any) => m.id === id);
        await supabase.from("user_memory").update({
          use_count: (mem?.use_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        }).eq("id", id);
      }
    }

    return new Response(JSON.stringify({
      memoryBlock,
      stats: {
        totalFacts: memories?.length || 0,
        activeReminders: reminders?.length || 0,
        linkedMemories: linkedMemories.length,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("inject-memory error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
