import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Quiz answer keys per learning path code
const QUIZ_KEYS: Record<string, { question: string; correct: number; options: string[] }[]> = {
  AI_BASICS: [
    { question: "Was ist KI?", correct: 1, options: ["Ein Roboter", "Software die aus Daten lernt", "Ein Computer", "Ein Programm"] },
    { question: "Ist KI sicher für meine Daten?", correct: 2, options: ["Nein", "Manchmal", "Ja, bei DSGVO-konformen Anbietern", "Nur lokal"] },
    { question: "Wann nutze ich Scout-Modus?", correct: 0, options: ["Für Recherche & Analyse", "Für Bilder", "Für Videos", "Für Export"] },
  ],
  PROMPT_MASTERY: [
    { question: "Was ist die Prompt-Formel?", correct: 2, options: ["Frage stellen", "Text schreiben", "Rolle + Aufgabe + Kontext + Format", "Copy-Paste"] },
    { question: "Wofür ist Canvas-Modus?", correct: 1, options: ["Datenanalyse", "Content-Erstellung", "Recherche", "Export"] },
    { question: "Was sind Favoriten-Prompts?", correct: 0, options: ["Gespeicherte Lieblings-Prompts", "System-Prompts", "Admin-Prompts", "Gelöschte Prompts"] },
    { question: "Was ist Few-Shot Prompting?", correct: 2, options: ["Kurze Prompts", "Einmal-Prompts", "Beispiele im Prompt mitgeben", "Zufällige Prompts"] },
    { question: "Welcher Modus für Datenanalyse?", correct: 1, options: ["Scout", "Analyst", "Canvas", "Agent"] },
  ],
  CONTENT_CREATION: [
    { question: "Wie generiere ich ein Bild?", correct: 0, options: ["Prompt beschreiben & generieren", "Screenshot machen", "URL eingeben", "Datei hochladen"] },
    { question: "Was ist ein Reel?", correct: 2, options: ["Ein Foto", "Ein Blog", "Ein Kurzvideo", "Ein Podcast"] },
    { question: "Bestes Format für Instagram?", correct: 1, options: ["16:9", "9:16", "1:1", "4:3"] },
  ],
  BUSINESS_AI: [
    { question: "Wie hilft KI beim Marketing?", correct: 0, options: ["Content automatisieren", "Kunden anrufen", "Büro aufräumen", "Kaffee kochen"] },
    { question: "Was ist ein KI-Workflow?", correct: 2, options: ["Ein Roboter", "Ein Chat", "Automatisierte Aufgabenkette", "Ein Dashboard"] },
    { question: "Wann nutze ich Agent-Modus?", correct: 1, options: ["Für Recherche", "Für automatisierte Aufgaben", "Für Bilder", "Für Texte"] },
    { question: "Was ist ROI bei KI?", correct: 0, options: ["Zeitersparnis & Effizienz", "Return on Investment", "Beides", "Nichts davon"] },
    { question: "Bester Modus für Berichte?", correct: 2, options: ["Canvas", "Scout", "Analyst", "Agent"] },
  ],
  MEMORY_MASTERY: [
    { question: "Was speichert das Memory-System?", correct: 1, options: ["Passwörter", "Wichtige Fakten aus Chats", "Bilder", "Videos"] },
    { question: "Wie verbessert Memory die KI?", correct: 0, options: ["Personalisierte Antworten", "Schnellere Antworten", "Kürzere Antworten", "Keine Verbesserung"] },
    { question: "Wo sehe ich mein Memory?", correct: 2, options: ["Im Chat", "In Settings", "Im Memory-Dashboard", "Im Profil"] },
    { question: "Was sind Smart Reminders?", correct: 1, options: ["Wecker", "Kontextbezogene Erinnerungen", "Push-Notifications", "E-Mails"] },
  ],
  COLLABORATION: [
    { question: "Wie lade ich jemanden ein?", correct: 0, options: ["Per E-Mail oder Link", "Per Telefon", "Per Post", "Automatisch"] },
    { question: "Was bringt Zusammenarbeit?", correct: 2, options: ["Mehr Kosten", "Weniger Kontrolle", "Bessere Ergebnisse durch Teamwork", "Nichts"] },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Invalid user");

    const { path_code, answers } = await req.json();

    const quizKey = QUIZ_KEYS[path_code];
    if (!quizKey) throw new Error(`No quiz for path: ${path_code}`);

    // Grade answers
    let correct = 0;
    const results = quizKey.map((q, i) => {
      const isCorrect = answers[i] === q.correct;
      if (isCorrect) correct++;
      return { question: q.question, correct: isCorrect, correctAnswer: q.options[q.correct] };
    });

    const score = Math.round((correct / quizKey.length) * 100);
    const passed = score >= 60;
    const xpEarned = passed ? correct * 5 : 0;

    if (passed && xpEarned > 0) {
      // Award XP
      await adminClient.from("xp_logs").insert({
        user_id: user.id,
        action_type: "quiz_correct",
        xp_earned: xpEarned,
      });

      const { data: lvl } = await adminClient
        .from("user_levels")
        .select("total_xp, current_xp")
        .eq("user_id", user.id)
        .single();

      if (lvl) {
        await adminClient
          .from("user_levels")
          .update({
            total_xp: (lvl.total_xp || 0) + xpEarned,
            current_xp: (lvl.current_xp || 0) + xpEarned,
          })
          .eq("user_id", user.id);
      }
    }

    return new Response(
      JSON.stringify({
        score,
        correct,
        total: quizKey.length,
        passed,
        xp_earned: xpEarned,
        results,
        questions: quizKey,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
