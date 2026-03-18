import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Nicht autorisiert");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Nicht autorisiert");

    const { conversation_id, structure = "auto" } = await req.json();
    if (!conversation_id) throw new Error("conversation_id required");

    // Fetch messages
    const { data: messages, error: msgErr } = await userClient
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });

    if (msgErr) throw new Error("Nachrichten konnten nicht geladen werden");
    if (!messages || messages.length === 0) throw new Error("Keine Nachrichten gefunden");

    // Fetch conversation title
    const { data: conv } = await userClient
      .from("conversations")
      .select("title")
      .eq("id", conversation_id)
      .single();

    const chatContent = messages
      .map((m: any) => `${m.role === "user" ? "Nutzer" : "KI"}: ${m.content}`)
      .join("\n")
      .slice(0, 15000);

    // AI-powered professional structuring
    const structurePrompt = structure === "auto"
      ? `Analysiere diesen Chat und strukturiere ihn als professionellen Report.
Erstelle ein umfassendes JSON mit folgenden Feldern:
{
  "title": "Professioneller Titel des Berichts",
  "subtitle": "Untertitel oder Kontext",
  "date": "Datum des Berichts",
  "intro": "Einleitung (3-4 Sätze, Kontext und Ziel)",
  "sections": [
    {
      "heading": "Überschrift der Sektion",
      "content": "Detaillierter Inhalt (3-5 Sätze)",
      "type": "text|list|observation|recommendation"
    }
  ],
  "tables": [
    {
      "caption": "Tabellentitel",
      "headers": ["Spalte1", "Spalte2"],
      "rows": [["Wert1", "Wert2"]]
    }
  ],
  "recommendations": ["Empfehlung 1", "Empfehlung 2"],
  "conclusion": "Fazit (2-3 Sätze)",
  "risk_notes": "Hinweise zu Risiken oder Einschränkungen",
  "metadata": {
    "message_count": 0,
    "topics_covered": ["Thema1"],
    "confidence_level": "high|medium|low"
  }
}

Extrahiere ALLE relevanten Informationen. Erstelle Tabellen wo Daten vergleichbar sind.
Formuliere professionell aber verständlich. Antworte NUR mit dem JSON.`
      : `Strukturiere den Chat gemäß: ${structure}. Antworte NUR mit JSON.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du bist ein professioneller Dokumentationsassistent für die Pferdebranche.
Du erstellst strukturierte, professionelle Berichte aus Chat-Verläufen.
Betone stets, dass KI-Analyse eine fachliche Beratung nicht ersetzt.
${structurePrompt}`,
          },
          { role: "user", content: chatContent },
        ],
        temperature: 0.2,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es später erneut." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Guthaben aufgebraucht. Bitte lade dein Konto auf." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI-Verarbeitung fehlgeschlagen");
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("KI-Strukturierung fehlgeschlagen");

    let structured;
    try {
      structured = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Ungültige KI-Antwort");
    }

    // Add metadata
    structured.metadata = {
      ...structured.metadata,
      conversation_id,
      conversation_title: conv?.title || "Unbenannt",
      message_count: messages.length,
      generated_at: new Date().toISOString(),
      model: "google/gemini-2.5-flash",
    };

    return new Response(JSON.stringify(structured), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-professional-pdf error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unbekannter Fehler" }), {
      status: err.message?.includes("autorisiert") ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
