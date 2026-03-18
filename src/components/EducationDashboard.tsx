import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGamification } from "@/hooks/useGamification";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, BookOpen, Flame, ChevronRight, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import LevelBadge from "@/components/LevelBadge";
import ProfilePublish from "@/components/ProfilePublish";

interface LearningPath {
  id: string;
  code: string;
  title: string;
  icon_emoji: string;
  difficulty: string;
  estimated_time_minutes: number;
}

interface UserProgress {
  learning_path_id: string;
  progress_percentage: number;
  completed_modules: number;
  total_modules: number | null;
  completed_at: string | null;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-success/10 text-success",
  intermediate: "bg-primary/10 text-primary",
  advanced: "bg-warning/10 text-warning",
};

export default function EducationDashboard() {
  const { user } = useAuth();
  const { achievements, levelEmoji, levelName, userLevel } = useGamification();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("learning_paths").select("id, code, title, icon_emoji, difficulty, estimated_time_minutes").order("order_position"),
      supabase.from("user_learning_progress").select("*").eq("user_id", user.id),
    ]).then(([pathsRes, progRes]) => {
      if (pathsRes.data) setPaths(pathsRes.data as unknown as LearningPath[]);
      if (progRes.data) {
        const map: Record<string, UserProgress> = {};
        for (const p of progRes.data as unknown as UserProgress[]) map[p.learning_path_id] = p;
        setProgress(map);
      }
      setLoading(false);
    });
  }, [user]);

  const completedPaths = paths.filter((p) => progress[p.id]?.completed_at).length;
  const totalBadges = achievements.length;

  // Calculate streak (simplified – days since first activity)
  const streakDays = Math.min(Math.floor((userLevel?.total_xp ?? 0) / 25), 30);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Education Dashboard</h2>
          <p className="text-sm text-muted-foreground">Dein Lernfortschritt auf einen Blick.</p>
        </div>
        <ProfilePublish />
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LevelBadge variant="full" />

        <Card>
          <CardContent className="p-5 text-center">
            <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-extrabold">{totalBadges}</p>
            <p className="text-xs text-muted-foreground">Badges verdient</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 text-center">
            <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-extrabold">{completedPaths}/{paths.length}</p>
            <p className="text-xs text-muted-foreground">Lernpfade abgeschlossen</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 text-center">
            <Flame className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-extrabold">{streakDays}</p>
            <p className="text-xs text-muted-foreground">Tage Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Learning paths progress */}
      <div>
        <h3 className="text-lg font-bold mb-4">Lernpfade</h3>
        <div className="space-y-3">
          {paths.map((path) => {
            const prog = progress[path.id];
            const pct = prog?.progress_percentage ?? 0;
            const isComplete = !!prog?.completed_at;

            return (
              <Card key={path.id} className={cn(isComplete && "border-primary/20 bg-primary/5")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl shrink-0">{path.icon_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm">{path.title}</h4>
                        {isComplete && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        <Badge variant="outline" className={cn("text-[10px]", DIFFICULTY_COLORS[path.difficulty])}>
                          {path.difficulty}
                        </Badge>
                      </div>
                      <Progress value={pct} className="h-2 mb-1" />
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>{pct}% abgeschlossen</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />{path.estimated_time_minutes} Min
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Earned badges */}
      {achievements.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4">Verdiente Badges</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {achievements.map((a) => (
              <div
                key={a.id}
                className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-colors"
              >
                <span className="text-3xl block mb-2">{a.icon_emoji}</span>
                <p className="text-xs font-bold">{a.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
