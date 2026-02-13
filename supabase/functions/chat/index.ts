import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Du bist HufiAi – ein empathischer, sachlicher KI-Assistent für die gesamte Pferdebranche.

ROLLE: Du bist Assistent, Educator und Coach. Du ersetzt NIEMALS professionelle tierärztliche, hufpflegerische, juristische oder steuerliche Beratung.

TONALITÄT – Empathische Sachlichkeit (Humble Authority):
- Sei unterstützend, professionell und bescheiden – niemals besserwisserisch oder allwissend.
- Verwende Formulierungen wie:
  • "Basierend auf den vorliegenden Daten..."
  • "Ein möglicher Lösungsansatz wäre..."
  • "In Zusammenarbeit mit Fachleuten vor Ort..."
  • "Nach aktuellem Wissensstand..."
- Betone stets, dass fachliche Expertise vor Ort unverzichtbar ist.
- Zeige Verständnis für die Herausforderungen der Branche.

FACHGEBIETE: Hufpflege, Pferdegesundheit, Fütterung, Stallbau, Haltung, Reitbetrieb-Management, Coaching, Online-Kurse, Produktentwicklung, Business-Skalierung für Equine-Profis.

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
---

Bei professionellen Nutzern (Gewerbe): Betone explizit, dass du nur ein Assistenz-Tool bist und die fachliche Entscheidung beim Experten liegt.`;


// Detect topic category from user message
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, conversation_id, horse_context, user_type, log_training, user_id, file_context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build system message with optional horse context
    let systemContent = SYSTEM_PROMPT;
    if (horse_context) {
      systemContent += `\n\nAKTUELLES PFERD:\n${horse_context}`;
    }
    if (user_type === "gewerbe") {
      systemContent += `\n\nDer Nutzer ist ein Gewerbetreibender in der Pferdebranche. Berücksichtige geschäftliche Aspekte in deinen Antworten.`;
    }

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
        model: "google/gemini-3-flash-preview",
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

    // Create a TransformStream to intercept and collect the full response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    // Process stream in background
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          // Extract content from SSE chunks for logging
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

        // After stream completes, log training data if user consented
        if (log_training && user_id && fullResponse) {
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const sb = createClient(supabaseUrl, supabaseKey);

            const lastUserMsg = messages.filter((m: any) => m.role === "user").pop();
            const userInput = lastUserMsg?.content || "";
            const category = detectCategory(userInput);

            await sb.from("training_data_logs").insert({
              user_id,
              conversation_id: conversation_id || null,
              user_input: typeof userInput === "string" ? userInput.slice(0, 8000) : JSON.stringify(userInput).slice(0, 8000),
              ai_output: fullResponse.slice(0, 8000),
              file_context: file_context || null,
              model_used: "google/gemini-3-flash-preview",
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
