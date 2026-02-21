import type { AiMode } from "./OmniBox";

interface SmartChip {
  label: string;
  prompt: string;
  mode?: AiMode;
  icon?: string;
}

interface SmartChipContext {
  userType: "privat" | "gewerbe" | null;
  horseName?: string;
  hasConversation: boolean;
  lastAssistantMessage?: string;
  lang: "de" | "en";
}

/**
 * Generates contextual Smart Chips based on user state.
 * These adapt dynamically to the user's situation.
 */
export function generateSmartChips(ctx: SmartChipContext): SmartChip[] {
  const { userType, horseName, hasConversation, lastAssistantMessage, lang } = ctx;
  const de = lang === "de";

  // If there's an active conversation with a response, show follow-up chips
  if (hasConversation && lastAssistantMessage) {
    const chips: SmartChip[] = [];

    // Detect if response contains health/hoof content
    const healthTerms = ["tierarzt", "veterinarian", "huf", "hoof", "lahm", "lame", "kolik", "colic"];
    const hasHealth = healthTerms.some(t => lastAssistantMessage.toLowerCase().includes(t));
    if (hasHealth) {
      chips.push({
        label: de ? "🔍 Experten finden" : "🔍 Find experts",
        prompt: de ? "Finde einen Experten in meiner Nähe für dieses Problem" : "Find an expert near me for this issue",
        mode: "scout",
      });
    }

    chips.push(
      {
        label: de ? "📄 Als PDF exportieren" : "📄 Export as PDF",
        prompt: de ? "Erstelle einen professionellen PDF-Bericht aus diesem Gespräch" : "Create a professional PDF report from this conversation",
        mode: "agent",
      },
      {
        label: de ? "🎬 Video erstellen" : "🎬 Create video",
        prompt: de ? "Erstelle ein kurzes Marketing-Video basierend auf diesem Inhalt" : "Create a short marketing video based on this content",
        mode: "canvas",
      },
      {
        label: de ? "📊 Zusammenfassung" : "📊 Summary",
        prompt: de ? "Fasse das Gespräch strukturiert zusammen" : "Summarize the conversation in a structured way",
        mode: "analyst",
      },
    );

    return chips.slice(0, 4);
  }

  // Empty state chips based on user type
  if (userType === "gewerbe") {
    return [
      {
        label: de ? "📋 Kundenbericht erstellen" : "📋 Create client report",
        prompt: de ? "Erstelle einen professionellen Kundenbericht" : "Create a professional client report",
        mode: "agent",
      },
      {
        label: de ? "🎬 Marketing-Reel erstellen" : "🎬 Create marketing reel",
        prompt: de ? "Erstelle ein Marketing-Video für meine Social Media Kanäle" : "Create a marketing video for my social media channels",
        mode: "canvas",
      },
      {
        label: de ? "📊 Projekt analysieren" : "📊 Analyze project",
        prompt: de ? "Analysiere mein aktuelles Projekt und gib Empfehlungen" : "Analyze my current project and give recommendations",
        mode: "analyst",
      },
      {
        label: de ? "💡 Content-Ideen" : "💡 Content ideas",
        prompt: de ? "Schlage 5 Content-Ideen für die Pferdebranche vor" : "Suggest 5 content ideas for the equine industry",
        mode: "scout",
      },
    ];
  }

  // Private user with horse
  if (horseName) {
    return [
      {
        label: de ? `🐴 Hufpflege für ${horseName}` : `🐴 Hoof care for ${horseName}`,
        prompt: de ? `Gib mir einen Hufpflege-Check für ${horseName}` : `Give me a hoof care check for ${horseName}`,
        mode: "analyst",
      },
      {
        label: de ? "🥕 Futterplan erstellen" : "🥕 Create feed plan",
        prompt: de ? `Erstelle einen optimalen Futterplan für ${horseName}` : `Create an optimal feed plan for ${horseName}`,
        mode: "agent",
      },
      {
        label: de ? "📸 Huf-Foto analysieren" : "📸 Analyze hoof photo",
        prompt: de ? "Ich möchte ein Huf-Foto zur Analyse hochladen" : "I want to upload a hoof photo for analysis",
        mode: "analyst",
      },
      {
        label: de ? "🔍 Experten suchen" : "🔍 Find experts",
        prompt: de ? "Finde einen Hufbearbeiter in meiner Nähe" : "Find a farrier near me",
        mode: "scout",
      },
    ];
  }

  // Default chips
  return [
    {
      label: de ? "🐴 Hufpflege-Tipps" : "🐴 Hoof care tips",
      prompt: de ? "Gib mir die wichtigsten Hufpflege-Tipps" : "Give me the most important hoof care tips",
      mode: "scout",
    },
    {
      label: de ? "🥕 Futterberatung" : "🥕 Feed advice",
      prompt: de ? "Berate mich zur optimalen Pferdefütterung" : "Advise me on optimal horse feeding",
      mode: "scout",
    },
    {
      label: de ? "🏠 Stallbau-Planung" : "🏠 Stable planning",
      prompt: de ? "Hilf mir bei der Planung eines Offenstalls" : "Help me plan an open stable",
      mode: "scout",
    },
    {
      label: de ? "📸 Bild analysieren" : "📸 Analyze image",
      prompt: de ? "Ich möchte ein Bild zur Analyse hochladen" : "I want to upload an image for analysis",
      mode: "analyst",
    },
  ];
}

/**
 * Auto-detect the best AI mode from user input.
 */
export function detectMode(input: string): AiMode {
  const lower = input.toLowerCase();

  // Canvas (creation)
  const createTerms = ["erstell", "create", "generier", "video", "bild", "image", "reel", "content", "design", "schreib", "write"];
  if (createTerms.some(t => lower.includes(t))) return "canvas";

  // Analyst (analysis)
  const analyzeTerms = ["analys", "auswert", "bewert", "vergleich", "statistik", "bericht", "report", "zusammenfass", "summar"];
  if (analyzeTerms.some(t => lower.includes(t))) return "analyst";

  // Agent (action)
  const actionTerms = ["export", "download", "speicher", "save", "sende", "send", "termin", "plan", "dokument", "pdf"];
  if (actionTerms.some(t => lower.includes(t))) return "agent";

  // Scout (research) is the default
  return "scout";
}
