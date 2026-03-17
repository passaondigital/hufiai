import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageUrl, action, settings } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build instruction based on action
    let instruction = "";
    const s = settings || {};

    switch (action) {
      case "resize": {
        const w = s.width || 1080;
        const h = s.height || 1080;
        instruction = `Resize this image to exactly ${w}x${h} pixels. Maintain the subject centered and cropped appropriately. Do not add borders or letterboxing.`;
        break;
      }
      case "filter": {
        const filterMap: Record<string, string> = {
          grayscale: "Convert this image to black and white / grayscale. Keep all details intact.",
          sepia: "Apply a warm sepia tone filter to this image, giving it a vintage photograph look.",
          vintage: "Apply a vintage film filter: slightly faded colors, warm tones, subtle grain, and soft vignette.",
          vibrant: "Increase the color vibrance and saturation significantly. Make colors pop while keeping it natural.",
          cinematic: "Apply cinematic color grading: teal shadows, warm highlights, slight contrast boost, film-like look.",
          cool: "Apply a cool blue tone color shift. Make the image feel cold and crisp.",
          warm: "Apply a warm golden tone. Make the image feel sunny and inviting.",
          dramatic: "Apply dramatic high-contrast processing with deep shadows and bright highlights.",
          soft: "Apply a soft dreamy filter: slightly reduced contrast, gentle warmth, subtle glow effect.",
          hdr: "Apply HDR-style processing: enhanced detail in shadows and highlights, vivid but natural colors.",
        };
        const filterName = s.filter || "vibrant";
        instruction = filterMap[filterName] || filterMap.vibrant;
        break;
      }
      case "crop": {
        const ratioMap: Record<string, string> = {
          "1:1": "square (1:1)",
          "4:5": "portrait 4:5 (Instagram portrait)",
          "9:16": "vertical 9:16 (Stories/Reels)",
          "16:9": "landscape 16:9 (YouTube thumbnail)",
          "3:4": "portrait 3:4",
          "4:3": "landscape 4:3",
        };
        const ratio = s.aspectRatio || "1:1";
        const ratioDesc = ratioMap[ratio] || ratio;
        instruction = `Crop this image to ${ratioDesc} aspect ratio. Keep the main subject centered and visible. Do not stretch or distort.`;
        break;
      }
      case "remove-bg": {
        instruction = "Remove the background from this image completely. Keep only the main subject with a clean transparent/white background. Maintain crisp edges around the subject.";
        break;
      }
      case "enhance": {
        instruction = "Enhance this image: improve sharpness, optimize exposure, boost clarity, reduce noise, and make colors more balanced. Keep it looking natural and professional.";
        break;
      }
      case "watermark": {
        const text = s.text || "© HufiAI";
        instruction = `Add a subtle semi-transparent watermark text "${text}" to the bottom-right corner of this image. Make it visible but not distracting.`;
        break;
      }
      case "format": {
        const fmt = s.format || "png";
        instruction = `Output this image in ${fmt.toUpperCase()} format. Maintain the original quality and dimensions.`;
        break;
      }
      default: {
        if (s.customInstruction) {
          instruction = s.customInstruction;
        } else {
          instruction = "Enhance this image slightly: improve quality while maintaining the original look.";
        }
      }
    }

    console.log(`Processing image: action=${action}, instruction=${instruction.slice(0, 100)}...`);

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: instruction },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es gleich nochmal." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "AI-Credits aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await res.json();
    const processedImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!processedImage) {
      return new Response(JSON.stringify({ error: "Bildverarbeitung fehlgeschlagen" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const base64Data = processedImage.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const ext = s.format || "png";
    const storagePath = `${user.id}/processed-${action}-${Date.now()}.${ext}`;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { error: uploadError } = await adminClient.storage
      .from("generated-images")
      .upload(storagePath, binaryData, { contentType: `image/${ext}` });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ image_url: processedImage, storage_path: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = adminClient.storage.from("generated-images").getPublicUrl(storagePath);

    // Save to generated_content
    await adminClient.from("generated_content").insert({
      user_id: user.id,
      type: "image",
      title: `${action} – ${new Date().toLocaleDateString("de-DE")}`,
      original_prompt: instruction,
      file_url: urlData.publicUrl,
      format: ext,
      social_platform: s.platform || null,
      dimensions: s.width && s.height ? `${s.width}x${s.height}` : null,
    });

    return new Response(JSON.stringify({
      image_url: urlData.publicUrl,
      storage_path: storagePath,
      action,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
