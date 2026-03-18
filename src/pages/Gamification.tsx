import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGamification } from "@/hooks/useGamification";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, BookOpen, Flame, Target, Sparkles } from "lucide-react";
import LevelBadge from "@/components/LevelBadge";
import AchievementCard from "@/components/AchievementCard";
import StreakCounter from "@/components/StreakCounter";
import ProfilePublish from "@/components/ProfilePublish";
import EducationToggle from "@/components/EducationToggle";
import AppLayout from "@/components/AppLayout";

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

export default function GamificationPage() {
  const { user } = useAuth();
  const { achievements, userLevel } = useGamification();
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

  const streakDays = Math.min(Math.floor((userLevel?.total_xp ?? 0) / 25), 30);
  const completedPaths = paths.filter((p) => progress[p.id]?.completed_at).length;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Gamification & Lernen</h1>
            <p className="text-sm text-muted-foreground">Dein Fortschritt, deine Erfolge.</p>
          </div>
          <div className="flex items-center gap-3">
            <EducationToggle />
            <ProfilePublish />
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="achievements">Badges</TabsTrigger>
            <TabsTrigger value="learning">Lernpfade</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <LevelBadge variant="full" />
              <Card>
                <CardContent className="p-5 text-center">
                  <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-extrabold">{achievements.length}</p>
                  <p className="text-xs text-muted-foreground">Badges verdient</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 text-center">
                  <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-extrabold">{completedPaths}/{paths.length}</p>
                  <p className="text-xs text-muted-foreground">Lernpfade</p>
                </CardContent>
              </Card>
              <StreakCounter days={streakDays} />
            </div>

            {/* Next goals */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-primary" />
                  Nächste Ziele
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {userLevel && userLevel.current_level < 10 && (
                    <p>🎯 Erreiche Level {userLevel.current_level + 1} – noch {userLevel.xp_for_next_level} XP</p>
                  )}
                  {completedPaths < paths.length && (
                    <p>📚 Schließe deinen nächsten Lernpfad ab</p>
                  )}
                  {achievements.length < 10 && (
                    <p>🏆 Schalte {10 - achievements.length} weitere Badges frei</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {achievements.map((a) => (
                <AchievementCard key={a.id} achievement={a} />
              ))}
              {achievements.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  Noch keine Badges freigeschaltet. Starte mit deinem ersten Chat!
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="learning" className="mt-4 space-y-3">
            {paths.map((path) => {
              const prog = progress[path.id];
              const pct = prog?.progress_percentage ?? 0;
              const isComplete = !!prog?.completed_at;

              return (
                <Card key={path.id} className={isComplete ? "border-primary/20 bg-primary/5" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{path.icon_emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm">{path.title}</h4>
                          <Badge variant="outline" className="text-[10px]">{path.difficulty}</Badge>
                        </div>
                        <Progress value={pct} className="h-2 mb-1" />
                        <span className="text-[10px] text-muted-foreground">{pct}% · {path.estimated_time_minutes} Min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
