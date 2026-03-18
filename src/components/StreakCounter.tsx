import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  days: number;
  className?: string;
}

const MILESTONES = [7, 30, 60, 90];

export default function StreakCounter({ days, className }: Props) {
  const currentMilestone = MILESTONES.filter((m) => days >= m).pop();
  const nextMilestone = MILESTONES.find((m) => days < m);
  const isActive = days > 0;

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4", className)}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isActive ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
        )}>
          <Flame className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold">{days}</span>
            <span className="text-xs text-muted-foreground">Tage Streak</span>
          </div>
          {nextMilestone && (
            <p className="text-[10px] text-muted-foreground">
              Noch {nextMilestone - days} Tage bis zum {nextMilestone}-Tage-Milestone!
            </p>
          )}
        </div>
        {currentMilestone && (
          <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-full">
            🔥 {currentMilestone}d
          </span>
        )}
      </div>
    </div>
  );
}
