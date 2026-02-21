import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Nightly Video Agent: Starting...");

    // 1. Find gold-standard training logs from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: goldFeedback, error: fbError } = await supabase
      .from("training_data_logs")
      .select("*")
      .eq("source", "gold_standard")
      .eq("category", "video_training")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    if (fbError) {
      console.error("Error fetching feedback:", fbError);
      throw fbError;
    }

    if (!goldFeedback || goldFeedback.length === 0) {
      console.log("Nightly Agent: No new gold-standard feedback found. Skipping.");
      return new Response(JSON.stringify({ success: true, message: "No new feedback to process", videosCreated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Nightly Agent: Found ${goldFeedback.length} gold-standard entries`);

    // 2. Extract successful patterns from gold feedback
    const feedbackSummaries = goldFeedback.map(fb => {
      try {
        const parsed = JSON.parse(fb.ai_output || "{}");
        return {
          userId: fb.user_id,
          scenes: parsed.script?.scenes?.map((s: any) => ({
            model: s.model,
            style: s.style,
            prompt: s.prompt?.slice(0, 200),
          })) || [],
          title: parsed.script?.title || "Unknown",
        };
      } catch {
        return { userId: fb.user_id, scenes: [], title: "Unknown" };
      }
    }).filter(f => f.scenes.length > 0);

    if (feedbackSummaries.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No parseable feedback", videosCreated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Generate marketing video prompts based on successful patterns
    const patternSummary = feedbackSummaries.map(f =>
      `"${f.title}" used models: ${f.scenes.map((s: any) => s.model).join(", ")}, styles: ${f.scenes.map((s: any) => s.style).join(", ")}`
    ).join("\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Du bist der HufiAi Nightly Marketing Agent. Du erstellst automatisch Marketing-Videos basierend auf erfolgreichen Produktionen (Gold-Standard Feedback).

Erstelle 1-3 neue Marketing-Video-Prompts die auf den bewährten Mustern basieren. Fokus: Pferdegesundheit, Hufbearbeitung, professioneller Stallalltag.

Antworte NUR mit JSON:
{
  "videos": [
    {
      "title": "Marketing-Titel",
      "prompt": "Detaillierter Video-Prompt",
      "model": "wan-2.2|hunyuan-video|skyreels-v1",
      "aspect_ratio": "16:9|9:16|1:1",
      "duration": 5,
      "style": "realistic|cinematic|documentary",
      "target_platform": "YouTube|Instagram|LinkedIn"
    }
  ]
}`,
          },
          {
            role: "user",
            content: `Erfolgreiche Produktionen (Gold-Standard):\n${patternSummary}\n\nErstelle neue Marketing-Videos basierend auf diesen bewährten Mustern.`,
          },
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      result = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      console.error("JSON parse error:", content.slice(0, 500));
      throw new Error("Could not parse AI response");
    }

    // 4. Create video jobs for each generated marketing video
    const targetUserId = feedbackSummaries[0].userId;
    let videosCreated = 0;

    for (const video of (result.videos || [])) {
      const { error: insertError } = await supabase.from("video_jobs").insert({
        user_id: targetUserId,
        prompt: `[NIGHTLY-AGENT] ${video.prompt}, color palette: warm amber, accent: #F47B20 HufiAi orange`,
        model: video.model || "wan-2.2",
        input_type: "text",
        aspect_ratio: video.aspect_ratio || "16:9",
        duration: video.duration || 5,
        motion_intensity: 60,
        coherence: 70,
        stylization: 50,
        format: "mp4",
        preset: video.style || "realistic",
        hd_upscaling: false,
        status: "queued",
        is_hufi_relevant: true,
        optimized_prompt: `[NIGHTLY] ${video.target_platform || "Marketing"} - ${video.title}`,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
      } else {
        videosCreated++;
      }
    }

    // 5. Log the nightly run
    await supabase.from("training_data_logs").insert({
      user_id: targetUserId,
      user_input: `Nightly Agent Run: ${new Date().toISOString()}`,
      ai_output: JSON.stringify(result),
      source: "nightly_agent",
      category: "marketing_automation",
    });

    console.log(`Nightly Agent: Created ${videosCreated} marketing videos`);

    return new Response(JSON.stringify({
      success: true,
      videosCreated,
      basedOnFeedback: goldFeedback.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Nightly agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
