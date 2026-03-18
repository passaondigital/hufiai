import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useGamification } from "@/hooks/useGamification";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Circle, Clock, Play, FileText, Sparkles, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import InteractiveQuiz from "@/components/InteractiveQuiz";
import ModelComparisonContent from "@/components/learning/ModelComparisonContent";
import { toast } from "sonner";

interface LearningPath {
  id: string;
  code: string;
  title: string;
  description: string;
  icon_emoji: string;
  difficulty: string;
  estimated_time_minutes: number;
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

interface UserProgress {
  learning_path_id: string;
  progress_percentage: number;
  completed_modules: number;
  total_modules: number | null;
  completed_at: string | null;
}

const CONTENT_ICONS: Record<string, typeof Play> = {
  video: Play,
  article: FileText,
  interactive: Sparkles,
  quiz: HelpCircle,
};

const CONTENT_LABELS: Record<string, string> = {
  video: "Video",
  article: "Artikel",
  interactive: "Interaktiv",
  quiz: "Quiz",
};

interface Props {
  path: LearningPath;
  modules: Module[];
  progress?: UserProgress;
  onBack: () => void;
}

export default function LearningModule({ path, modules, progress, onBack }: Props) {
  const { user } = useAuth();
  const { awardXP } = useGamification();
  const [completedModules, setCompletedModules] = useState<Set<string>>(() => {
    const count = progress?.completed_modules ?? 0;
    const set = new Set<string>();
    modules.slice(0, count).forEach((m) => set.add(m.id));
    return set;
  });
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const totalModules = modules.length;
  const completedCount = completedModules.size;
  const progressPct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const totalXP = modules.reduce((s, m) => s + m.xp_reward, 0);

  const completeModule = useCallback(async (mod: Module) => {
    if (!user || completedModules.has(mod.id)) return;

    const newCompleted = new Set(completedModules);
    newCompleted.add(mod.id);
    setCompletedModules(newCompleted);

    const newCount = newCompleted.size;
    const newPct = Math.round((newCount / totalModules) * 100);
    const isPathComplete = newCount === totalModules;

    // Award module XP
    await awardXP("complete_module", mod.id);

    // Upsert progress
    const progressData = {
      user_id: user.id,
      learning_path_id: path.id,
      progress_percentage: newPct,
      completed_modules: newCount,
      total_modules: totalModules,
      completed_at: isPathComplete ? new Date().toISOString() : null,
    };

    const { data: existing } = await supabase
      .from("user_learning_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("learning_path_id", path.id)
      .single();

    if (existing) {
      await supabase
        .from("user_learning_progress")
        .update(progressData)
        .eq("id", existing.id);
    } else {
      await supabase.from("user_learning_progress").insert(progressData);
    }

    if (isPathComplete) {
      await awardXP("complete_learning_path", path.id);
      toast.success(`🎉 Lernpfad "${path.title}" abgeschlossen!`);
    }

    setActiveModule(null);
  }, [user, completedModules, totalModules, path, awardXP]);

  // Quiz view
  if (showQuiz && activeModule) {
    const mod = modules.find((m) => m.id === activeModule);
    if (mod) {
      return (
        <InteractiveQuiz
          module={mod}
          pathCode={path.code}
          onComplete={() => {
            completeModule(mod);
            setShowQuiz(false);
          }}
          onBack={() => setShowQuiz(false)}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-3xl">{path.icon_emoji}</div>
        <div>
          <h2 className="text-xl font-bold">{path.title}</h2>
          <p className="text-xs text-muted-foreground">{path.description}</p>
        </div>
      </div>

      {/* Progress overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{completedCount}/{totalModules} Module</span>
            <span className="text-sm text-muted-foreground">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2.5 mb-3" />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{path.estimated_time_minutes} Min</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />{totalXP} XP</span>
          </div>
        </CardContent>
      </Card>

      {/* Module list */}
      <div className="space-y-3">
        {modules.map((mod, i) => {
          const isComplete = completedModules.has(mod.id);
          const isActive = activeModule === mod.id;
          const Icon = CONTENT_ICONS[mod.content_type] ?? FileText;
          // Module is accessible if previous is completed or it's the first
          const prevComplete = i === 0 || completedModules.has(modules[i - 1].id);
          const isAccessible = prevComplete && !isComplete;

          return (
            <Card
              key={mod.id}
              className={cn(
                "transition-all",
                isComplete && "border-primary/20 bg-primary/5",
                isActive && "ring-2 ring-primary/30",
                !isAccessible && !isComplete && "opacity-50"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Status icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    isComplete ? "bg-primary/10" : "bg-muted"
                  )}>
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-sm">{mod.title}</h4>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Icon className="w-3 h-3" />
                        {CONTENT_LABELS[mod.content_type] ?? mod.content_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{mod.duration_minutes} Min</span>
                      <span>+{mod.xp_reward} XP</span>
                    </div>
                  </div>

                  {/* Action */}
                  {!isComplete && isAccessible && (
                    <Button
                      size="sm"
                      variant={mod.content_type === "quiz" ? "default" : "outline"}
                      onClick={() => {
                        if (mod.content_type === "quiz") {
                          setActiveModule(mod.id);
                          setShowQuiz(true);
                        } else {
                          setActiveModule(isActive ? null : mod.id);
                        }
                      }}
                    >
                      {mod.content_type === "quiz" ? "Quiz starten" : isActive ? "Schließen" : "Starten"}
                    </Button>
                  )}
                </div>

                {/* Expanded content (non-quiz) */}
                {isActive && !showQuiz && mod.content_type !== "quiz" && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="bg-muted rounded-xl p-6 text-center mb-4">
                      {mod.content_type === "video" && (
                        <div className="space-y-2">
                          <Play className="w-12 h-12 text-primary mx-auto" />
                          <p className="text-sm text-muted-foreground">Video-Inhalt wird hier angezeigt</p>
                        </div>
                      )}
                      {mod.content_type === "article" && (
                        <div className="space-y-2 text-left">
                          <h4 className="font-bold">{mod.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Dieser Artikel erklärt dir alles, was du über dieses Thema wissen musst.
                            Nimm dir {mod.duration_minutes} Minuten Zeit und lies aufmerksam durch.
                          </p>
                          <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mt-3">
                            <p className="text-xs font-medium text-primary">💡 Kernaussage</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Die wichtigsten Erkenntnisse werden hier zusammengefasst.
                            </p>
                          </div>
                        </div>
                      )}
                      {mod.content_type === "interactive" && (
                        <div className="space-y-2">
                          <Sparkles className="w-12 h-12 text-primary mx-auto" />
                          <p className="text-sm text-muted-foreground">Interaktive Übung – probiere es selbst aus!</p>
                        </div>
                      )}
                    </div>
                    <Button className="w-full" onClick={() => completeModule(mod)}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Als abgeschlossen markieren (+{mod.xp_reward} XP)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
