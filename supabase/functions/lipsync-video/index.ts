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

    const { jobId, audioUrl } = await req.json();
    if (!jobId) throw new Error("jobId is required");
    if (!audioUrl) throw new Error("audioUrl is required");

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from("video_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (jobError || !job) throw new Error("Job not found");
    if (!job.video_url) throw new Error("No video URL available for lipsync");

    await supabase.from("video_jobs").update({ status: "processing" }).eq("id", jobId);

    console.log(`Starting lipsync for job ${jobId} with audio ${audioUrl}`);

    // Call Fal.ai Sync Lipsync 2.0
    const lipsyncResponse = await fetch("https://queue.fal.run/fal-ai/sync-lipsync/v2", {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "lipsync-2",
        video_url: job.video_url,
        audio_url: audioUrl,
        sync_mode: "cut_off",
      }),
    });

    if (!lipsyncResponse.ok) {
      const errText = await lipsyncResponse.text();
      console.error("Fal.ai lipsync error:", lipsyncResponse.status, errText);
      await supabase.from("video_jobs").update({ status: "failed" }).eq("id", jobId);
      throw new Error(`Lipsync API error: ${lipsyncResponse.status}`);
    }

    const lipsyncData = await lipsyncResponse.json();
    const requestId = lipsyncData.request_id;

    if (!requestId) {
      // Synchronous response
      const videoUrl = lipsyncData.video?.url;
      if (videoUrl) {
        await supabase.from("video_jobs").update({
          status: "completed",
          video_url: videoUrl,
        }).eq("id", jobId);
        return new Response(JSON.stringify({ success: true, videoUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await supabase.from("video_jobs").update({ status: "failed" }).eq("id", jobId);
      throw new Error("No video returned from lipsync");
    }

    // Poll for result - max 2 minutes
    let attempts = 0;
    const maxAttempts = 24;
    let completed = false;

    while (attempts < maxAttempts && !completed) {
      await new Promise(r => setTimeout(r, 5000));
      attempts++;

      try {
        const statusRes = await fetch(`https://queue.fal.run/fal-ai/sync-lipsync/v2/requests/${requestId}/status`, {
          headers: { Authorization: `Key ${FAL_AI_API_KEY}` },
        });

        if (!statusRes.ok) continue;
        const statusData = await statusRes.json();

        if (statusData.status === "COMPLETED") {
          const resultRes = await fetch(`https://queue.fal.run/fal-ai/sync-lipsync/v2/requests/${requestId}`, {
            headers: { Authorization: `Key ${FAL_AI_API_KEY}` },
          });
          const resultData = await resultRes.json();
          const videoUrl = resultData.video?.url;

          await supabase.from("video_jobs").update({
            status: "completed",
            video_url: videoUrl || job.video_url,
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
      console.log(`Lipsync job ${jobId} still processing after timeout`);
    }

    return new Response(JSON.stringify({ success: true, requestId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lipsync-video error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
