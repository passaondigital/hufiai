import { useGamification } from "@/hooks/useGamification";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  compact?: boolean;
}

export default function ModuleProgress({ className, compact }: Props) {
  const { userLevel, levelEmoji, levelName, LEVEL_EMOJIS } = useGamification();

  if (!userLevel) return null;

  const level = userLevel.current_level;
  const totalXP = userLevel.total_xp;
  const xpForNext = userLevel.xp_for_next_level;
  // Calculate progress within current level
  const THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1600, 2100, 2700, 3500];
  const currentThreshold = THRESHOLDS[level - 1] || 0;
  const nextThreshold = THRESHOLDS[level] || currentThreshold;
  const levelRange = nextThreshold - currentThreshold;
  const levelProgress = levelRange > 0 ? Math.min(((totalXP - currentThreshold) / levelRange) * 100, 100) : 100;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-lg">{levelEmoji}</span>
        <div className="flex-1">
          <Progress value={levelProgress} className="h-1.5" />
        </div>
        <span className="text-[10px] font-bold text-muted-foreground">{totalXP} XP</span>
      </div>
    );
  }

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{levelEmoji}</span>
          <div>
            <p className="text-sm font-bold">Level {level} · {levelName}</p>
            <p className="text-[11px] text-muted-foreground">{totalXP} XP gesamt</p>
          </div>
        </div>
        {level < 10 && (
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Nächstes Level</p>
            <p className="text-xs font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              {xpForNext} XP
            </p>
          </div>
        )}
      </div>
      <Progress value={levelProgress} className="h-2" />
      {level < 10 && (
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">{LEVEL_EMOJIS[level]} Lvl {level}</span>
          <span className="text-[10px] text-muted-foreground">{LEVEL_EMOJIS[level + 1]} Lvl {level + 1}</span>
        </div>
      )}
    </div>
  );
}
