import { X, Lightbulb, Sparkles } from "lucide-react";
import { useEducation } from "@/hooks/useEducation";
import { cn } from "@/lib/utils";

interface Hint {
  id: string;
  title: string;
  emoji: string;
  description: string;
  why: string;
  example?: string;
  tip?: string;
  xp?: string;
}

const HINTS: Record<string, Hint> = {
  scout_mode: {
    id: "scout_mode",
    emoji: "🎯",
    title: "Scout-Modus",
    description: "Nutze Scout für Recherche, Analyse und Quellen.",
    why: "Scout nutzt tieferes Denken für präzisere Antworten.",
    example: "\u201ERecherchiere die neuesten Hufpflege-Studien\u201C",
    tip: "Probiere Scout als N\u00E4chstes!",
    xp: "+2 XP pro Scout-Chat",
  },
  canvas_mode: {
    id: "canvas_mode",
    emoji: "✍️",
    title: "Canvas-Modus",
    description: "Canvas ist dein Kreativ-Modus für Inhalte.",
    why: "Canvas ist kreativ & schnell – ideal für Content.",
    example: "\u201ESchreibe einen Instagram-Post \u00FCber Barhufpflege\u201C",
    tip: "Generiere danach ein Bild dazu!",
    xp: "+2 XP pro Canvas-Chat",
  },
  analyst_mode: {
    id: "analyst_mode",
    emoji: "📊",
    title: "Analyst-Modus",
    description: "Analyst wertet Daten und Bilder für dich aus.",
    why: "Datenanalyse braucht Sorgfalt – Analyst liefert Tiefe.",
    example: "\u201EAnalysiere dieses Hufbild auf Anomalien\u201C",
    tip: "Lade ein Foto hoch und starte die Analyse!",
    xp: "+2 XP pro Analyst-Chat",
  },
  agent_mode: {
    id: "agent_mode",
    emoji: "⚡",
    title: "Agent-Modus",
    description: "Agent führt Aufgaben und Workflows autonom aus.",
    why: "Aktionen brauchen Tempo – Agent erledigt das für dich.",
    example: "\u201EErstelle einen PDF-Bericht aus meinem letzten Chat\u201C",
    tip: "Kombiniere Agent mit Memory f\u00FCr smarte Automatisierung!",
    xp: "+2 XP pro Agent-Chat",
  },
  prompt_library: {
    id: "prompt_library",
    emoji: "📚",
    title: "Prompt Library",
    description: "Nutze fertige Prompts als Starthilfe.",
    why: "Bewährte Strukturen sparen dir Zeit.",
    example: "Klicke auf einen Prompt \u2013 er f\u00FCllt deinen Chat automatisch.",
    tip: "Teste den Scout-Master-Prompt f\u00FCr tiefe Recherche.",
    xp: "+3 XP für Custom Prompts",
  },
  favorites: {
    id: "favorites",
    emoji: "💬",
    title: "Favoriten speichern",
    description: "Speichere deine besten Prompts als Favoriten.",
    why: "Schnellzugriff = schnellerer Workflow.",
    example: "Klicke ⭐ auf einen Prompt oder eigenen Text.",
    tip: "Erstelle 3–5 Favoriten für deinen Workflow.",
    xp: "+5 XP für gespeicherte Favoriten",
  },
  collaborate: {
    id: "collaborate",
    emoji: "🤝",
    title: "Zusammenarbeiten",
    description: "Lade Freunde ein, um gemeinsam zu arbeiten.",
    why: "Zwei Köpfe > ein Kopf.",
    example: "Klicke \u201EEinladen\u201C, teile per Link oder E-Mail.",
    tip: "Einem Freund helfen = +10 XP Achievement!",
    xp: "+10 XP Achievement",
  },
  custom_prompt: {
    id: "custom_prompt",
    emoji: "🛠️",
    title: "Custom Prompt erstellen",
    description: "Erstelle eigene Prompts für wiederkehrende Aufgaben.",
    why: "Eigene Prompts sparen dir jedes Mal 5–10 Minuten.",
    tip: "Starte mit Rolle + Aufgabe + Kontext + Format.",
    xp: "+3 XP pro Custom Prompt",
  },
  memory: {
    id: "memory",
    emoji: "🧠",
    title: "Memory-System",
    description: "Die KI merkt sich wichtige Fakten aus deinen Chats.",
    why: "Je mehr die KI über dich weiß, desto besser die Antworten.",
    tip: "Überprüfe dein Memory-Dashboard regelmäßig.",
    xp: "+5 XP für 10 gespeicherte Fakten",
  },
  pdf_export: {
    id: "pdf_export",
    emoji: "📄",
    title: "PDF-Export",
    description: "Exportiere Chats als professionelle PDFs.",
    why: "Perfekt für Dokumentation und Kundenkommunikation.",
    tip: "Nutze Firmenbranding für professionelle Ergebnisse.",
    xp: "+3 XP pro Export",
  },
};

interface Props {
  hintId: keyof typeof HINTS;
  className?: string;
  variant?: "inline" | "floating" | "card";
}

export default function ContextualHints({ hintId, className, variant = "inline" }: Props) {
  const { educationMode, dismissedTips, dismissTip } = useEducation();

  if (!educationMode) return null;

  const hint = HINTS[hintId];
  if (!hint || dismissedTips.has(hint.id)) return null;

  if (variant === "card") {
    return (
      <div className={cn(
        "bg-card border border-primary/20 rounded-xl p-4 animate-fade-in",
        className
      )}>
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0">{hint.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold">{hint.title}</h4>
              <button onClick={() => dismissTip(hint.id)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-1.5">{hint.description}</p>
            <p className="text-xs text-primary/80 italic mb-2">Warum? {hint.why}</p>
            {hint.example && (
              <div className="bg-muted/50 rounded-lg px-3 py-2 mb-2">
                <p className="text-[11px] text-muted-foreground">{hint.example}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              {hint.xp && (
                <span className="text-[10px] font-medium text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />{hint.xp}
                </span>
              )}
              {hint.tip && (
                <span className="text-[10px] text-muted-foreground">💡 {hint.tip}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <div className={cn(
        "fixed bottom-20 right-4 z-50 max-w-xs w-full animate-fade-in",
        className
      )}>
        <div className="bg-card border border-primary/20 rounded-xl shadow-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-lg shrink-0">{hint.emoji}</span>
            <div className="flex-1">
              <h4 className="text-xs font-bold mb-0.5">{hint.title}</h4>
              <p className="text-xs text-muted-foreground">{hint.description}</p>
              <p className="text-xs text-primary/80 mt-1 italic">Warum? {hint.why}</p>
              {hint.tip && (
                <p className="text-[10px] text-muted-foreground mt-1.5">💡 {hint.tip}</p>
              )}
              {hint.xp && (
                <span className="text-[10px] font-medium text-primary flex items-center gap-1 mt-1">
                  <Sparkles className="w-3 h-3" />{hint.xp}
                </span>
              )}
            </div>
            <button onClick={() => dismissTip(hint.id)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div className={cn(
      "flex items-start gap-2.5 bg-primary/5 border border-primary/10 rounded-lg px-3 py-2.5",
      className
    )}>
      <span className="text-sm shrink-0 mt-0.5">{hint.emoji}</span>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{hint.description}</p>
        <p className="text-[11px] text-primary/70 mt-0.5 italic">Warum? {hint.why}</p>
        {hint.xp && (
          <span className="text-[10px] font-medium text-primary flex items-center gap-1 mt-1">
            <Sparkles className="w-3 h-3" />{hint.xp}
          </span>
        )}
      </div>
      <button onClick={() => dismissTip(hint.id)} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export { HINTS };
