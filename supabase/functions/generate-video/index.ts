import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Model -> Fal.ai endpoint mapping
const MODEL_ENDPOINTS: Record<string, string> = {
  "wan-2.2": "fal-ai/wan/v2.1/1.3b",
  "skyreels-v1": "fal-ai/sky-reels/v2-df",
  "hunyuan-video": "fal-ai/hunyuan-video",
  "open-sora-2": "fal-ai/open-sora/v1.2",
  "mochi-1": "fal-ai/mochi-v1",
};

// Short-form presets: auto-configure aspect ratio, duration, and style for social platforms
const SHORT_FORM_PRESETS: Record<string, { aspect_ratio: string; max_duration: number; style_hint: string }> = {
  "instagram-reel": { aspect_ratio: "9:16", max_duration: 15, style_hint: "Fast-paced, visually engaging, vertical format optimized for Instagram Reels" },
  "youtube-short": { aspect_ratio: "9:16", max_duration: 15, style_hint: "Eye-catching, vertical format optimized for YouTube Shorts, bold text-friendly" },
  "tiktok": { aspect_ratio: "9:16", max_duration: 15, style_hint: "Trendy, dynamic, vertical format optimized for TikTok, fast cuts" },
  "instagram-story": { aspect_ratio: "9:16", max_duration: 10, style_hint: "Vertical story format, quick and immersive, 15 seconds max" },
  "linkedin-video": { aspect_ratio: "1:1", max_duration: 30, style_hint: "Professional, clean, square format for LinkedIn feed" },
  "twitter-video": { aspect_ratio: "16:9", max_duration: 30, style_hint: "Landscape format, attention-grabbing first frame for Twitter/X" },
};

const STYLE_KEYWORDS: Record<string, string> = {
  realistic: "photorealistic, high detail, natural lighting, 8K UHD",
  comic: "cel shaded, comic book style, bold outlines, vibrant flat colors, manga inspired",
  "3d": "3D rendered, Pixar style, volumetric lighting, subsurface scattering, CGI quality",
  vintage: "vintage film grain, 16mm film, warm color grading, retro aesthetic, faded colors, VHS texture",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    if (!FAL_AI_API_KEY) throw new Error("FAL_AI_API_KEY is not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const { jobId } = await req.json();
    if (!jobId) throw new Error("jobId is required");

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from("video_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (jobError || !job) throw new Error("Job not found");

    // Update status to processing
    await supabase.from("video_jobs").update({ status: "processing" }).eq("id", jobId);

    const endpoint = MODEL_ENDPOINTS[job.model] || MODEL_ENDPOINTS["wan-2.2"];

    // Build enhanced prompt with style keywords
    let enhancedPrompt = job.optimized_prompt || job.prompt;
    if (job.preset && STYLE_KEYWORDS[job.preset]) {
      enhancedPrompt = `${enhancedPrompt}, ${STYLE_KEYWORDS[job.preset]}`;
    }

    // Build Fal.ai request
    const falPayload: Record<string, unknown> = {
      prompt: enhancedPrompt,
      num_frames: Math.max(16, Math.min(job.duration * 8, 240)),
      fps: 8,
      guidance_scale: (job.coherence / 100) * 10 + 2,
    };

    if (job.negative_prompt) {
      falPayload.negative_prompt = job.negative_prompt;
    }
    if (job.seed) {
      falPayload.seed = job.seed;
    }

    // Map aspect ratio to resolution
    const resolutions: Record<string, { width: number; height: number }> = {
      "16:9": { width: 1280, height: 720 },
      "9:16": { width: 720, height: 1280 },
      "1:1": { width: 720, height: 720 },
      "4:5": { width: 720, height: 900 },
    };
    const res = resolutions[job.aspect_ratio] || resolutions["16:9"];
    falPayload.image_size = res;

    // Handle image-to-video input
    if (job.input_type === "image" && job.input_file_url) {
      falPayload.image_url = job.input_file_url;
    }

    console.log(`Calling Fal.ai endpoint: ${endpoint}`, JSON.stringify(falPayload).slice(0, 200));

    // Submit to Fal.ai queue
    const submitResponse = await fetch(`https://queue.fal.run/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(falPayload),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error("Fal.ai submit error:", submitResponse.status, errorText);
      await supabase.from("video_jobs").update({ status: "failed" }).eq("id", jobId);
      throw new Error(`Fal.ai error: ${submitResponse.status}`);
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    if (!requestId) {
      // Synchronous response - video is ready
      const videoUrl = submitData.video?.url || submitData.output?.video?.url;
      if (videoUrl) {
        await supabase.from("video_jobs").update({
          status: "completed",
          video_url: videoUrl,
          thumbnail_url: submitData.video?.thumbnail_url || null,
        }).eq("id", jobId);
      } else {
        await supabase.from("video_jobs").update({ status: "failed" }).eq("id", jobId);
      }
      return new Response(JSON.stringify({ success: true, videoUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Poll for result - max 2 minutes within edge function timeout
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes max (24 * 5s)
    let completed = false;

    while (attempts < maxAttempts && !completed) {
      await new Promise(r => setTimeout(r, 5000)); // 5s between polls
      attempts++;

      try {
        const statusResponse = await fetch(`https://queue.fal.run/${endpoint}/requests/${requestId}/status`, {
          headers: { Authorization: `Key ${FAL_AI_API_KEY}` },
        });

        if (!statusResponse.ok) continue;
        const statusData = await statusResponse.json();

        if (statusData.status === "COMPLETED") {
          // Fetch result
          const resultResponse = await fetch(`https://queue.fal.run/${endpoint}/requests/${requestId}`, {
            headers: { Authorization: `Key ${FAL_AI_API_KEY}` },
          });
          const resultData = await resultResponse.json();
          const videoUrl = resultData.video?.url || resultData.output?.video?.url;

          await supabase.from("video_jobs").update({
            status: "completed",
            video_url: videoUrl || null,
            thumbnail_url: resultData.video?.thumbnail_url || null,
          }).eq("id", jobId);
          completed = true;
        } else if (statusData.status === "FAILED") {
          await supabase.from("video_jobs").update({ status: "failed" }).eq("id", jobId);
          completed = true;
        }
      } catch (pollErr) {
        console.error("Poll error:", pollErr);
      }
    }

    if (!completed) {
      // Still processing - leave as "processing" so client can poll via realtime
      console.log(`Job ${jobId} still processing after timeout - will complete via Fal.ai`);
    }

    return new Response(JSON.stringify({ success: true, requestId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-video error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
