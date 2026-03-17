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
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { prompt, style, size, model } = await req.json();
    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build styled prompt
    const styleMap: Record<string, string> = {
      modern: "Modern, clean, professional design style.",
      minimalist: "Minimalist, elegant, lots of whitespace.",
      vibrant: "Vibrant, colorful, eye-catching design with bold colors.",
      vintage: "Vintage, retro aesthetic with warm tones and film grain.",
      watercolor: "Soft watercolor illustration style with flowing colors.",
      "3d": "High-quality 3D rendered style with realistic lighting.",
      flat: "Flat design illustration with simple shapes and solid colors.",
      neon: "Neon glow aesthetic with dark background and vivid lights.",
    };

    const sizeMap: Record<string, string> = {
      "1080x1080": "Square format (1:1 ratio), perfect for Instagram posts.",
      "1080x1920": "Vertical format (9:16 ratio), perfect for Instagram Stories/Reels.",
      "1200x630": "Horizontal format (roughly 1.9:1 ratio), perfect for LinkedIn/Facebook posts.",
      "1500x500": "Wide banner format (3:1 ratio), perfect for Twitter/X header.",
      "1920x1080": "Landscape format (16:9 ratio), perfect for YouTube thumbnails.",
    };

    const styledPrompt = [
      prompt,
      styleMap[style] || "",
      sizeMap[size] || "",
      "High quality, professional output.",
    ].filter(Boolean).join(" ");

    const selectedModel = model || "google/gemini-3-pro-image-preview";

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "user", content: styledPrompt }],
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
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return new Response(JSON.stringify({ error: "Kein Bild generiert" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload base64 image to storage
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const storagePath = `${userId}/ai-image-${Date.now()}.png`;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { error: uploadError } = await adminClient.storage
      .from("generated-images")
      .upload(storagePath, binaryData, { contentType: "image/png" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Return base64 directly as fallback
      return new Response(JSON.stringify({ image_url: imageData, storage_path: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = adminClient.storage.from("generated-images").getPublicUrl(storagePath);

    // Save to generated_images table
    await adminClient.from("generated_images").insert({
      user_id: userId,
      prompt,
      preset: style || "modern",
      storage_path: storagePath,
      image_url: urlData.publicUrl,
    });

    return new Response(JSON.stringify({
      image_url: urlData.publicUrl,
      storage_path: storagePath,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
