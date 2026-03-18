import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGamification } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Clock, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import LearningModule from "@/components/LearningModule";

interface LearningPath {
  id: string;
  code: string;
  title: string;
  description: string;
  icon_emoji: string;
  difficulty: string;
  estimated_time_minutes: number;
  order_position: number;
}

interface UserProgress {
  learning_path_id: string;
  progress_percentage: number;
  completed_modules: number;
  total_modules: number | null;
  completed_at: string | null;
}

interface Module {
  id: string;
  learning_path_id: string;
  order_position: number;
  title: string;
  content_type: string;
  duration_minutes: number;
  xp_reward: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-600 border-green-500/20",
  intermediate: "bg-primary/10 text-primary border-primary/20",
  advanced: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Anfänger",
  intermediate: "Fortgeschritten",
  advanced: "Profi",
};

const LEVEL_REQUIREMENTS: Record<string, number> = {
  AI_BASICS: 1,
  PROMPT_MASTERY: 2,
  CONTENT_CREATION: 3,
  BUSINESS_AI: 4,
  MEMORY_MASTERY: 4,
  COLLABORATION: 3,
};

export default function LearningDashboard() {
  const { user } = useAuth();
  const { userLevel } = useGamification();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [modules, setModules] = useState<Record<string, Module[]>>({});
  const [activePath, setActivePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;

    const [pathsRes, progressRes, modulesRes] = await Promise.all([
      supabase.from("learning_paths").select("*").order("order_position"),
      supabase.from("user_learning_progress").select("*").eq("user_id", user.id),
      supabase.from("learning_modules").select("*").order("order_position"),
    ]);

    if (pathsRes.data) setPaths(pathsRes.data as unknown as LearningPath[]);

    if (progressRes.data) {
      const map: Record<string, UserProgress> = {};
      for (const p of progressRes.data as unknown as UserProgress[]) {
        map[p.learning_path_id] = p;
      }
      setProgress(map);
    }

    if (modulesRes.data) {
      const map: Record<string, Module[]> = {};
      for (const m of modulesRes.data as unknown as Module[]) {
        if (!map[m.learning_path_id]) map[m.learning_path_id] = [];
        map[m.learning_path_id].push(m);
      }
      setModules(map);
    }

    setLoading(false);
  }

  const currentLevel = userLevel?.current_level ?? 1;

  if (activePath) {
    const path = paths.find((p) => p.id === activePath);
    if (path) {
      return (
        <LearningModule
          path={path}
          modules={modules[path.id] || []}
          progress={progress[path.id]}
          onBack={() => { setActivePath(null); fetchData(); }}
        />
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Lernpfade</h2>
        <p className="text-sm text-muted-foreground">
          Schritt für Schritt zum KI-Profi – wähle deinen Pfad.
        </p>
      </div>

      <div className="grid gap-4">
        {paths.map((path) => {
          const pathProgress = progress[path.id];
          const pathModules = modules[path.id] || [];
          const requiredLevel = LEVEL_REQUIREMENTS[path.code] ?? 1;
          const isLocked = currentLevel < requiredLevel;
          const isCompleted = !!pathProgress?.completed_at;
          const progressPct = pathProgress?.progress_percentage ?? 0;
          const totalXP = pathModules.reduce((s, m) => s + m.xp_reward, 0);

          return (
            <Card
              key={path.id}
              className={cn(
                "transition-all cursor-pointer group",
                isLocked && "opacity-50 cursor-not-allowed",
                isCompleted && "border-primary/30 bg-primary/5",
                !isLocked && !isCompleted && "hover:border-primary/40 hover:shadow-md"
              )}
              onClick={() => !isLocked && setActivePath(path.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="text-3xl shrink-0">{path.icon_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-base">{path.title}</h3>
                      <Badge variant="outline" className={cn("text-[10px]", DIFFICULTY_COLORS[path.difficulty])}>
                        {DIFFICULTY_LABELS[path.difficulty] ?? path.difficulty}
                      </Badge>
                      {isCompleted && (
                        <Badge className="bg-primary/10 text-primary text-[10px] border-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Abgeschlossen
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{path.description}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {path.estimated_time_minutes} Min
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> {totalXP} XP
                      </span>
                      <span>{pathModules.length} Module</span>
                    </div>

                    {!isLocked && progressPct > 0 && (
                      <div className="flex items-center gap-3">
                        <Progress value={progressPct} className="h-2 flex-1" />
                        <span className="text-xs font-medium text-muted-foreground w-10 text-right">{progressPct}%</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 self-center">
                    {isLocked ? (
                      <div className="flex flex-col items-center gap-1">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Lvl {requiredLevel}</span>
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
