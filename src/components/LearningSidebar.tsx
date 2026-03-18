import { useGamification } from "@/hooks/useGamification";
import { useEducation } from "@/hooks/useEducation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1600, 2100, 2700, 3500];

interface Props {
  className?: string;
  onStartLearning?: () => void;
}

export default function LearningSidebar({ className, onStartLearning }: Props) {
  const navigate = useNavigate();
  const { userLevel, levelEmoji, levelName, achievements } = useGamification();
  const { educationMode } = useEducation();

  if (!educationMode && !userLevel) return null;

  const level = userLevel?.current_level ?? 1;
  const totalXP = userLevel?.total_xp ?? 0;
  const currentThreshold = THRESHOLDS[level - 1] || 0;
  const nextThreshold = THRESHOLDS[level] || currentThreshold;
  const levelRange = nextThreshold - currentThreshold;
  const progress = levelRange > 0 ? Math.min(((totalXP - currentThreshold) / levelRange) * 100, 100) : 100;

  const suggestedPaths: Record<number, string> = {
    1: "AI Basics",
    2: "Prompt Mastery",
    3: "Content Creation",
    4: "Business AI",
    5: "Memory & Mastery",
  };
  const suggestedPath = suggestedPaths[Math.min(level, 5)] ?? "Collaboration";

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4 space-y-4", className)}>
      {/* Level & XP */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{levelEmoji}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold">Level {level} · {levelName}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <span className="text-[10px] text-muted-foreground mt-0.5 block">{totalXP} / {nextThreshold} XP</span>
        </div>
      </div>

      {/* Achievements count */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <Trophy className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium">{achievements.length} Badges verdient</span>
      </div>

      {/* Suggested path */}
      {educationMode && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold">Empfohlener Lernpfad</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{suggestedPath}</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs"
            onClick={onStartLearning ?? (() => navigate("/knowledge"))}
          >
            Lernpfad starten <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
