import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    if (!FAL_AI_API_KEY) throw new Error("FAL_AI_API_KEY is not configured");

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

    const { jobId, action, settings } = await req.json();
    if (!jobId) throw new Error("jobId is required");

    // Fetch job and verify ownership
    const { data: job, error: jobError } = await supabase
      .from("video_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (jobError || !job) throw new Error("Job not found");
    if (!job.video_url) throw new Error("No video URL available for processing");

    let resultUrl = job.video_url;

    const pollForResult = async (endpoint: string, requestId: string): Promise<string | null> => {
      let attempts = 0;
      while (attempts < 24) { // max 2 minutes
        await new Promise(r => setTimeout(r, 5000));
        attempts++;
        try {
          const statusRes = await fetch(`${endpoint}/requests/${requestId}/status`, {
            headers: { Authorization: `Key ${FAL_AI_API_KEY}` },
          });
          if (!statusRes.ok) continue;
          const statusData = await statusRes.json();

          if (statusData.status === "COMPLETED") {
            const resultRes = await fetch(`${endpoint}/requests/${requestId}`, {
              headers: { Authorization: `Key ${FAL_AI_API_KEY}` },
            });
            const resultData = await resultRes.json();
            return resultData.image?.url || resultData.images?.[0]?.url || null;
          } else if (statusData.status === "FAILED") {
            return null;
          }
        } catch { /* continue polling */ }
      }
      return null;
    };

    if (action === "upscale") {
      console.log("Starting upscale for job:", jobId);
      await supabase.from("video_jobs").update({ status: "processing" }).eq("id", jobId);

      const upscaleResponse = await fetch("https://queue.fal.run/fal-ai/creative-upscaler", {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: job.thumbnail_url || job.video_url,
          scale: 2,
          creativity: 0.3,
          detail: 1,
          shape_preservation: 0.8,
        }),
      });

      if (!upscaleResponse.ok) {
        const errText = await upscaleResponse.text();
        console.error("Fal.ai upscale error:", errText);
        await supabase.from("video_jobs").update({ status: "failed" }).eq("id", jobId);
        throw new Error("Upscaling failed");
      }

      const upscaleData = await upscaleResponse.json();
      if (upscaleData.request_id) {
        const polledUrl = await pollForResult("https://queue.fal.run/fal-ai/creative-upscaler", upscaleData.request_id);
        if (polledUrl) resultUrl = polledUrl;
      } else if (upscaleData.image?.url) {
        resultUrl = upscaleData.image.url;
      }

      await supabase.from("video_jobs").update({
        status: "completed",
        thumbnail_url: resultUrl,
        hd_upscaling: true,
      }).eq("id", jobId);

    } else if (action === "style-transfer") {
      const stylePrompt = settings?.stylePrompt || "";
      console.log("Starting style transfer for job:", jobId);
      await supabase.from("video_jobs").update({ status: "processing" }).eq("id", jobId);

      const styleResponse = await fetch("https://queue.fal.run/fal-ai/img2img/turbo", {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: job.thumbnail_url || job.video_url,
          prompt: stylePrompt,
          strength: settings?.strength || 0.6,
          num_inference_steps: 4,
        }),
      });

      if (!styleResponse.ok) {
        await supabase.from("video_jobs").update({ status: "failed" }).eq("id", jobId);
        throw new Error("Style transfer failed");
      }

      const styleData = await styleResponse.json();
      if (styleData.request_id) {
        const polledUrl = await pollForResult("https://queue.fal.run/fal-ai/img2img/turbo", styleData.request_id);
        if (polledUrl) resultUrl = polledUrl;
      } else if (styleData.images?.[0]?.url) {
        resultUrl = styleData.images[0].url;
      }

      await supabase.from("video_jobs").update({
        status: "completed",
        thumbnail_url: resultUrl,
      }).eq("id", jobId);

    } else if (action === "color-grade") {
      const { brightness = 100, saturation = 100, contrast = 100 } = settings || {};
      console.log("Color grading for job:", jobId);

      const colorPrompts: string[] = [];
      if (brightness > 120) colorPrompts.push("brighter, well-lit");
      if (brightness < 80) colorPrompts.push("darker, moody lighting");
      if (saturation > 130) colorPrompts.push("vibrant, saturated colors");
      if (saturation < 70) colorPrompts.push("desaturated, muted tones");
      if (contrast > 130) colorPrompts.push("high contrast, dramatic");
      if (contrast < 70) colorPrompts.push("low contrast, soft");

      if (colorPrompts.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No color adjustments needed", resultUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("video_jobs").update({ status: "processing" }).eq("id", jobId);

      const gradeResponse = await fetch("https://queue.fal.run/fal-ai/img2img/turbo", {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: job.thumbnail_url || job.video_url,
          prompt: `${job.prompt}, ${colorPrompts.join(", ")}`,
          strength: 0.3,
          num_inference_steps: 4,
        }),
      });

      if (!gradeResponse.ok) {
        await supabase.from("video_jobs").update({ status: "failed" }).eq("id", jobId);
        throw new Error("Color grading failed");
      }

      const gradeData = await gradeResponse.json();
      if (gradeData.request_id) {
        const polledUrl = await pollForResult("https://queue.fal.run/fal-ai/img2img/turbo", gradeData.request_id);
        if (polledUrl) resultUrl = polledUrl;
      } else if (gradeData.images?.[0]?.url) {
        resultUrl = gradeData.images[0].url;
      }

      await supabase.from("video_jobs").update({
        status: "completed",
        thumbnail_url: resultUrl,
      }).eq("id", jobId);
    }

    return new Response(JSON.stringify({ success: true, resultUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-video error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
