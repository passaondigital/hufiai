import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// XP reward table
const XP_REWARDS: Record<string, number | ((meta?: any) => number)> = {
  // Chat actions
  chat_complete: (meta: any) => Math.min(Math.max(1, Math.ceil((meta?.messageCount || 2) / 4)), 5),
  use_mode: 2,
  use_custom_prompt: 3,
  generate_image: 5,
  generate_video: 5,
  export_chat: 2,
  share_achievement: 5,
  collaborate_friend: 10,
  // Learning actions
  watch_tutorial: 5,
  complete_module: 10,
  complete_learning_path: 20,
  quiz_correct: 5, // per 5 correct answers
  share_learning: 3,
  // Milestone bonuses
  level_up: 50,
  streak_10: 100,
  streak_30: 200,
  first_share: 25,
};

// Level thresholds
const LEVEL_THRESHOLDS = [
  0,    // Level 1: 0-100
  100,  // Level 2: 100-250
  250,  // Level 3: 250-500
  500,  // Level 4: 500-800
  800,  // Level 5: 800-1200
  1200, // Level 6: 1200-1600
  1600, // Level 7
  2100, // Level 8
  2700, // Level 9
  3500, // Level 10
];

function getLevelForXP(totalXP: number): { level: number; xpForNext: number } {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  const xpForNext = level < LEVEL_THRESHOLDS.length
    ? LEVEL_THRESHOLDS[level] - totalXP
    : 0;
  return { level: Math.min(level, 10), xpForNext: Math.max(xpForNext, 0) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Invalid user");

    const body = await req.json();
    const { action_type, source_id, meta } = body;

    if (!action_type || !XP_REWARDS[action_type]) {
      throw new Error(`Unknown action: ${action_type}`);
    }

    // Calculate XP
    const rewardDef = XP_REWARDS[action_type];
    const xpEarned = typeof rewardDef === "function" ? rewardDef(meta) : rewardDef;

    // Log XP
    await adminClient.from("xp_logs").insert({
      user_id: user.id,
      action_type,
      xp_earned: xpEarned,
      source_id: source_id || null,
    });

    // Get or create user_levels
    let { data: userLevel } = await adminClient
      .from("user_levels")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!userLevel) {
      const { data: newLevel } = await adminClient
        .from("user_levels")
        .insert({ user_id: user.id })
        .select()
        .single();
      userLevel = newLevel;
    }

    // Update XP
    const newTotalXP = (userLevel.total_xp || 0) + xpEarned;
    const newCurrentXP = (userLevel.current_xp || 0) + xpEarned;
    const { level: newLevel, xpForNext } = getLevelForXP(newTotalXP);
    const oldLevel = userLevel.current_level || 1;
    const leveledUp = newLevel > oldLevel;

    const updateData: Record<string, any> = {
      total_xp: newTotalXP,
      current_xp: newCurrentXP,
      current_level: newLevel,
      xp_for_next_level: xpForNext,
      updated_at: new Date().toISOString(),
    };

    if (leveledUp) {
      updateData.level_up_count = (userLevel.level_up_count || 0) + 1;
      updateData.last_level_up_at = new Date().toISOString();
    }

    await adminClient
      .from("user_levels")
      .update(updateData)
      .eq("user_id", user.id);

    // If leveled up, award bonus XP recursively and check level achievements
    const unlockedAchievements: any[] = [];

    if (leveledUp) {
      // Award level-up bonus
      await adminClient.from("xp_logs").insert({
        user_id: user.id,
        action_type: "level_up",
        xp_earned: 50,
      });

      // Update total with bonus
      await adminClient
        .from("user_levels")
        .update({ total_xp: newTotalXP + 50 })
        .eq("user_id", user.id);

      // Check level-based achievements
      const { data: levelAchievements } = await adminClient
        .from("achievements")
        .select("*")
        .lte("level_required", newLevel);

      if (levelAchievements) {
        for (const ach of levelAchievements) {
          const cond = ach.unlock_condition as any;
          if (cond?.type === "level" && cond.value === newLevel) {
            const { error } = await adminClient
              .from("user_achievements")
              .insert({
                user_id: user.id,
                achievement_id: ach.id,
              });
            if (!error) unlockedAchievements.push(ach);
          }
        }
      }
    }

    // Check action-based achievements
    const achievementMap: Record<string, { type: string; countQuery: string }> = {
      chat_complete: { type: "chats", countQuery: "chat_complete" },
      use_custom_prompt: { type: "custom_prompts", countQuery: "use_custom_prompt" },
      generate_image: { type: "images_generated", countQuery: "generate_image" },
    };

    if (achievementMap[action_type]) {
      const { countQuery } = achievementMap[action_type];
      const { count } = await adminClient
        .from("xp_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action_type", countQuery);

      // Find matching achievements
      const { data: allAch } = await adminClient
        .from("achievements")
        .select("*")
        .lte("level_required", newLevel);

      if (allAch && count) {
        for (const ach of allAch) {
          const cond = ach.unlock_condition as any;
          if (cond?.type === achievementMap[action_type].type && count >= cond.value) {
            // Check not already unlocked
            const { data: existing } = await adminClient
              .from("user_achievements")
              .select("id")
              .eq("user_id", user.id)
              .eq("achievement_id", ach.id)
              .single();

            if (!existing) {
              const { error } = await adminClient
                .from("user_achievements")
                .insert({ user_id: user.id, achievement_id: ach.id });
              if (!error) {
                unlockedAchievements.push(ach);
                // Award achievement XP
                if (ach.xp_reward) {
                  await adminClient.from("xp_logs").insert({
                    user_id: user.id,
                    action_type: "achievement_bonus",
                    xp_earned: ach.xp_reward,
                    source_id: ach.id,
                  });
                  await adminClient
                    .from("user_levels")
                    .update({ total_xp: newTotalXP + (leveledUp ? 50 : 0) + ach.xp_reward })
                    .eq("user_id", user.id);
                }
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        xp_earned: xpEarned,
        total_xp: newTotalXP,
        current_level: newLevel,
        xp_for_next_level: xpForNext,
        leveled_up: leveledUp,
        new_level: leveledUp ? newLevel : null,
        unlocked_achievements: unlockedAchievements,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
