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

    const { url, options } = await req.json();
    if (!url) throw new Error("URL is required");

    const dualLanguage = options?.dualLanguage ?? false;

    console.log("Autopilot: Scanning URL:", url, "dualLanguage:", dualLanguage);

    // Step 1: Scrape the target URL
    let pageContent = "";
    let extractedColors: string[] = [];

    try {
      const scrapeResponse = await fetch(url, {
        headers: { "User-Agent": "HufiAi-Autopilot/1.0" },
      });
      if (!scrapeResponse.ok) throw new Error(`Fetch failed: ${scrapeResponse.status}`);
      const html = await scrapeResponse.text();

      pageContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 10000);

      const colorRegex = /#[0-9a-fA-F]{6}/g;
      const matches = html.match(colorRegex) || [];
      const freq: Record<string, number> = {};
      matches.forEach(c => { freq[c.toUpperCase()] = (freq[c.toUpperCase()] || 0) + 1; });
      extractedColors = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([c]) => c);
    } catch (e) {
      console.error("Scrape error:", e);
      pageContent = `Webseite ${url} - Erstelle ein professionelles Video basierend auf Hufbearbeitung und Pferdegesundheit.`;
      extractedColors = ["#333333", "#666666", "#FFFFFF"];
    }

    // Step 2: AI generates the autopilot script (German)
    const systemPrompt = `Du bist der HufiAi Autopilot-Produzent – ein autonomer Content-Agent für professionelle Video-Produktion im Bereich Hufbearbeitung und Pferdegesundheit.

Du analysierst Webseiten-Daten (Dashboards, Kundenportale, Analyse-Tools) und erstellst daraus ein vollständiges Video-Produktionsskript.

DEINE AUFGABEN:
1. Erkenne relevante Daten: Pferdedaten, Ganganalysen, Hufwinkel, Stall-Protokolle, Kundenfeedbacks
2. Erstelle 3-5 Szenen mit klarer Storytelling-Struktur
3. Wähle für JEDE Szene das optimale Modell:
   - "hunyuan-video": Biomechanische Bewegungen (Galopp, Trab, Ganganalysen)
   - "wan-2.2": Fotorealistische Stall-Atmosphäre, Nahaufnahmen von Hufen
   - "skyreels-v1": Trainer-Erklärvideos, Interview-Perspektive
   - "open-sora-2": Panorama-Koppel-Aufnahmen, Landschaften
   - "mochi-1": Schnelle Schnitte, dynamische Übergänge
4. Erstelle Dynamic Overlays: Wenn du Daten wie Hufwinkel-Verbesserungen findest, generiere entsprechende Text-Overlays
5. Halte STRIKT die Brand-Colors: Orange #F47B20 (Primär), Schwarz, Weiß

ERKANNTE FARBEN DER WEBSEITE: ${extractedColors.join(", ")}

WICHTIG: Antworte NUR mit einem JSON-Objekt (kein Markdown, kein Text).`;

    const userPrompt = `Analysiere diesen Webseiten-Inhalt und erstelle ein Autopilot-Video-Produktionsskript:

URL: ${url}
HD Export: ${options?.hdExport ? "Ja" : "Nein"}
Dynamic Overlays: ${options?.autoOverlay ? "Ja" : "Nein"}

WEBSEITEN-INHALT:
${pageContent}

Erstelle ein JSON-Objekt:
{
  "title": "Produktions-Titel",
  "summary": "Was der Agent aus den Daten erkannt hat",
  "data_insights": ["Erkanntes Datenelement 1", "Erkanntes Datenelement 2"],
  "brand_colors": ["#farbe1", "#farbe2"],
  "dominant_color": "#hauptfarbe",
  "scenes": [
    {
      "scene_number": 1,
      "title": "Szenen-Titel",
      "prompt": "Hochdetaillierter Video-Prompt. Beschreibe Kamerawinkel, Beleuchtung, Stimmung, Bewegung.",
      "model": "wan-2.2",
      "model_reason": "Begründung für die Modellwahl",
      "duration": 5,
      "style": "realistic",
      "color_mood": "warm amber tones, #F47B20 accent",
      "overlay_text": "Hufwinkel: 52° → 54° (+2°)",
      "data_source": "Welche Daten als Grundlage dienten"
    }
  ],
  "formats": {
    "reel": { "aspect_ratio": "9:16", "description": "Schnelle Schnitte, Action/Emotion, Untertitel-Overlay" },
    "youtube": { "aspect_ratio": "16:9", "description": "Erklärender Stil, technische Details" },
    "square": { "aspect_ratio": "1:1", "description": "Infografiken, kurze Clips" }
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
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let script;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      script = JSON.parse(jsonMatch[1]!.trim());
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Content:", content.slice(0, 500));
      throw new Error("KI-Antwort konnte nicht geparst werden. Bitte versuche es erneut.");
    }

    // Ensure HufiAi orange is always present
    if (!script.brand_colors?.includes("#F47B20")) {
      script.brand_colors = [...(script.brand_colors || []), "#F47B20"];
    }

    console.log("Autopilot: Script generated with", script.scenes?.length, "scenes");

    // Step 3: If dual-language requested, translate to English
    let scriptEn = null;
    if (dualLanguage) {
      console.log("Autopilot: Translating to English...");
      const translatePrompt = `Translate the following German video production script to English. Adapt culturally for an international audience (e.g. convert cm to inches where relevant, use English equestrian terminology). Keep the exact same JSON structure. Return ONLY a JSON object, no markdown.

German script:
${JSON.stringify(script)}`;

      try {
        const translateResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are a professional translator specializing in equestrian content. Translate German to English with cultural adaptations. Return ONLY valid JSON." },
              { role: "user", content: translatePrompt },
            ],
            temperature: 0.3,
          }),
        });

        if (translateResponse.ok) {
          const translateData = await translateResponse.json();
          const enContent = translateData.choices?.[0]?.message?.content || "";
          try {
            const enJsonMatch = enContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, enContent];
            scriptEn = JSON.parse(enJsonMatch[1]!.trim());
            if (!scriptEn.brand_colors?.includes("#F47B20")) {
              scriptEn.brand_colors = [...(scriptEn.brand_colors || []), "#F47B20"];
            }
            console.log("Autopilot: English translation complete");
          } catch {
            console.error("English translation parse error");
          }
        }
      } catch (e) {
        console.error("Translation error:", e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      script,
      scriptEn,
      extractedColors,
      dualLanguage: dualLanguage && scriptEn !== null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("autopilot-produce error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
