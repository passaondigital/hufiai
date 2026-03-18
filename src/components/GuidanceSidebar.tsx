import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGamification } from "@/hooks/useGamification";
import { useEducation } from "@/hooks/useEducation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { GraduationCap, ChevronRight, Target, Sparkles, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LearningPath {
  id: string;
  code: string;
  title: string;
  icon_emoji: string;
  difficulty: string;
}

export default function GuidanceSidebar({ className }: { className?: string }) {
  const { educationMode } = useEducation();
  const { user } = useAuth();
  const { userLevel, levelEmoji, levelName, achievements } = useGamification();
  const navigate = useNavigate();
  const [suggestedPath, setSuggestedPath] = useState<LearningPath | null>(null);

  useEffect(() => {
    if (!user || !educationMode) return;
    // Find a path the user hasn't completed
    Promise.all([
      supabase.from("learning_paths").select("id, code, title, icon_emoji, difficulty").order("order_position"),
      supabase.from("user_learning_progress").select("learning_path_id, completed_at").eq("user_id", user.id),
    ]).then(([pathsRes, progRes]) => {
      const completedIds = new Set(
        (progRes.data || []).filter((p: any) => p.completed_at).map((p: any) => p.learning_path_id)
      );
      const next = (pathsRes.data || []).find((p: any) => !completedIds.has(p.id));
      if (next) setSuggestedPath(next as unknown as LearningPath);
    });
  }, [user, educationMode]);

  if (!educationMode) return null;

  const level = userLevel?.current_level ?? 1;
  const totalXP = userLevel?.total_xp ?? 0;
  const THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1600, 2100, 2700, 3500];
  const currentThreshold = THRESHOLDS[level - 1] || 0;
  const nextThreshold = THRESHOLDS[level] || currentThreshold;
  const progress = nextThreshold > currentThreshold
    ? Math.min(((totalXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100)
    : 100;

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4 space-y-4", className)}>
      <div className="flex items-center gap-2 text-sm font-bold">
        <GraduationCap className="w-4 h-4 text-primary" />
        Lern-Guide
      </div>

      {/* Level progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span>{levelEmoji}</span>
            <span className="font-medium">{levelName}</span>
          </span>
          <span className="text-muted-foreground">{totalXP} XP</span>
        </div>
        <Progress value={progress} className="h-1.5" />
        {level < 10 && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            {nextThreshold - totalXP} XP bis Level {level + 1}
          </p>
        )}
      </div>

      {/* Next achievement */}
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Nächstes Ziel</p>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs">
            {achievements.length < 5
              ? `Schalte ${5 - achievements.length} weitere Badges frei`
              : level < 5
                ? `Erreiche Level ${level + 1}`
                : "Schließe einen Lernpfad ab"}
          </p>
        </div>
      </div>

      {/* Suggested path */}
      {suggestedPath && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Empfohlener Lernpfad</p>
          <button
            onClick={() => navigate("/gamification")}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/30 transition-colors text-left"
          >
            <span className="text-xl">{suggestedPath.icon_emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{suggestedPath.title}</p>
              <p className="text-[10px] text-muted-foreground">{suggestedPath.difficulty}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        </div>
      )}

      {/* Start learning CTA */}
      <Button
        size="sm"
        className="w-full gap-2 text-xs"
        onClick={() => navigate("/gamification")}
      >
        <BookOpen className="w-3.5 h-3.5" />
        Lernpfade öffnen
      </Button>
    </div>
  );
}
