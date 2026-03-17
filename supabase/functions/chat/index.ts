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

// ─── Pascal's full knowledge context (used when provider=claude) ──
const PASCAL_KNOWLEDGE = `
═══════════════════════════════════════════════════════════════════
ÜBER PASCAL SCHMID
═══════════════════════════════════════════════════════════════════

PERSÖNLICH:
- Name: Pascal Schmid
- Geburtstag: November 1990 (wird 40 im Nov 2030 — GROSSES MILESTONE)
- Standort: Düsseldorf, Deutschland
- Sprache: Deutsch (bevorzugt)
- Philosophie: BeTheHorse — Freiheit, Selbstbestimmung, Leben im Präsens
- 15+ Jahre in der Equine Industry (hands-on Erfahrung)
- 6 Jahre selbständig (mit Unterbrechungen)
- Armverletzung Jan 2021 → Neustarts → jetzt: Solo-Founder mit 3 Ventures
- Persönlichkeit: Freiheitsliebend, ehrlich, direkt, reflektiert, bodenständig
- Systemischer Denker, unternehmerisch, pragmatisch

═══════════════════════════════════════════════════════════════════
DIE 3 VENTURES
═══════════════════════════════════════════════════════════════════

VENTURE 1: HUFMANAGER (SaaS Plattform)
─────────────────────────────────────
Vision: "Nervensystem der Pferdewelt" — Das Operating System für die gesamte Branche

Tech Stack:
- Frontend: React 18.3 + TypeScript, Lovable.dev IDE
- Backend: Supabase (Auth, Database, RLS, Edge Functions)
- Styling: Tailwind CSS + shadcn/ui
- Payments: CopeCart
- Deployment: Netlify

Features:
✅ Kundenverwaltung, Pferde-Register, Termine, Hufwerte-Dokumentation
🟡 Team-Modul (in Arbeit), Emergency-Support Dashboard
❌ Hufwert-Verlaufskurven, Automated Reminders (geplant)

Rollen: provider (#pid), client (#kid), partner, employee, admin

Pricing: Starter €9.90, Pro €29, Duo €49+, Team €79+

Status (März 2026):
- MVP/Beta Phase
- Erste zahlende Kunden geplant
- Ziel April 2026: €500 MRR
- Partnership mit Fischer Versicherung: 2.800 versicherte Profis
- Uelzener Versicherung: Call geplant

Vision bis Nov 2030:
- HufManager ONE (Branded Tablet für Partner)
- PASSAON (Equine Web Browser)
- Pferdebusiness Akademie (Öffnung Nov 2030)
- Global Horse Data Network mit Hardware (2027-2028)

VENTURE 2: BARHUF SERVICE SCHMID (Hands-on Hoof Care)
─────────────────────────────────────
Mission: "Das größte, modernste und fairste Hufpflege-Unternehmen im DACH-Raum"
Services: Professional Barefoot Hoof Trimming, Problem Horse Specialization, Donkeys & Mini-Pferde
Prinzipien: "Handwerk, Haltung und Hightech vereinen"

VENTURE 3: HUFBUSINESS COACHING
─────────────────────────────────────
Zielgruppe: Unternehmer in der Hufpflege-Industrie
Produkte:
1. "Neukundenpferd" (Workshop, Course, 1:1 Coaching, Book)
2. "Pferkauft" (Sales Psychology)
3. "Das perfekte Pferdebusiness" (Comprehensive System)
Plus: 0GC Mastermind Spanien (2026/2027) — High-end Retreat

═══════════════════════════════════════════════════════════════════
BRAND & VISUAL IDENTITY
═══════════════════════════════════════════════════════════════════

COLORS: Black #0a0700, Amber-Orange #F5970A / #FF6A00
TYPOGRAPHY: Headers: Bebas Neue. Body: Sans-serif, clean
HASHTAG: #ZukunftHuf2030
TONE: Deutsch, direkt, no fluff, authentic, practitioner-focused

═══════════════════════════════════════════════════════════════════
PARTNERSHIPS
═══════════════════════════════════════════════════════════════════

FISCHER VERSICHERUNG:
- Kontakt: Matthias Fischer
- Zielgruppe: ~2.800 versicherte Hufpflege-Profis
- Potenzial: HufManager als empfohlenes Tool für versicherte Provider
- Nutzen für Fischer: Risikominimierung, digitale Dokumentation, Kundenbindung
- Nutzen für HufManager: Zugang zu 2.800 Profis, Vertrauens-Signal

UELZENER VERSICHERUNG:
- Kontakt: Leonie Teschke, F. Michaelis
- Fokus: Pferde-Krankenversicherung, breitere Zielgruppe
- Status: Call geplant

═══════════════════════════════════════════════════════════════════
MESSAGING PLAYBOOK
═══════════════════════════════════════════════════════════════════

ELEVATOR PITCHES:
- Provider: "HufManager dokumentiert deine Arbeit, verwaltet Kunden & Pferde – alles in einer App."
- Client: "HufManager gibt dir den vollen Überblick über die Hufgesundheit deines Pferdes."
- Partner: "HufManager digitalisiert die gesamte Hufpflege-Branche – 2.800+ Profis als Zielgruppe."

TOP PROBLEME PROVIDER: Zettelwirtschaft, keine digitale Dokumentation, Terminchaos
TOP PROBLEME CLIENTS: Kein Überblick über Hufgesundheit, schwer gute Hufpfleger zu finden

USP: Einziges Tool das Handwerk + Tech + Branchenwissen vereint, gebaut VON einem Hufpfleger FÜR die Branche

═══════════════════════════════════════════════════════════════════
MENTOREN & LEARNINGS
═══════════════════════════════════════════════════════════════════

- Mathias Aumann (Mission Mittelstand): Systeme > Personen, skalierbar denken, Standardisierung
- Dirk Kreuter (Sales & Mindset): Vertrieb ist Pflicht, Einwandbehandlung, Abschluss-Fokus
- Calvin Hollywood (Content & Brand): Authentizität > Perfektion, Polarisierung, Storytelling
- Damian Richter (Systemisch): Innere Arbeit = Outer Results, Verantwortung, Pattern-Erkennung
- Franziska Müller (Unternehmerin): Mut, weibliche Perspektive, Community-Building

═══════════════════════════════════════════════════════════════════
KPIs & METRIKEN
═══════════════════════════════════════════════════════════════════

HUFMANAGER:
- MRR: Ziel €500 (April 2026), €2.000 (Juni 2026), €50.000+ (2030)
- Active Users: Tracking starten
- Churn Rate: < 5% Ziel
- CAC: Minimieren durch Partnerships
- LTV: Maximieren durch Upselling (Starter → Pro → Team)

BARHUF SERVICE:
- Referral Rate als wichtigste Metrik
- Durchschnittlicher Auftrag optimieren

PERSÖNLICH:
- Ziel: Max 45h/Woche, Work-Life-Balance
- Milestone Nov 2030: Finanzielle Freiheit, 3 laufende Businesses

═══════════════════════════════════════════════════════════════════
PHILOSOPHIE: BeTheHorse
═══════════════════════════════════════════════════════════════════

- Bedeutung: Lebe wie ein Pferd – frei, präsent, authentisch, vertrauend auf Instinkte
- Im Business: Entscheidungen aus dem Bauch + Daten, keine Kompromisse bei Werten
- Im Leben: Freiheit über Status, Erfahrungen über Besitz
- Vision 2030: Am 40. Geburtstag = 3 profitable Businesses, globaler Impact, persönliche Freiheit
- Einzigartige Kombination: Handwerker + Entrepreneur + Coach = niemand sonst kann das so

═══════════════════════════════════════════════════════════════════
WIE DU MIT PASCAL ARBEITEN SOLLTEST
═══════════════════════════════════════════════════════════════════

TU:
✅ Sei direkt und actionable (keine Floskeln)
✅ Stelle Fragen, bevor du Lösungen gibst
✅ Denke langfristig (bis Nov 2030, aber auch heute handlungsfähig)
✅ Erkenne Patterns und weise auf Widersprüche hin
✅ Gib ehrliches Feedback, maximal 3 Optionen statt 10
✅ Nutze Deutsch, direkter Ton, Analogien aus der Pferdewelt
✅ Achte auf Kontext (was ist gerade top-of-mind?)
✅ Erinnere an Priorities wenn Pascal abdriftet

UNTERLASSE:
❌ Lange Marketing-Copy (es sei denn, er fragt explizit)
❌ Vorgefertigte Scripts
❌ Zu viele Optionen (3 statt 10)
❌ Fake-Positivity oder Floskeln
❌ Dein Wissen ignorieren – nutze ALLES was du über Pascal weißt`;

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

// Fallback = general mode
const GENERAL_PROMPT = `${BASE_PERSONA}

ROLLE: Du bist Assistent, Educator und Coach. Du ersetzt NIEMALS professionelle tierärztliche, hufpflegerische, juristische oder steuerliche Beratung.

FACHGEBIETE: Hufpflege, Pferdegesundheit, Fütterung, Stallbau, Haltung, Reitbetrieb-Management, Coaching, Online-Kurse, Produktentwicklung, Business-Skalierung für Equine-Profis.`;

// ─── Model selection per mode (Lovable AI Gateway) ───────────────
const MODE_MODELS: Record<string, string> = {
  scout:   "google/gemini-2.5-flash",
  canvas:  "google/gemini-3-flash-preview",
  analyst: "google/gemini-2.5-pro",
  agent:   "google/gemini-3-flash-preview",
};
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

// ─── Claude model mapping per mode ───────────────────────────────
const CLAUDE_MODE_MODELS: Record<string, string> = {
  scout:   "claude-sonnet-4-20250514",
  canvas:  "claude-sonnet-4-20250514",
  analyst: "claude-sonnet-4-20250514",
  agent:   "claude-sonnet-4-20250514",
};
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-20250514";

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

// ─── Lovable AI Gateway call (existing) ──────────────────────────
async function callLovableGateway(
  systemContent: string,
  messages: any[],
  model: string,
): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const aiMessages = [
    { role: "system", content: systemContent },
    ...messages,
  ];

  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages: aiMessages, stream: true }),
  });
}

// ─── Claude API call (new) ───────────────────────────────────────
async function callClaudeAPI(
  systemContent: string,
  messages: any[],
  model: string,
): Promise<Response> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

  // Convert OpenAI-style messages to Anthropic format (filter out system)
  const anthropicMessages = messages
    .filter((m: any) => m.role !== "system")
    .map((m: any) => ({ role: m.role, content: m.content }));

  return await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemContent,
      messages: anthropicMessages,
      stream: true,
    }),
  });
}

// ─── Transform Claude SSE stream → OpenAI-compatible SSE stream ──
function transformClaudeStream(claudeBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = claudeBody.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Send [DONE] in OpenAI format
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const event = JSON.parse(jsonStr);
              // Claude sends content_block_delta with text delta
              if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                const openaiChunk = {
                  choices: [{ delta: { content: event.delta.text }, index: 0 }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
              }
              // Claude sends message_stop when done
              if (event.type === "message_stop") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                reader.cancel();
                return;
              }
            } catch { /* partial JSON, skip */ }
          }
        }
      } catch (e) {
        console.error("Claude stream transform error:", e);
        controller.close();
      }
    },
  });
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

    const { messages, conversation_id, horse_context, user_type, log_training, file_context, mode, provider } = await req.json();

    const useClaude = provider === "claude";

    // Resolve system prompt based on mode
    const resolvedMode = (mode && MODE_PROMPTS[mode]) ? mode : null;
    let systemContent = resolvedMode ? MODE_PROMPTS[resolvedMode] : GENERAL_PROMPT;

    // Append Pascal's knowledge when using Claude
    if (useClaude) {
      systemContent += `\n\n${PASCAL_KNOWLEDGE}`;
    }

    // Append horse context
    if (horse_context) {
      systemContent += `\n\nAKTUELLES PFERD:\n${horse_context}`;
    }
    if (user_type === "gewerbe") {
      systemContent += `\n\nDer Nutzer ist ein Gewerbetreibender in der Pferdebranche. Berücksichtige geschäftliche Aspekte in deinen Antworten.`;
    }

    // Select model based on provider + mode
    let selectedModel: string;
    if (useClaude) {
      selectedModel = resolvedMode ? CLAUDE_MODE_MODELS[resolvedMode] : DEFAULT_CLAUDE_MODEL;
    } else {
      selectedModel = resolvedMode ? MODE_MODELS[resolvedMode] : DEFAULT_MODEL;
    }

    // Call the appropriate provider
    let response: Response;
    if (useClaude) {
      response = await callClaudeAPI(systemContent, messages, selectedModel);
    } else {
      response = await callLovableGateway(systemContent, messages, selectedModel);
    }

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
      console.error("AI provider error:", response.status, t);
      return new Response(JSON.stringify({ error: "KI-Provider Fehler" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For Claude, transform the stream to OpenAI-compatible format
    // so the frontend SSE parser works unchanged
    const outputStream = useClaude
      ? transformClaudeStream(response.body!)
      : response.body!;

    // Stream response & collect for training log
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = outputStream.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

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
                // Capture usage from final chunk (OpenAI-compatible format)
                if (parsed.usage) {
                  totalInputTokens = parsed.usage.prompt_tokens || totalInputTokens;
                  totalOutputTokens = parsed.usage.completion_tokens || totalOutputTokens;
                }
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
              source: useClaude ? "claude_api" : "lovable_gateway",
              tone: "empathic_professional",
              category,
              input_tokens: totalInputTokens,
              output_tokens: totalOutputTokens,
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
