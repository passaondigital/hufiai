import { X, Lightbulb } from "lucide-react";
import { useEducation } from "@/hooks/useEducation";
import { cn } from "@/lib/utils";

interface Hint {
  id: string;
  title: string;
  description: string;
  why?: string;
}

const HINTS: Record<string, Hint> = {
  scout_mode: {
    id: "scout_mode",
    title: "Scout-Modus",
    description: "Nutze den Scout-Modus für Recherche und Faktensuche.",
    why: "Scout liefert präzise, faktenbasierte Antworten – ideal für Wissensaufbau.",
  },
  canvas_mode: {
    id: "canvas_mode",
    title: "Canvas-Modus",
    description: "Canvas ist dein Kreativ-Modus für Texte und Posts.",
    why: "Kreative Inhalte brauchen Freiheit – Canvas gibt dir genau das.",
  },
  custom_prompt: {
    id: "custom_prompt",
    title: "Custom Prompt erstellen",
    description: "Erstelle eigene Prompts für wiederkehrende Aufgaben.",
    why: "Eigene Prompts sparen dir jedes Mal 5-10 Minuten Zeit.",
  },
  favorites: {
    id: "favorites",
    title: "Favoriten speichern",
    description: "Speichere deine besten Prompts als Favoriten.",
    why: "Schnellzugriff auf bewährte Prompts = sofortige Produktivität.",
  },
  memory: {
    id: "memory",
    title: "Memory-System",
    description: "Die KI merkt sich wichtige Fakten aus deinen Chats.",
    why: "Je mehr die KI über dich weiß, desto besser werden die Antworten.",
  },
  pdf_export: {
    id: "pdf_export",
    title: "PDF-Export",
    description: "Exportiere Chats als professionelle PDFs.",
    why: "Perfekt für Dokumentation und Kundenkommunikation.",
  },
};

interface Props {
  hintId: keyof typeof HINTS;
  className?: string;
  variant?: "inline" | "floating";
}

export default function ContextualHints({ hintId, className, variant = "inline" }: Props) {
  const { educationMode, dismissedTips, dismissTip } = useEducation();

  if (!educationMode) return null;

  const hint = HINTS[hintId];
  if (!hint || dismissedTips.has(hint.id)) return null;

  if (variant === "floating") {
    return (
      <div className={cn(
        "fixed bottom-20 right-4 z-50 max-w-xs w-full animate-fade-in",
        className
      )}>
        <div className="bg-card border border-primary/20 rounded-xl shadow-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold mb-0.5">{hint.title}</h4>
              <p className="text-xs text-muted-foreground">{hint.description}</p>
              {hint.why && (
                <p className="text-xs text-primary/80 mt-1.5 italic">
                  Warum? {hint.why}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissTip(hint.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-2.5 bg-primary/5 border border-primary/10 rounded-lg px-3 py-2.5",
      className
    )}>
      <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{hint.description}</p>
        {hint.why && (
          <p className="text-[11px] text-primary/70 mt-1 italic">Warum? {hint.why}</p>
        )}
      </div>
      <button
        onClick={() => dismissTip(hint.id)}
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export { HINTS };
