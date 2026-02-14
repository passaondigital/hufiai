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
    // Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    const verifiedUserId = claimsData.claims.sub as string;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const { action } = body;

    // New media intelligence actions
    if (action === "analyze_video") return await handleVideoAnalysis(body, LOVABLE_API_KEY);
    if (action === "speech_to_text") return await handleSTT(body, LOVABLE_API_KEY);
    if (action === "text_to_speech") return await handleTTS(body, LOVABLE_API_KEY);
    if (action === "generate_image") return await handleImageGeneration(body, LOVABLE_API_KEY);

    // Legacy content generation
    return await handleContentGeneration(body, LOVABLE_API_KEY, verifiedUserId);
  } catch (e) {
    console.error("generate-content error:", e);
    const status = (e as any).status || 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Legacy Content Generation ───────────────────────────────────
async function handleContentGeneration(body: any, apiKey: string, verifiedUserId: string) {
  const { idea, content_type } = body;
  if (!idea || !content_type) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const typePrompts: Record<string, string> = {
    reel: "Instagram Reel Script mit Hook (erster Satz), visuellen Ideen (Szenen-Beschreibungen) und Call-to-Action. Format: Hook, Szene 1-3, CTA, Hashtags.",
    linkedin: "Professioneller LinkedIn/Facebook Post mit storytelling-Ansatz. Format: Einstieg, Hauptteil, Takeaway, Hashtags.",
    blog: "Blog-Beitrag Entwurf mit H2-Überschriften, Einleitung, 3 Abschnitten und Fazit. SEO-optimiert für die Pferdebranche.",
    podcast: "Podcast-Outline mit Intro, 3-5 Talking Points mit Unterpunkten, und Outro. Gesprächsformat.",
    post: "Social Media Post (kurz & knackig) mit Hook, Kernaussage und Hashtags.",
  };

  const systemPrompt = `Du bist ein Marketing-Experte für die Pferdebranche (Hufschmiede, Tierärzte, Reitbetriebe). 
Erstelle professionellen Content auf Deutsch. 
Antworte IMMER mit einem JSON-Objekt (kein Markdown drumherum):
{
  "title": "Kurzer, packender Titel",
  "hook": "Der erste Satz / Aufhänger",
  "content": "Der vollständige Content",
  "visual_ideas": "Visuelle Ideen / Szenen (für Video/Bild-Content)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

  const userPrompt = `Erstelle: ${typePrompts[content_type] || typePrompts.post}\n\nThema/Idee: ${idea}`;

  const aiResponse = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!aiResponse.ok) {
    if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit erreicht." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "KI-Credits aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    throw new Error("AI gateway error");
  }

  const aiData = await aiResponse.json();
  const raw = aiData.choices?.[0]?.message?.content || "";
  
  let parsed;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: idea, content: raw, hook: "", hashtags: [] };
  } catch {
    parsed = { title: idea, content: raw, hook: "", visual_ideas: "", hashtags: [] };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, supabaseKey);

  const { data: item, error } = await sb.from("content_items").insert({
    user_id: verifiedUserId,
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
}

// ─── Video Analysis (3 Expert Modes) ─────────────────────────────
const VIDEO_PROMPTS: Record<string, string> = {
  hooks: `Du bist ein erfahrener Content-Strategist für die Pferdebranche. Analysiere das Video und erstelle 3 verschiedene Hooks.

Stil: Fachlich kompetent, provokant oder lösungsorientiert.
Vorgabe: Vermeide Floskeln wie "Wusstest du schon...". Nutze stattdessen Insider-Wissen (z.B. "Warum die weiße Linie dir die Wahrheit sagt...").
Branding: Nutze Begriffe aus dem HufiAi-Universum (Präzision, Fakten, Pferdewohl).
Format: Nummeriere die Hooks (1-3) und erkläre jeweils kurz die Strategie dahinter.
Sprache: Deutsch.`,

  caption: `Schreibe eine packende Bildunterschrift (Caption) basierend auf der Video-Analyse.

Struktur: Kurze Einleitung, 3 Bulletpoints mit Mehrwert, 1 Call-to-Action (CTA).
Tonalität: Authentisch, wie Pascal Schmid – direkt vom Pferd, ehrlich und modern.
CTA: Lenke die Leute immer dezent in Richtung "HufiAi Founder Flow" oder "Teste die Analyse selbst".
Füge am Ende 10-15 relevante Hashtags hinzu (#Hufpflege #Barhuf #HufiAi etc.).
Sprache: Deutsch.`,

  report: `Extrahiere alle fachlichen Beobachtungen aus dem Video. Erstelle ein technisches Protokoll:

1. **Beobachteter Hufzustand** – Detaillierte Beschreibung aller sichtbaren Merkmale.
2. **Besprochene Maßnahmen** – Was wurde durchgeführt oder empfohlen?
3. **Empfohlene Intervalle** – Nächster Termin, Kontrollzeiträume.
4. **Zusätzliche Anmerkungen** – Relevante Details für die Akte.

Formatiere dies so, dass es direkt als Kundenbericht in das HufiAi-Dashboard übernommen werden kann.
Sprache: Deutsch, fachlich präzise.`,
};

async function handleVideoAnalysis(body: any, apiKey: string) {
  const { model, mode, video_base64, video_type, file_name } = body;
  const useModel = model || "google/gemini-2.5-flash";
  const systemPrompt = VIDEO_PROMPTS[mode] || VIDEO_PROMPTS.hooks;

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: useModel,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `Analysiere dieses Video (${file_name || "video"}).` },
            { type: "image_url", image_url: { url: `data:${video_type || "video/mp4"};base64,${video_base64}` } }
          ]
        }
      ],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error("Video analysis error:", response.status, t);
    throw new Error(`Video-Analyse fehlgeschlagen (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  return new Response(JSON.stringify({ content }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Speech to Text ──────────────────────────────────────────────
async function handleSTT(body: any, apiKey: string) {
  const { model, audio_base64, audio_type } = body;
  const useModel = model || "google/gemini-2.5-flash";

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: useModel,
      messages: [
        {
          role: "system",
          content: "Du bist ein präziser Transkriptionsdienst. Transkribiere das folgende Audio wortgetreu auf Deutsch. Gib NUR den transkribierten Text zurück, ohne Kommentare oder Erklärungen."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Transkribiere dieses Audio:" },
            { type: "image_url", image_url: { url: `data:${audio_type || "audio/webm"};base64,${audio_base64}` } }
          ]
        }
      ],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error("STT error:", response.status, t);
    throw new Error(`Transkription fehlgeschlagen (${response.status})`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";

  return new Response(JSON.stringify({ text }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Text to Speech (Branded Voice Personas) ────────────────────
async function handleTTS(body: any, apiKey: string) {
  const { text, voice } = body;
  
  const voicePersona = voice === "male"
    ? `"Der Mentor" – eine tiefe, ruhige, vertrauenserweckende männliche Stimme. Perfekt für Analyse-Auswertungen und fachliche Erklärungen. Sprich langsam und bedacht, mit natürlichen Pausen bei Kommas und Punkten.`
    : `"Die Innovatorin" – eine klare, motivierende, dynamische weibliche Stimme. Perfekt für Tutorials und Dashboard-Erklärungen. Sprich klar und energisch, aber nicht gehetzt.`;

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Bereite den folgenden Text für die HufiAi-Stimme ${voicePersona} auf. Optimiere Satzzeichen, Pausen (mit "...") und Betonungen für natürliches Vorlesen auf Deutsch. Gib NUR den optimierten Text zurück, ohne Kommentare.`
        },
        { role: "user", content: text }
      ],
    }),
  });

  if (!response.ok) throw new Error("TTS preparation failed");

  const data = await response.json();
  const optimizedText = data.choices?.[0]?.message?.content || text;

  return new Response(JSON.stringify({ optimized_text: optimizedText, voice_type: voice, use_web_speech: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Image Generation ────────────────────────────────────────────
async function handleImageGeneration(body: any, apiKey: string) {
  const { prompt } = body;

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: `Erstelle ein hochqualitatives Bild: ${prompt}. Ultra high resolution, professionelle Qualität.` }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error("Image gen error:", response.status, t);
    throw new Error(`Bildgenerierung fehlgeschlagen (${response.status})`);
  }

  const data = await response.json();
  const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageData) throw new Error("Kein Bild generiert");

  return new Response(JSON.stringify({ image_url: imageData }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
