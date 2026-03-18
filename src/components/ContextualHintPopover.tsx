import { useState } from "react";
import { X, ChevronRight, Lightbulb } from "lucide-react";
import { useEducation } from "@/hooks/useEducation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface HintConfig {
  code: string;
  emoji: string;
  title: string;
  content: string;
  example?: string;
  tip?: string;
  xp?: string;
  learnMorePath?: string;
}

const POPOVER_HINTS: Record<string, HintConfig> = {
  scout_mode: {
    code: "scout_mode",
    emoji: "🔍",
    title: "Research Mode Unlocked",
    content: "Scout Mode is perfect for research & analysis.\nWhy: It uses deeper thinking for complex questions.",
    example: "„Recherchiere die neuesten Hufpflege-Studien"",
    tip: "Ask a research question and see the difference!",
    xp: "+2 XP pro Scout-Chat",
    learnMorePath: "/gamification",
  },
  canvas_mode: {
    code: "canvas_mode",
    emoji: "✍️",
    title: "Creative Mode Unlocked",
    content: "Canvas is for content creation. Fast. Creative.",
    example: "„Write an Instagram post about barhoof care"",
    tip: "Generate an image after writing!",
    xp: "+2 XP pro Canvas-Chat",
    learnMorePath: "/gamification",
  },
  prompt_library: {
    code: "prompt_library",
    emoji: "📚",
    title: "Prompts Available",
    content: "Pre-made prompts save time. Click one, it auto-fills.",
    tip: "Try 'Scout Master' prompt for deep research.",
    xp: "+3 XP für Custom Prompts",
    learnMorePath: "/prompts",
  },
  favorites: {
    code: "favorites",
    emoji: "⭐",
    title: "Save Your Favorites",
    content: "Click ⭐ to save prompts you love.\nWhy: Quick access = faster workflow.",
    tip: "Create 3-5 favorites for your workflow.",
    xp: "+5 XP für gespeicherte Favoriten",
  },
  memory: {
    code: "memory",
    emoji: "🧠",
    title: "AI Remembers About You",
    content: "Master Memory learns from your chats.\nWhy: AI gets better at helping you over time.",
    tip: "Use Memory System, then ask about yourself.",
    xp: "+5 XP für 10 gespeicherte Fakten",
  },
  collaboration: {
    code: "collaboration",
    emoji: "🤝",
    title: "Collaborate with Friends",
    content: "Invite friends to work together.\nWhy: Two brains > one brain.",
    tip: "Help a friend = +10 XP achievement!",
    xp: "+10 XP Achievement",
  },
};

interface Props {
  hintCode: keyof typeof POPOVER_HINTS;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function ContextualHintPopover({ hintCode, children, side = "bottom", className }: Props) {
  const { educationMode, dismissedTips, dismissTip } = useEducation();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const hint = POPOVER_HINTS[hintCode];
  if (!hint || !educationMode || dismissedTips.has(hint.code)) return <>{children}</>;

  const handleDismiss = () => {
    if (dontShowAgain) {
      dismissTip(hint.code);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          {children}
          {/* Pulsing badge indicator */}
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse" />
        </div>
      </PopoverTrigger>
      <PopoverContent side={side} className="w-80 p-0 overflow-hidden" align="start">
        <div className="bg-primary/5 px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <span>{hint.emoji}</span>
              {hint.title}
            </h4>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="px-4 py-3 space-y-3">
          <p className="text-sm text-muted-foreground whitespace-pre-line">{hint.content}</p>

          {hint.example && (
            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground italic">{hint.example}</p>
            </div>
          )}

          {hint.tip && (
            <p className="text-xs text-primary flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
              {hint.tip}
            </p>
          )}

          {hint.xp && (
            <p className="text-[10px] font-medium text-primary/80">🎯 {hint.xp}</p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3 h-3 rounded border-border"
              />
              Nicht mehr anzeigen
            </label>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs h-7">
              Verstanden
            </Button>
            {hint.learnMorePath && (
              <Button size="sm" onClick={() => { dismissTip(hint.code); setOpen(false); }} className="text-xs h-7 gap-1">
                Mehr lernen <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { POPOVER_HINTS };
