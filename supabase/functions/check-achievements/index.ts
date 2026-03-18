import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { action_type, value } = await req.json();

    // Get user level
    const { data: userLevel } = await adminClient
      .from("user_levels")
      .select("current_level")
      .eq("user_id", user.id)
      .single();

    const currentLevel = userLevel?.current_level || 1;

    // Get all achievements the user hasn't unlocked yet
    const { data: allAchievements } = await adminClient
      .from("achievements")
      .select("*")
      .lte("level_required", currentLevel);

    const { data: userAchievements } = await adminClient
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user.id);

    const unlockedIds = new Set((userAchievements || []).map((ua: any) => ua.achievement_id));
    const unlocked: any[] = [];

    for (const ach of allAchievements || []) {
      if (unlockedIds.has(ach.id)) continue;

      const cond = ach.unlock_condition as any;
      if (!cond) continue;

      let shouldUnlock = false;

      // Check based on condition type
      if (cond.type === action_type && typeof value === "number" && value >= cond.value) {
        shouldUnlock = true;
      } else if (cond.type === "level" && cond.value <= currentLevel) {
        shouldUnlock = true;
      } else if (cond.type === "join_date" && new Date(user.created_at) < new Date(cond.value)) {
        shouldUnlock = true;
      } else if (cond.type === "first_share" && action_type === "first_share" && value >= 1) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        const { error } = await adminClient
          .from("user_achievements")
          .insert({ user_id: user.id, achievement_id: ach.id });

        if (!error) {
          unlocked.push(ach);

          // Award achievement XP
          if (ach.xp_reward) {
            await adminClient.from("xp_logs").insert({
              user_id: user.id,
              action_type: "achievement_bonus",
              xp_earned: ach.xp_reward,
              source_id: ach.id,
            });

            // Update total XP
            const { data: lvl } = await adminClient
              .from("user_levels")
              .select("total_xp")
              .eq("user_id", user.id)
              .single();

            if (lvl) {
              await adminClient
                .from("user_levels")
                .update({ total_xp: (lvl.total_xp || 0) + ach.xp_reward })
                .eq("user_id", user.id);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ unlocked_achievements: unlocked }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
