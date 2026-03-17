import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, source, type, page, perPage } = await req.json();
    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pageNum = page || 1;
    const itemsPerPage = Math.min(perPage || 20, 40);
    const mediaSource = source || "pexels";
    const mediaType = type || "photos";

    let results: any[] = [];
    let totalResults = 0;

    if (mediaSource === "pexels") {
      const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
      if (!PEXELS_API_KEY) {
        return new Response(JSON.stringify({ error: "PEXELS_API_KEY not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const endpoint = mediaType === "videos"
        ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${itemsPerPage}&page=${pageNum}`
        : `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${itemsPerPage}&page=${pageNum}`;

      const res = await fetch(endpoint, {
        headers: { Authorization: PEXELS_API_KEY },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Pexels API error:", res.status, errText);
        throw new Error(`Pexels API error: ${res.status}`);
      }

      const data = await res.json();
      totalResults = data.total_results || 0;

      if (mediaType === "videos") {
        results = (data.video_files || data.videos || []).map((v: any) => ({
          id: `pexels-${v.id}`,
          url: v.video_files?.[0]?.link || v.url || "",
          thumbnailUrl: v.image || v.video_pictures?.[0]?.picture || "",
          photographer: v.user?.name || "Pexels",
          photographerUrl: v.user?.url || "",
          source: "pexels",
          downloadUrl: v.video_files?.[0]?.link || v.url || "",
          width: v.width || 1920,
          height: v.height || 1080,
          type: "video",
          duration: v.duration || 0,
        }));
      } else {
        results = (data.photos || []).map((p: any) => ({
          id: `pexels-${p.id}`,
          url: p.src?.large || p.src?.original,
          thumbnailUrl: p.src?.medium || p.src?.small,
          photographer: p.photographer || "Pexels",
          photographerUrl: p.photographer_url || "",
          source: "pexels",
          downloadUrl: p.src?.original,
          width: p.width,
          height: p.height,
          type: "photo",
          avgColor: p.avg_color || null,
        }));
      }
    } else if (mediaSource === "unsplash") {
      const UNSPLASH_API_KEY = Deno.env.get("UNSPLASH_API_KEY");
      if (!UNSPLASH_API_KEY) {
        return new Response(JSON.stringify({ error: "UNSPLASH_API_KEY not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${itemsPerPage}&page=${pageNum}`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_API_KEY}` } }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("Unsplash API error:", res.status, errText);
        throw new Error(`Unsplash API error: ${res.status}`);
      }

      const data = await res.json();
      totalResults = data.total || 0;

      results = (data.results || []).map((p: any) => ({
        id: `unsplash-${p.id}`,
        url: p.urls?.regular,
        thumbnailUrl: p.urls?.small,
        photographer: p.user?.name || "Unsplash",
        photographerUrl: p.user?.links?.html || "",
        source: "unsplash",
        downloadUrl: p.urls?.full,
        width: p.width,
        height: p.height,
        type: "photo",
        avgColor: p.color || null,
        blurHash: p.blur_hash || null,
      }));
    }

    return new Response(JSON.stringify({
      results,
      total: totalResults,
      page: pageNum,
      perPage: itemsPerPage,
      source: mediaSource,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("stock-media error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
