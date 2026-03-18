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

    const { module_id, learning_path_id, completed } = await req.json();

    if (!module_id || !learning_path_id) {
      throw new Error("module_id and learning_path_id required");
    }

    // Get module info for XP
    const { data: module } = await adminClient
      .from("learning_modules")
      .select("xp_reward, learning_path_id")
      .eq("id", module_id)
      .single();

    // Get total modules in path
    const { count: totalModules } = await adminClient
      .from("learning_modules")
      .select("*", { count: "exact", head: true })
      .eq("learning_path_id", learning_path_id);

    // Get or create progress record
    let { data: progress } = await adminClient
      .from("user_learning_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("learning_path_id", learning_path_id)
      .single();

    const completedModules = (progress?.completed_modules || 0) + (completed ? 1 : 0);
    const progressPct = Math.min(100, Math.round((completedModules / (totalModules || 1)) * 100));
    const pathCompleted = progressPct >= 100;

    if (progress) {
      await adminClient
        .from("user_learning_progress")
        .update({
          completed_modules: completedModules,
          progress_percentage: progressPct,
          total_modules: totalModules,
          completed_at: pathCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", progress.id);
    } else {
      await adminClient
        .from("user_learning_progress")
        .insert({
          user_id: user.id,
          learning_path_id,
          completed_modules: completed ? 1 : 0,
          progress_percentage: progressPct,
          total_modules: totalModules,
          completed_at: pathCompleted ? new Date().toISOString() : null,
        });
    }

    // Award module XP
    let xpAwarded = 0;
    if (completed && module?.xp_reward) {
      xpAwarded = module.xp_reward;
      await adminClient.from("xp_logs").insert({
        user_id: user.id,
        action_type: "complete_module",
        xp_earned: xpAwarded,
        source_id: module_id,
      });

      // Update user levels
      const { data: lvl } = await adminClient
        .from("user_levels")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (lvl) {
        await adminClient
          .from("user_levels")
          .update({
            total_xp: (lvl.total_xp || 0) + xpAwarded,
            current_xp: (lvl.current_xp || 0) + xpAwarded,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      }
    }

    // If path completed, award bonus
    if (pathCompleted) {
      await adminClient.from("xp_logs").insert({
        user_id: user.id,
        action_type: "complete_learning_path",
        xp_earned: 20,
        source_id: learning_path_id,
      });
    }

    return new Response(
      JSON.stringify({
        progress_percentage: progressPct,
        completed_modules: completedModules,
        total_modules: totalModules,
        path_completed: pathCompleted,
        xp_awarded: xpAwarded,
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
