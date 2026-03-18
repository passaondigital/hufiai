import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { query } = await req.json();
    if (!query || query.trim().length === 0) throw new Error("Missing search query");

    const searchTerms = query.toLowerCase().trim();

    // Keyword-based search across user_memory
    // Split query into words for broader matching
    const words = searchTerms.split(/\s+/).filter((w: string) => w.length > 2);

    const { data: allMemories, error: memError } = await supabase
      .from("user_memory")
      .select("id, fact, category, importance, confidence, use_count, created_at, last_used_at")
      .eq("user_id", user.id)
      .order("importance", { ascending: false });

    if (memError) throw memError;

    if (!allMemories || allMemories.length === 0) {
      return new Response(JSON.stringify({ results: [], total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Score each memory based on keyword overlap
    const scored = allMemories.map((mem: any) => {
      const factLower = mem.fact.toLowerCase();
      const catLower = (mem.category || "").toLowerCase();

      let score = 0;

      // Exact phrase match (highest score)
      if (factLower.includes(searchTerms)) {
        score += 10;
      }

      // Individual word matches
      for (const word of words) {
        if (factLower.includes(word)) score += 3;
        if (catLower.includes(word)) score += 1;
      }

      // Boost by importance
      score += (mem.importance || 1) * 0.5;

      // Boost by recency
      if (mem.last_used_at) {
        const daysSinceUse = (Date.now() - new Date(mem.last_used_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUse < 7) score += 2;
        else if (daysSinceUse < 30) score += 1;
      }

      return { ...mem, score };
    });

    // Filter out zero-score results and sort by score
    const results = scored
      .filter((m: any) => m.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 20)
      .map((m: any) => ({
        id: m.id,
        fact: m.fact,
        category: m.category,
        importance: m.importance,
        confidence: m.confidence,
        useCount: m.use_count,
        score: m.score,
        createdAt: m.created_at,
        lastUsedAt: m.last_used_at,
      }));

    // Also search in conversations for context recall
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const relatedConversations = (conversations || [])
      .filter((c: any) => c.title && c.title.toLowerCase().includes(searchTerms))
      .slice(0, 5)
      .map((c: any) => ({
        id: c.id,
        title: c.title,
        createdAt: c.created_at,
      }));

    return new Response(JSON.stringify({
      results,
      total: results.length,
      relatedConversations,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-memory error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
