import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Nicht authentifiziert");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !user) throw new Error("Nicht authentifiziert");
    const { data: roleData } = await sb.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Kein Admin-Zugriff");

    const { action, topic, category, blog_id } = await req.json();

    if (action === "trending") {
      // Get trending topics from recent chat categories
      const { data: logs } = await sb
        .from("training_data_logs")
        .select("category, user_input")
        .order("created_at", { ascending: false })
        .limit(100);

      const categoryCount: Record<string, number> = {};
      const topicSnippets: Record<string, string[]> = {};
      for (const log of logs || []) {
        const cat = log.category || "general";
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        if (log.user_input && (!topicSnippets[cat] || topicSnippets[cat].length < 3)) {
          if (!topicSnippets[cat]) topicSnippets[cat] = [];
          topicSnippets[cat].push(log.user_input.slice(0, 100));
        }
      }

      const trends = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([cat, count]) => ({
          category: cat,
          count,
          snippets: topicSnippets[cat] || [],
        }));

      // Mock OpenClaw data
      const openClawMock = [
        { category: "hoof-rehab", count: 45, snippets: ["Hufrehe Nachsorge Strategien", "Barhuf-Umstellung Tipps"] },
        { category: "equine-nutrition", count: 38, snippets: ["Fütterung im Winter", "Mineralstoff-Analyse"] },
        { category: "stable-tech", count: 27, snippets: ["Smart Stable Sensoren", "Automatische Tränken"] },
      ];

      return new Response(JSON.stringify({ trends, openClaw: openClawMock }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `Du bist der Content-Writer von HufiAi. Schreibe Blog-Artikel in der 'Empathisch-Professionellen' Tonalität:
- Unterstützend, sachlich und bescheiden
- Verwende Formulierungen wie "Basierend auf aktuellen Erkenntnissen..."
- Betone stets die Zusammenarbeit mit Fachleuten vor Ort
- Strukturiere mit Markdown: H2-Überschriften, Listen, fett markierte Kernaussagen
- Länge: ca. 1.000 Wörter
- Schließe IMMER mit einem Hinweis ab: "⚖️ Dieser Artikel dient der Information und ersetzt keine fachliche Beratung durch qualifizierte Experten vor Ort."
- Schreibe auf Deutsch.`,
            },
            {
              role: "user",
              content: `Schreibe einen ausführlichen Blog-Artikel (ca. 1.000 Wörter) zum Thema: "${topic}"\nKategorie: ${category || "general"}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI error:", response.status, errText);
        throw new Error("KI-Generierung fehlgeschlagen");
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || "";

      // Generate excerpt
      const excerptMatch = content.match(/^[^#]*?(?=\n|$)/);
      const excerpt = content.slice(0, 200).replace(/[#*]/g, "").trim() + "…";

      // Generate slug
      const slug = topic
        .toLowerCase()
        .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        .slice(0, 60) + "-" + Date.now().toString(36);

      // Save as draft
      const { data: post, error: insertErr } = await sb.from("blog_posts").insert({
        title: topic,
        slug,
        content,
        excerpt,
        category: category || "general",
        status: "draft",
        author_id: user.id,
      }).select("id, title, slug, status").single();

      if (insertErr) throw insertErr;

      return new Response(JSON.stringify({ post, content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_image") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: `Generate a professional, warm-toned featured image for a horse care blog article about: "${topic}". Style: editorial photography feel, warm natural lighting, horses in nature. Aspect ratio 16:9, ultra high resolution.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) throw new Error("Bild-Generierung fehlgeschlagen");

      const imgData = await response.json();
      const imageBase64 = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageBase64 || !blog_id) {
        return new Response(JSON.stringify({ image_url: imageBase64 || null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upload to storage
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `blog/${blog_id}-${Date.now()}.png`;

      const { error: uploadErr } = await sb.storage.from("blog-images").upload(fileName, binaryData, { contentType: "image/png" });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = sb.storage.from("blog-images").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      await sb.from("blog_posts").update({ image_url: publicUrl }).eq("id", blog_id);

      return new Response(JSON.stringify({ image_url: publicUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "publish") {
      if (!blog_id) throw new Error("blog_id required");
      const { error } = await sb.from("blog_posts").update({
        status: "published",
        published_at: new Date().toISOString(),
      }).eq("id", blog_id);
      if (error) throw error;

      // Mock webhook for social media / news portal
      console.log(`[WEBHOOK MOCK] Blog post ${blog_id} published → Social Media & News Portal notification triggered`);

      return new Response(JSON.stringify({ success: true, webhook: "mock_triggered" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (e) {
    console.error("generate-blog error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
