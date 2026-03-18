import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
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

    const { achievement_id, share_message, social_platforms } = await req.json();

    // Get achievement details
    const { data: achievement } = await adminClient
      .from("achievements")
      .select("*")
      .eq("id", achievement_id)
      .single();

    if (!achievement) throw new Error("Achievement not found");

    const slug = generateSlug();
    const shareUrl = `https://hufiai.lovable.app/achievement/${slug}`;

    // Insert public achievement
    const { data: publicAch, error } = await adminClient
      .from("public_achievements")
      .insert({
        user_id: user.id,
        achievement_id,
        share_message: share_message || `Ich habe "${achievement.title}" bei HufiAI freigeschaltet! ${achievement.icon_emoji}`,
        social_platforms: social_platforms || ["clipboard"],
        share_url: shareUrl,
      })
      .select()
      .single();

    if (error) throw error;

    // Generate social templates
    const socialTemplates = {
      linkedin: `🎉 Ich habe gerade "${achievement.title}" ${achievement.icon_emoji} bei @HufiAI freigeschaltet!\n\n${share_message || achievement.description}\n\n#HufiAI #KI #Achievement`,
      instagram: `${achievement.icon_emoji} Achievement Unlocked: ${achievement.title}!\n\n${share_message || achievement.description}\n\n#HufiAI #AI #Achievement #Learning`,
      clipboard: `${achievement.icon_emoji} ${achievement.title} - ${achievement.description}\n\n${shareUrl}`,
    };

    return new Response(
      JSON.stringify({
        share_url: shareUrl,
        slug,
        social_templates: socialTemplates,
        achievement,
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
