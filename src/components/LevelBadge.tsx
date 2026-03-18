import { useGamification } from "@/hooks/useGamification";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "full" | "mini" | "sidebar";
  className?: string;
}

const THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1600, 2100, 2700, 3500];

export default function LevelBadge({ variant = "full", className }: Props) {
  const { userLevel, levelEmoji, levelName } = useGamification();

  if (!userLevel) return null;

  const level = userLevel.current_level;
  const totalXP = userLevel.total_xp;
  const currentThreshold = THRESHOLDS[level - 1] || 0;
  const nextThreshold = THRESHOLDS[level] || currentThreshold;
  const levelRange = nextThreshold - currentThreshold;
  const progress = levelRange > 0 ? Math.min(((totalXP - currentThreshold) / levelRange) * 100, 100) : 100;

  if (variant === "mini") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <span className="text-base">{levelEmoji}</span>
        <span className="text-[10px] font-bold text-muted-foreground">Lvl {level}</span>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2", className)}>
        <span className="text-lg">{levelEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-bold truncate">{levelName}</span>
            <span className="text-[10px] text-muted-foreground">{totalXP} XP</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>
    );
  }

  // Full variant – dashboard display
  return (
    <div className={cn("bg-card border border-border rounded-2xl p-6 text-center", className)}>
      <div className="text-5xl mb-3 animate-scale-in">{levelEmoji}</div>
      <h3 className="text-lg font-bold mb-0.5">Level {level}</h3>
      <p className="text-sm text-muted-foreground mb-4">{levelName}</p>
      <Progress value={progress} className="h-2.5 mb-2" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{totalXP} XP</span>
        {level < 10 && (
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            {nextThreshold} XP für Lvl {level + 1}
          </span>
        )}
      </div>
    </div>
  );
}
