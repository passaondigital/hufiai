import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { url, action } = await req.json();
    if (!url) throw new Error("URL is required");

    // Step 1: Scrape the webpage
    console.log("Scraping URL:", url);
    let pageContent = "";
    try {
      const scrapeResponse = await fetch(url, {
        headers: { "User-Agent": "HufiAi-Agent/1.0" },
      });
      if (!scrapeResponse.ok) throw new Error(`Fetch failed: ${scrapeResponse.status}`);
      const html = await scrapeResponse.text();

      // Extract text content from HTML (simple approach)
      pageContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000); // Limit context
    } catch (e) {
      console.error("Scrape error:", e);
      pageContent = `Webseite konnte nicht geladen werden: ${url}. Erstelle ein generisches Video-Skript basierend auf der URL.`;
    }

    // Step 2: Extract dominant colors from HTML (look for CSS colors)
    let extractedColors: string[] = [];
    try {
      const scrapeResponse = await fetch(url, {
        headers: { "User-Agent": "HufiAi-Agent/1.0" },
      });
      const html = await scrapeResponse.text();
      const colorRegex = /#[0-9a-fA-F]{6}/g;
      const matches = html.match(colorRegex) || [];
      // Count frequency
      const freq: Record<string, number> = {};
      matches.forEach(c => { freq[c.toUpperCase()] = (freq[c.toUpperCase()] || 0) + 1; });
      extractedColors = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([c]) => c);
    } catch {
      extractedColors = ["#333333", "#666666", "#FFFFFF"];
    }

    // Step 3: AI generates video script with scene breakdown
    const systemPrompt = `Du bist ein professioneller Video-Regisseur und Content-Stratege für HufiAi, eine Plattform für Hufbearbeitung und Pferdegesundheit.

Du analysierst Webseiten-Inhalte und erstellst daraus professionelle Video-Skripte.

REGELN:
1. Erstelle IMMER 3-5 Szenen
2. Wähle für JEDE Szene das beste Modell:
   - "wan-2.2": Allrounder, beste Wahl für die meisten Szenen
   - "hunyuan-video": Physik-intensive Szenen (Galopp, Bewegung, Wasser)
   - "skyreels-v1": Cinematische Nahaufnahmen, emotionale Szenen
   - "open-sora-2": Lange, panoramische Szenen, Landschaften
   - "mochi-1": Schnelle Cuts, Dynamik, kurze Szenen
3. Passe die Farbstimmung an die erkannten Webseiten-Farben an
4. HufiAi-Orange (#F47B20) IMMER als Akzent behalten
5. Jeder Prompt muss detailliert und visuell beschreibend sein
6. Stil pro Szene wählen: "realistic", "comic", "3d", "vintage"

Die erkannten Farben der Webseite sind: ${extractedColors.join(", ")}

Antworte NUR mit einem JSON-Objekt (kein Markdown, kein Text davor/danach).`;

    const userPrompt = `Analysiere den folgenden Webseiten-Inhalt und erstelle ein Video-Skript:

URL: ${url}
Erkannte Farben: ${extractedColors.join(", ")}

INHALT:
${pageContent}

Erstelle ein JSON-Objekt mit dieser Struktur:
{
  "title": "Video-Titel",
  "summary": "Kurze Beschreibung des Videos",
  "brand_colors": ["#color1", "#color2", ...],
  "dominant_color": "#hauptfarbe",
  "scenes": [
    {
      "scene_number": 1,
      "title": "Szenen-Titel",
      "prompt": "Detaillierter Video-Prompt für die KI",
      "model": "wan-2.2",
      "model_reason": "Begründung warum dieses Modell",
      "aspect_ratio": "16:9",
      "duration": 5,
      "style": "realistic",
      "color_mood": "warm tones, amber, #F47B20 accent"
    }
  ],
  "multi_output": {
    "reel": { "aspect_ratio": "9:16", "scenes": [1,2,3] },
    "youtube": { "aspect_ratio": "16:9", "scenes": [1,2,3,4,5] },
    "square": { "aspect_ratio": "1:1", "scenes": [1,3,5] }
  }
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es in einer Minute erneut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits aufgebraucht. Bitte lade dein Workspace auf." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let script;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      script = JSON.parse(jsonMatch[1]!.trim());
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Content:", content.slice(0, 500));
      throw new Error("KI-Antwort konnte nicht geparst werden. Bitte versuche es erneut.");
    }

    // Ensure brand colors include HufiAi orange
    if (!script.brand_colors?.includes("#F47B20")) {
      script.brand_colors = [...(script.brand_colors || []), "#F47B20"];
    }

    return new Response(JSON.stringify({ success: true, script, extractedColors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("web-to-video error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
