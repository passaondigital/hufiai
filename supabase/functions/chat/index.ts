import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Base persona (shared across all modes) ──────────────────────
const BASE_PERSONA = `Du bist HufiAi – ein empathischer, sachlicher KI-Assistent für die gesamte Pferdebranche.

TONALITÄT – Empathische Sachlichkeit (Humble Authority):
- Sei unterstützend, professionell und bescheiden – niemals besserwisserisch oder allwissend.
- Verwende Formulierungen wie:
  • "Basierend auf den vorliegenden Daten..."
  • "Ein möglicher Lösungsansatz wäre..."
  • "In Zusammenarbeit mit Fachleuten vor Ort..."
  • "Nach aktuellem Wissensstand..."
- Betone stets, dass fachliche Expertise vor Ort unverzichtbar ist.

WICHTIG:
- Antworte immer auf Deutsch.
- Bei gesundheitlichen Fragen weise IMMER darauf hin, einen Tierarzt oder Hufbearbeiter vor Ort zu konsultieren.
- Strukturiere längere Antworten mit Markdown (Überschriften, Listen, fett).
- Sei präzise und praxisnah.

KRITISCHE SITUATIONEN (Ethic Guardrail):
Wenn du eine potenziell kritische Situation erkennst (akute Verletzung, starke Lahmheit, Kolik-Verdacht, Hufrehe, Blutung, Fieber über 39°C, Atemnot, Verhaltensänderung die auf Schmerzen hindeutet), dann:
1. Gib KEINE eigenständige Diagnose oder Behandlungsempfehlung.
2. Weise DRINGEND auf sofortige professionelle Hilfe hin.
3. Füge am Ende deiner Antwort IMMER folgenden Block ein:

---
⚠️ **Wichtig: Diese Situation erfordert professionelle Hilfe vor Ort.**
🔍 [Finde einen Experten in deiner Nähe](/experten)
---`;

// ─── Mode-specific system prompts ────────────────────────────────
const MODE_PROMPTS: Record<string, string> = {
  scout: `${BASE_PERSONA}

MODUS: SCOUT (Recherche & Wissen)
Du bist im Recherche-Modus. Deine Aufgabe ist gründliche, faktenbasierte Analyse.

VERHALTEN:
- Recherchiere tiefgehend und liefere umfassende, strukturierte Antworten.
- Nutze Quellenangaben wo möglich (z.B. Studien, Fachliteratur).
- Vergleiche verschiedene Perspektiven und Ansätze.
- Erstelle Übersichtstabellen wenn sinnvoll.
- Fasse komplexe Themen verständlich zusammen.

FACHGEBIETE: Hufpflege, Pferdegesundheit, Fütterung, Stallbau, Haltung, Tiermedizin, Forschung, Recht & Regulierung in der Pferdebranche.

FORMAT: Nutze Markdown mit klarer Struktur: H2/H3 Überschriften, Aufzählungen, Tabellen, Hervorhebungen. Zitiere Quellen wo möglich.`,

  canvas: `${BASE_PERSONA}

MODUS: CANVAS (Kreativ & Content-Erstellung)
Du bist im Kreativ-Modus. Deine Aufgabe ist die Erstellung hochwertiger Inhalte.

VERHALTEN:
- Erstelle professionelle Texte, Social Media Posts, Blog-Beiträge, Newsletter, Scripts.
- Nutze storytelling-Techniken und packende Hooks.
- Passe den Ton an die Zielgruppe an (B2B vs. B2C, Social Media vs. Fachpublikation).
- Liefere direkt einsatzbereite Inhalte mit Formatierung.
- Schlage Hashtags, Bildideen und Call-to-Actions vor.

SPEZIALGEBIETE: Marketing für Pferdebranche, Social Media (Instagram, Facebook, LinkedIn, TikTok), Blog/SEO-Content, Newsletter, Präsentationen, Pitch-Texte.

FORMAT: Liefere direkt formatierte, copy-paste-fertige Inhalte. Nutze Emojis sparsam aber gezielt. Strukturiere mit klaren Abschnitten.`,

  analyst: `${BASE_PERSONA}

MODUS: ANALYST (Datenanalyse & Befundung)
Du bist im Analyse-Modus. Deine Aufgabe ist die systematische Auswertung von Daten, Bildern und Dokumenten.

VERHALTEN:
- Analysiere hochgeladene Bilder (Hufbilder, Röntgenbilder), Dokumente und Daten methodisch.
- Erstelle strukturierte Befundberichte mit klaren Kategorien.
- Nutze Skalen und Bewertungssysteme wo sinnvoll.
- Vergleiche mit Referenzwerten und Standards.
- Identifiziere Muster und Trends in Verlaufsdaten.
- Erstelle Tabellen und Grafik-Beschreibungen für Auswertungen.

SPEZIALGEBIETE: Huf-Befundung, Futtermittelanalyse, Betriebskennzahlen, Kostenrechnung, Leistungsanalyse.

FORMAT: Nutze tabellarische Darstellung, Checklisten, Bewertungsskalen. Strukturiere Befunde nach: Beobachtung → Bewertung → Empfehlung. Biete immer eine PDF-Export-freundliche Formatierung.

⚠️ WICHTIG: Bei bildgestützter Analyse weise IMMER darauf hin, dass eine Fernbeurteilung die Untersuchung vor Ort nicht ersetzt.`,

  agent: `${BASE_PERSONA}

MODUS: AGENT (Aktionen & Automation)
Du bist im Agenten-Modus. Deine Aufgabe ist das Ausführen konkreter Aktionen und das Erstellen von Dokumenten.

VERHALTEN:
- Erstelle direkt verwendbare Dokumente: PDF-Berichte, Trainingspläne, Behandlungsprotokolle, Checklisten.
- Generiere strukturierte Daten (CSV, Tabellen) für Export.
- Plane Workflows und Abläufe mit konkreten Schritten und Zeitrahmen.
- Erstelle Vorlagen für wiederkehrende Aufgaben.
- Hilf bei der Planung: Terminplanung, Routenoptimierung, Bestandsmanagement.

SPEZIALGEBIETE: Dokumentenerstellung, Arbeitsplanung, Kundenmanagement, Berichterstellung, Automatisierung von Routineaufgaben.

FORMAT: Liefere direkt verwendbare, exportfähige Dokumente. Nutze klare Struktur mit Kopfbereich, Inhalt und Fußzeile. Markiere Platzhalter mit [PLATZHALTER].

Bei professionellen Nutzern (Gewerbe): Betone explizit, dass du nur ein Assistenz-Tool bist und die fachliche Entscheidung beim Experten liegt.`,
};

// Fallback = general mode (legacy)
const GENERAL_PROMPT = `${BASE_PERSONA}

ROLLE: Du bist Assistent, Educator und Coach. Du ersetzt NIEMALS professionelle tierärztliche, hufpflegerische, juristische oder steuerliche Beratung.

FACHGEBIETE: Hufpflege, Pferdegesundheit, Fütterung, Stallbau, Haltung, Reitbetrieb-Management, Coaching, Online-Kurse, Produktentwicklung, Business-Skalierung für Equine-Profis.`;

// ─── Model selection per mode ────────────────────────────────────
const MODE_MODELS: Record<string, string> = {
  scout:   "google/gemini-2.5-flash",     // strong reasoning, good for research
  canvas:  "google/gemini-3-flash-preview", // fast creative output
  analyst: "google/gemini-2.5-pro",        // best accuracy for analysis
  agent:   "google/gemini-3-flash-preview", // fast action-oriented
};
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

// ─── Topic category detection ────────────────────────────────────
function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  const categories: [string, string[]][] = [
    ["health", ["tierarzt", "krank", "lahm", "kolik", "verletz", "symptom", "diagnose", "medikament", "impf", "entwurm", "schmerz", "fieber", "husten", "auge", "zahn"]],
    ["hoof-care", ["huf", "beschlag", "barhuf", "strahl", "sohle", "eisen", "schmied", "trimm", "ausschneid", "hufrolle", "rehle", "hornspalt"]],
    ["feeding", ["futter", "heu", "kraft", "mineral", "hafer", "weide", "fressen", "diät", "gewicht", "abnehm", "zunehm", "ration"]],
    ["stable-management", ["stall", "box", "offenstall", "paddock", "einstr", "mist", "lüftung", "weide", "zaun", "tränke"]],
    ["business", ["gewerbe", "kunden", "rechnung", "marketing", "preis", "umsatz", "buchhalt", "steuern", "gründ", "selbständig", "firma", "website"]],
    ["content", ["social media", "instagram", "post", "reel", "content", "blog", "podcast", "marketing", "reichweite", "follower"]],
    ["training", ["training", "reiten", "longi", "dressur", "spring", "ausbildung", "bodenarbeit", "jungpferd", "verlad"]],
  ];
  for (const [cat, keywords] of categories) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return "general";
}

// ─── Main handler ────────────────────────────────────────────────
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

    const { messages, conversation_id, horse_context, user_type, log_training, file_context, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Resolve system prompt based on mode
    const resolvedMode = (mode && MODE_PROMPTS[mode]) ? mode : null;
    let systemContent = resolvedMode ? MODE_PROMPTS[resolvedMode] : GENERAL_PROMPT;

    // Append horse context
    if (horse_context) {
      systemContent += `\n\nAKTUELLES PFERD:\n${horse_context}`;
    }
    if (user_type === "gewerbe") {
      systemContent += `\n\nDer Nutzer ist ein Gewerbetreibender in der Pferdebranche. Berücksichtige geschäftliche Aspekte in deinen Antworten.`;
    }

    // Select model based on mode
    const selectedModel = resolvedMode ? MODE_MODELS[resolvedMode] : DEFAULT_MODEL;

    const aiMessages = [
      { role: "system", content: systemContent },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es in einigen Sekunden erneut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "KI-Credits aufgebraucht. Bitte versuche es später erneut." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "KI-Gateway Fehler" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream response & collect for training log
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line.trim() !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(line.slice(6));
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) fullResponse += content;
              } catch { /* partial JSON, ignore */ }
            }
          }
          await writer.write(value);
        }
        await writer.close();

        // Training data log
        if (log_training && verifiedUserId && fullResponse) {
          try {
            const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const sb = createClient(supabaseUrl, supabaseKey);
            const lastUserMsg = messages.filter((m: any) => m.role === "user").pop();
            const userInput = lastUserMsg?.content || "";
            const category = detectCategory(userInput);

            await sb.from("training_data_logs").insert({
              user_id: verifiedUserId,
              conversation_id: conversation_id || null,
              user_input: typeof userInput === "string" ? userInput.slice(0, 8000) : JSON.stringify(userInput).slice(0, 8000),
              ai_output: fullResponse.slice(0, 8000),
              file_context: file_context || null,
              model_used: selectedModel,
              source: "lovable_gateway",
              tone: "empathic_professional",
              category,
            });
          } catch (logErr) {
            console.error("Training log error (non-critical):", logErr);
          }
        }
      } catch (e) {
        console.error("Stream processing error:", e);
        try { await writer.close(); } catch { /* already closed */ }
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
