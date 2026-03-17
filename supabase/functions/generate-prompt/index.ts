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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { goal, context, details } = await req.json();
    if (!goal?.trim()) {
      return new Response(JSON.stringify({ error: "Goal is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Du bist ein Prompt Engineering Expert mit tiefem Verständnis für KI-Kommunikation. Deine Aufgabe ist es, aus einer Zielbeschreibung einen perfekt strukturierten, sofort einsatzbereiten Prompt zu generieren.

Regeln:
- Der generierte Prompt muss auf Deutsch sein
- Verwende klare Struktur: Rolle, Aufgabe, Kontext, Format, Qualitätskriterien
- Nutze bewährte Prompt-Engineering-Techniken: Chain-of-Thought, Few-Shot-Beispiele wo sinnvoll, klare Constraints
- Der Prompt soll sofort copy-paste-fähig sein
- Erkläre anschließend WARUM der Prompt so aufgebaut ist

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt in diesem Format (kein Markdown, kein Code-Block):
{
  "prompt": "Der vollständige, sofort einsatzbereite Prompt",
  "explanation": "Was tut dieser Prompt? (1-2 Sätze)",
  "whyWorks": "Warum funktioniert dieser Prompt besonders gut? Welche Techniken werden eingesetzt? (2-3 Sätze)",
  "howToUse": "Wie nutzt man diesen Prompt am besten? Tipps zur Anpassung. (1-2 Sätze)"
}`;

    const userMessage = [
      `🎯 Ziel: ${goal}`,
      context ? `📋 Kontext: ${context}` : null,
      details ? `📝 Details: ${details}` : null,
    ].filter(Boolean).join("\n\n");

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es gleich nochmal." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "AI-Credits aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await res.json();
    const raw = aiData.choices?.[0]?.message?.content || "";

    let parsed: any;
    try {
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        prompt: raw,
        explanation: "",
        whyWorks: "",
        howToUse: "",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
