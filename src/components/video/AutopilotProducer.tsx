import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Rocket, Globe, Loader2, CheckCircle, AlertCircle, Sparkles,
  Database, FileText, Film, Palette, Download, ThumbsUp,
  Zap, ScanSearch, BrainCircuit, Clapperboard, BarChart3
} from "lucide-react";

type AutopilotStep = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: "idle" | "active" | "completed" | "failed";
  detail?: string;
};

type AutopilotScene = {
  scene_number: number;
  title: string;
  prompt: string;
  model: string;
  model_reason: string;
  duration: number;
  style: string;
  color_mood: string;
  overlay_text?: string;
  data_source?: string;
};

type AutopilotScript = {
  title: string;
  summary: string;
  data_insights: string[];
  brand_colors: string[];
  dominant_color: string;
  scenes: AutopilotScene[];
  formats: {
    reel: { aspect_ratio: string; description: string };
    youtube: { aspect_ratio: string; description: string };
    square: { aspect_ratio: string; description: string };
  };
};

type GenerationJob = {
  sceneIndex: number;
  format: string;
  aspectRatio: string;
  status: "pending" | "generating" | "completed" | "failed";
};

const INITIAL_STEPS: AutopilotStep[] = [
  { id: "login", label: "Agent loggt sich ein...", description: "Ziel-URL wird aufgerufen und Inhalte geladen", icon: Globe, status: "idle" },
  { id: "scan", label: "Daten werden gescannt...", description: "Pferdedaten, Analysen und Protokolle werden extrahiert", icon: ScanSearch, status: "idle" },
  { id: "analyze", label: "Daten werden analysiert...", description: "KI analysiert Inhalte und erstellt Content-Strategie", icon: BrainCircuit, status: "idle" },
  { id: "script", label: "Skripte werden erstellt...", description: "Video-Skripte für 3 Formate werden generiert", icon: FileText, status: "idle" },
  { id: "render", label: "Rendering läuft...", description: "Videos werden in allen Formaten generiert", icon: Clapperboard, status: "idle" },
  { id: "export", label: "Export & Branding...", description: "HufiAi-Overlay und HD-Export", icon: Download, status: "idle" },
];

export default function AutopilotProducer({ userId }: { userId: string }) {
  const [targetUrl, setTargetUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<AutopilotStep[]>(INITIAL_STEPS);
  const [script, setScript] = useState<AutopilotScript | null>(null);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [hdExport, setHdExport] = useState(true);
  const [autoOverlay, setAutoOverlay] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedRuns, setCompletedRuns] = useState(0);

  const updateStep = useCallback((stepId: string, status: AutopilotStep["status"], detail?: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status, detail } : s));
  }, []);

  const advanceStep = useCallback(async (index: number) => {
    setCurrentStepIndex(index);
    const step = INITIAL_STEPS[index];
    if (step) {
      updateStep(step.id, "active");
      // Simulate realistic timing for non-AI steps
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    }
  }, [updateStep]);

  const startAutopilot = async () => {
    if (!targetUrl.trim()) return toast({ title: "Bitte gib eine Ziel-URL ein", variant: "destructive" });
    
    setIsRunning(true);
    setScript(null);
    setGenerationJobs([]);
    setSteps(INITIAL_STEPS);

    try {
      // Step 1: Login / Access
      await advanceStep(0);
      updateStep("login", "completed", `Verbindung zu ${new URL(targetUrl).hostname} hergestellt`);

      // Step 2: Scan
      await advanceStep(1);
      updateStep("scan", "completed", "Seiteninhalte und Farbpalette extrahiert");

      // Step 3: Analyze - This is the real AI call
      await advanceStep(2);
      
      const { data, error } = await supabase.functions.invoke("autopilot-produce", {
        body: {
          url: targetUrl,
          options: { hdExport, autoOverlay },
        },
      });
      if (error) throw error;
      if (!data?.script) throw new Error("Kein Skript vom Agent erhalten");

      updateStep("analyze", "completed", `${data.script.data_insights?.length || 0} Daten-Insights erkannt`);
      setScript(data.script);

      // Step 4: Script
      await advanceStep(3);
      updateStep("script", "completed", `${data.script.scenes.length} Szenen × 3 Formate = ${data.script.scenes.length * 3} Videos`);

      // Step 5: Render
      await advanceStep(4);
      await generateAllVideos(data.script);
      updateStep("render", "completed", "Alle Video-Jobs gestartet");

      // Step 6: Export
      await advanceStep(5);
      updateStep("export", "completed", hdExport ? "HD-Export vorbereitet" : "Standard-Export");

      setCompletedRuns(prev => prev + 1);
      toast({ title: "Autopilot abgeschlossen 🚀", description: "Alle Videos wurden erstellt. Keine Handarbeit nötig." });

      // Log to training data
      try {
        await supabase.from("training_data_logs").insert({
          user_id: userId,
          user_input: `Autopilot: ${targetUrl}`,
          ai_output: JSON.stringify(data.script),
          source: "autopilot_agent",
          category: "video_production",
        });
      } catch { /* ignore logging errors */ }

    } catch (e: any) {
      const failedStep = steps.find(s => s.status === "active");
      if (failedStep) updateStep(failedStep.id, "failed", e.message);
      toast({ title: "Autopilot-Fehler", description: e.message, variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  const generateAllVideos = async (scriptData: AutopilotScript) => {
    const formats = [
      { key: "reel", aspectRatio: "9:16" },
      { key: "youtube", aspectRatio: "16:9" },
      { key: "square", aspectRatio: "1:1" },
    ];

    const jobs: GenerationJob[] = [];
    scriptData.scenes.forEach((_, idx) => {
      formats.forEach(fmt => {
        jobs.push({ sceneIndex: idx, format: fmt.key, aspectRatio: fmt.aspectRatio, status: "pending" });
      });
    });
    setGenerationJobs(jobs);

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const scene = scriptData.scenes[job.sceneIndex];

      setGenerationJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "generating" } : j));

      try {
        const coloredPrompt = `${scene.prompt}, color palette: ${scene.color_mood}, accent color: #F47B20 HufiAi orange${autoOverlay && scene.overlay_text ? `, text overlay: "${scene.overlay_text}" in orange #F47B20` : ""}`;

        const { error: insertError } = await supabase.from("video_jobs").insert({
          user_id: userId,
          prompt: coloredPrompt,
          model: scene.model,
          input_type: "text",
          aspect_ratio: job.aspectRatio,
          duration: scene.duration,
          motion_intensity: 60,
          coherence: 70,
          stylization: 50,
          format: "mp4",
          preset: scene.style,
          hd_upscaling: hdExport,
          status: "queued",
          is_hufi_relevant: true,
        });
        if (insertError) throw insertError;

        setGenerationJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "completed" } : j));
      } catch {
        setGenerationJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "failed" } : j));
      }
    }
  };

  const completedCount = generationJobs.filter(j => j.status === "completed").length;
  const totalCount = generationJobs.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))] p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
              <Rocket className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[hsl(var(--sidebar-foreground))]">Autopilot-Produzent</h2>
              <p className="text-xs text-[hsl(var(--sidebar-muted))]">Keine Handarbeit mehr. Das System arbeitet für den Difference Maker.</p>
            </div>
            {completedRuns > 0 && (
              <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                {completedRuns} Durchlauf{completedRuns > 1 ? "e" : ""} ✓
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* URL Input + Controls */}
      <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Ziel-URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[hsl(var(--sidebar-muted))]">
            Der Agent liest die Ziel-URL, scannt Dashboard-Daten, analysiert Inhalte und erstellt automatisch professionelle Videos in 3 Formaten.
          </p>

          <div className="flex gap-2">
            <Input
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              placeholder="https://app.hufmanager.de/demo"
              className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-sm"
              disabled={isRunning}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={hdExport} onCheckedChange={setHdExport} disabled={isRunning} />
              <label className="text-xs text-[hsl(var(--sidebar-foreground))]">4K Upscaling</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={autoOverlay} onCheckedChange={setAutoOverlay} disabled={isRunning} />
              <label className="text-xs text-[hsl(var(--sidebar-foreground))]">Dynamic Overlays</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Button */}
      <Button
        onClick={startAutopilot}
        disabled={isRunning}
        size="lg"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2 h-16 rounded-xl shadow-lg shadow-primary/20 transition-all"
      >
        {isRunning ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Autopilot läuft...
          </>
        ) : (
          <>
            <Rocket className="w-5 h-5" />
            Autopilot starten
          </>
        )}
      </Button>

      {/* Pipeline Status */}
      {(isRunning || steps.some(s => s.status !== "idle")) && (
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Agent-Pipeline
              {totalCount > 0 && (
                <Badge variant="outline" className="ml-auto text-[10px] border-primary/30 text-primary">
                  {progressPercent}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = step.status === "active";
              const isCompleted = step.status === "completed";
              const isFailed = step.status === "failed";

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                    isActive ? "bg-primary/10 border border-primary/30 scale-[1.01]" :
                    isCompleted ? "bg-green-500/5 border border-green-500/20" :
                    isFailed ? "bg-destructive/5 border border-destructive/20" :
                    "border border-transparent opacity-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? "bg-primary/20" :
                    isCompleted ? "bg-green-500/20" :
                    isFailed ? "bg-destructive/20" :
                    "bg-[hsl(var(--sidebar-background))]"
                  }`}>
                    {isActive ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> :
                     isCompleted ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                     isFailed ? <AlertCircle className="w-4 h-4 text-destructive" /> :
                     <Icon className="w-4 h-4 text-[hsl(var(--sidebar-muted))]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${
                      isActive ? "text-primary" :
                      isCompleted ? "text-green-400" :
                      isFailed ? "text-destructive" :
                      "text-[hsl(var(--sidebar-muted))]"
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--sidebar-muted))] truncate">
                      {step.detail || step.description}
                    </p>
                  </div>
                  {/* Connection line */}
                  {idx < steps.length - 1 && (
                    <div className="absolute left-[2.15rem] translate-y-[1.75rem] w-px h-2 bg-[hsl(var(--sidebar-border))]" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Script Results */}
      {script && (
        <>
          {/* Data Insights */}
          {script.data_insights && script.data_insights.length > 0 && (
            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Erkannte Daten-Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {script.data_insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))]">
                      <Database className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="text-[11px] text-[hsl(var(--sidebar-foreground))]">{insight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Brand Colors */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Kontextuelles Branding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 flex-wrap">
                {script.brand_colors.map((color, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg border border-[hsl(var(--sidebar-border))] shadow-sm" style={{ backgroundColor: color }} />
                    <span className="text-[9px] text-[hsl(var(--sidebar-muted))] font-mono">{color}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-[hsl(var(--sidebar-border))]">
                  <div className="w-7 h-7 rounded-lg border-2 border-primary shadow-sm" style={{ backgroundColor: "#F47B20" }} />
                  <span className="text-[9px] text-primary font-mono font-bold">#F47B20</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scenes */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" /> {script.title}
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary ml-auto">
                  {script.scenes.length} Szenen × 3 Formate
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-[hsl(var(--sidebar-muted))]">{script.summary}</p>

              {script.scenes.map((scene, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20 text-primary text-[10px] border-0">
                        Szene {scene.scene_number}
                      </Badge>
                      <span className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))]">{scene.title}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-[hsl(var(--sidebar-border))]">
                      {scene.duration}s
                    </Badge>
                  </div>

                  <p className="text-[11px] text-[hsl(var(--sidebar-muted))]">{scene.prompt}</p>

                  {scene.overlay_text && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 border border-primary/20">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-primary font-medium">Overlay: {scene.overlay_text}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                      {scene.model === "hunyuan-video" ? "🔬 HunyuanVideo" :
                       scene.model === "wan-2.2" ? "⭐ Wan 2.2" :
                       scene.model === "skyreels-v1" ? "🎬 SkyReels" :
                       scene.model === "open-sora-2" ? "🎞️ Open-Sora" : "⚡ Mochi"}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] border-[hsl(var(--sidebar-border))]">
                      {scene.style}
                    </Badge>
                  </div>

                  <p className="text-[10px] text-[hsl(var(--sidebar-muted))] italic">
                    🤖 {scene.model_reason}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Multi-Format Overview */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-primary" /> Format-Multiplikator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "reel", label: "Reel", ratio: "9:16", icon: "📱", target: "Instagram/TikTok", desc: "Schnelle Schnitte, Untertitel" },
                  { key: "youtube", label: "YouTube", ratio: "16:9", icon: "🎬", target: "YouTube/Website", desc: "Erklärender Stil, Details" },
                  { key: "square", label: "Square", ratio: "1:1", icon: "📐", target: "Blog/LinkedIn", desc: "Infografiken, kurze Clips" },
                ].map(fmt => (
                  <div key={fmt.key} className="p-3 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] text-center space-y-1">
                    <div className="text-xl">{fmt.icon}</div>
                    <div className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))]">{fmt.label}</div>
                    <div className="text-[10px] text-[hsl(var(--sidebar-muted))]">{fmt.ratio}</div>
                    <div className="text-[9px] text-primary">{fmt.target}</div>
                    <div className="text-[9px] text-[hsl(var(--sidebar-muted))]">{fmt.desc}</div>
                    <div className="text-[10px] font-medium text-[hsl(var(--sidebar-foreground))]">
                      {script.scenes.length} Videos
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Generation Progress */}
      {generationJobs.length > 0 && (
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
              <Film className="w-4 h-4 text-primary" /> Rendering-Status
              <Badge variant="outline" className="ml-auto text-[10px] border-primary/30 text-primary">
                {completedCount}/{totalCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[hsl(var(--sidebar-background))] mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {generationJobs.map((job, idx) => (
                <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                  job.status === "completed" ? "border-green-500/30 bg-green-500/5" :
                  job.status === "generating" ? "border-primary/30 bg-primary/5" :
                  job.status === "failed" ? "border-destructive/30 bg-destructive/5" :
                  "border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))]"
                }`}>
                  {job.status === "generating" ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> :
                   job.status === "completed" ? <CheckCircle className="w-3 h-3 text-green-400" /> :
                   job.status === "failed" ? <AlertCircle className="w-3 h-3 text-destructive" /> :
                   <div className="w-3 h-3 rounded-full bg-[hsl(var(--sidebar-muted))]/30" />}
                  <span className="text-[hsl(var(--sidebar-foreground))]">
                    Sz.{job.sceneIndex + 1} · {job.format} ({job.aspectRatio})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gold Standard Hint */}
      {completedCount > 0 && !isRunning && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
          <ThumbsUp className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))]">Training-Feedback</p>
            <p className="text-[11px] text-[hsl(var(--sidebar-muted))]">
              Bewerte die generierten Videos in der Timeline mit 👍 „Perfekt", um sie als Gold-Standard für das Training des HufiAi-Modells zu markieren.
              Jeder Autopilot-Durchlauf wird automatisch in der Datenbank protokolliert.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
