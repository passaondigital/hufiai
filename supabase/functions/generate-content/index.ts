import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea, content_type, user_id } = await req.json();
    if (!idea || !content_type || !user_id) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const typePrompts: Record<string, string> = {
      reel: "Instagram Reel Script mit Hook (erster Satz), visuellen Ideen (Szenen-Beschreibungen) und Call-to-Action. Format: Hook, Szene 1-3, CTA, Hashtags.",
      linkedin: "Professioneller LinkedIn/Facebook Post mit storytelling-Ansatz. Format: Einstieg, Hauptteil, Takeaway, Hashtags.",
      blog: "Blog-Beitrag Entwurf mit H2-Überschriften, Einleitung, 3 Abschnitten und Fazit. SEO-optimiert für die Pferdebranche.",
      podcast: "Podcast-Outline mit Intro, 3-5 Talking Points mit Unterpunkten, und Outro. Gesprächsformat.",
      post: "Social Media Post (kurz & knackig) mit Hook, Kernaussage und Hashtags.",
    };

    const systemPrompt = `Du bist ein Marketing-Experte für die Pferdebranche (Hufschmiede, Tierärzte, Reitbetriebe). 
Erstelle professionellen Content auf Deutsch. Der Ton ist kompetent aber nahbar.
Antworte IMMER mit einem JSON-Objekt (kein Markdown drumherum):
{
  "title": "Kurzer, packender Titel",
  "hook": "Der erste Satz / Aufhänger",
  "content": "Der vollständige Content",
  "visual_ideas": "Visuelle Ideen / Szenen (für Video/Bild-Content)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

    const userPrompt = `Erstelle: ${typePrompts[content_type] || typePrompts.post}\n\nThema/Idee: ${idea}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es später erneut." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "KI-Credits aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const raw = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: idea, content: raw, hook: "", hashtags: [] };
    } catch {
      parsed = { title: idea, content: raw, hook: "", visual_ideas: "", hashtags: [] };
    }

    // Insert into DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: item, error } = await sb.from("content_items").insert({
      user_id,
      title: parsed.title || idea,
      content_type,
      content: parsed.content || "",
      hook: parsed.hook || "",
      visual_ideas: parsed.visual_ideas || "",
      hashtags: parsed.hashtags || [],
      status: "draft",
    }).select("*").single();

    if (error) throw error;

    return new Response(JSON.stringify({ item }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
