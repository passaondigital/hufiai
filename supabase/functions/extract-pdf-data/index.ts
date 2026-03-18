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

    const { conversation_id } = await req.json();
    if (!conversation_id) throw new Error("conversation_id required");

    // Fetch messages
    const { data: messages, error: msgErr } = await userClient
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });

    if (msgErr) throw new Error("Nachrichten konnten nicht geladen werden");
    if (!messages || messages.length === 0) throw new Error("Keine Nachrichten gefunden");

    const chatContent = messages
      .map((m: any) => `${m.role === "user" ? "Nutzer" : "KI"}: ${m.content}`)
      .join("\n")
      .slice(0, 15000);

    // AI extraction with tool calling for structured output
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
            content: `Du bist ein Daten-Extraktionsexperte. Analysiere den folgenden Chat-Verlauf und extrahiere alle strukturierten Daten.`,
          },
          { role: "user", content: chatContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_structured_data",
              description: "Extrahiert strukturierte Daten aus einem Chat-Verlauf für PDF-Rendering",
              parameters: {
                type: "object",
                properties: {
                  tables: {
                    type: "array",
                    description: "Erkannte Tabellen oder vergleichbare Daten",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        headers: { type: "array", items: { type: "string" } },
                        rows: { type: "array", items: { type: "array", items: { type: "string" } } },
                      },
                      required: ["title", "headers", "rows"],
                      additionalProperties: false,
                    },
                  },
                  lists: {
                    type: "array",
                    description: "Erkannte Aufzählungen oder Listen",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        items: { type: "array", items: { type: "string" } },
                        type: { type: "string", enum: ["bullet", "numbered", "checklist"] },
                      },
                      required: ["title", "items", "type"],
                      additionalProperties: false,
                    },
                  },
                  key_facts: {
                    type: "array",
                    description: "Wichtige Fakten als Key-Value Paare",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        value: { type: "string" },
                        category: { type: "string" },
                      },
                      required: ["label", "value"],
                      additionalProperties: false,
                    },
                  },
                  dates_mentioned: {
                    type: "array",
                    description: "Im Chat erwähnte Daten und Termine",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string" },
                        context: { type: "string" },
                      },
                      required: ["date", "context"],
                      additionalProperties: false,
                    },
                  },
                  measurements: {
                    type: "array",
                    description: "Erkannte Messungen oder numerische Werte",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        value: { type: "string" },
                        unit: { type: "string" },
                      },
                      required: ["label", "value"],
                      additionalProperties: false,
                    },
                  },
                  topics: {
                    type: "array",
                    description: "Hauptthemen des Gesprächs",
                    items: { type: "string" },
                  },
                  sentiment: {
                    type: "string",
                    description: "Gesamtstimmung des Gesprächs",
                    enum: ["positive", "neutral", "concerned", "urgent"],
                  },
                  action_items: {
                    type: "array",
                    description: "Erkannte Aufgaben oder To-Dos",
                    items: {
                      type: "object",
                      properties: {
                        task: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                        assignee: { type: "string" },
                      },
                      required: ["task", "priority"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tables", "lists", "key_facts", "topics"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_structured_data" } },
        temperature: 0.1,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Guthaben aufgebraucht." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI extraction failed");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("Keine strukturierten Daten extrahiert");
    }

    let extracted;
    try {
      extracted = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("Ungültige Extraktion");
    }

    // Add metadata
    extracted.metadata = {
      conversation_id,
      message_count: messages.length,
      extracted_at: new Date().toISOString(),
      model: "google/gemini-2.5-flash",
    };

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("extract-pdf-data error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unbekannter Fehler" }), {
      status: err.message?.includes("autorisiert") ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
