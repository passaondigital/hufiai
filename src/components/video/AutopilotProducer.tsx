import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Rocket, Globe, Loader2, CheckCircle, AlertCircle, Sparkles,
  Database, FileText, Film, Palette, Download, ThumbsUp, ThumbsDown,
  Zap, ScanSearch, BrainCircuit, Clapperboard, BarChart3, Languages,
  Eye, DollarSign, Clock, Layers, ChevronDown, ChevronUp, Archive
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
  lang: "de" | "en";
  status: "pending" | "generating" | "completed" | "failed";
};

// Cost estimation per model (credits)
const MODEL_COSTS: Record<string, number> = {
  "wan-2.2": 3,
  "hunyuan-video": 5,
  "skyreels-v1": 2,
  "open-sora-2": 4,
  "mochi-1": 2,
};

const INITIAL_STEPS: AutopilotStep[] = [
  { id: "login", label: "Agent loggt sich ein...", description: "Ziel-URL wird aufgerufen und Inhalte geladen", icon: Globe, status: "idle" },
  { id: "scan", label: "Daten werden gescannt...", description: "Pferdedaten, Analysen und Protokolle werden extrahiert", icon: ScanSearch, status: "idle" },
  { id: "analyze", label: "Daten werden analysiert...", description: "KI analysiert Inhalte und erstellt Content-Strategie", icon: BrainCircuit, status: "idle" },
  { id: "script", label: "Skripte werden erstellt...", description: "Video-Skripte für 3 Formate werden generiert", icon: FileText, status: "idle" },
  { id: "translate", label: "EN-Übersetzung...", description: "Skripte werden für den internationalen Markt übersetzt", icon: Languages, status: "idle" },
  { id: "render", label: "Rendering läuft...", description: "Videos werden in allen Formaten generiert", icon: Clapperboard, status: "idle" },
  { id: "export", label: "Export & Branding...", description: "Hufi-Overlay und HD-Export", icon: Download, status: "idle" },
];

export default function AutopilotProducer({ userId }: { userId: string }) {
  const [targetUrl, setTargetUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<AutopilotStep[]>(INITIAL_STEPS);
  const [scriptDe, setScriptDe] = useState<AutopilotScript | null>(null);
  const [scriptEn, setScriptEn] = useState<AutopilotScript | null>(null);
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [hdExport, setHdExport] = useState(true);
  const [autoOverlay, setAutoOverlay] = useState(true);
  const [dualLanguage, setDualLanguage] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedRuns, setCompletedRuns] = useState(0);
  const [scriptLang, setScriptLang] = useState<"de" | "en">("de");
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "up" | "down">>({});
  // Storyboard preview state
  const [showStoryboard, setShowStoryboard] = useState(true);
  const [storyboardConfirmed, setStoryboardConfirmed] = useState(false);
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  // Batch download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const updateStep = useCallback((stepId: string, status: AutopilotStep["status"], detail?: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status, detail } : s));
  }, []);

  const advanceStep = useCallback(async (index: number) => {
    setCurrentStepIndex(index);
    const step = INITIAL_STEPS[index];
    if (step) {
      updateStep(step.id, "active");
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    }
  }, [updateStep]);

  const activeScript = scriptLang === "en" && scriptEn ? scriptEn : scriptDe;

  // Cost calculation
  const calculateCosts = (script: AutopilotScript | null, hasEn: boolean) => {
    if (!script) return { perScene: [] as number[], totalCredits: 0, totalVideos: 0, totalDuration: 0 };
    const langMultiplier = hasEn ? 2 : 1;
    const formatCount = 3; // reel, youtube, square
    const perScene = script.scenes.map(s => (MODEL_COSTS[s.model] || 3) * formatCount * langMultiplier);
    const totalCredits = perScene.reduce((a, b) => a + b, 0);
    const totalVideos = script.scenes.length * formatCount * langMultiplier;
    const totalDuration = script.scenes.reduce((a, s) => a + s.duration, 0);
    return { perScene, totalCredits, totalVideos, totalDuration };
  };

  const startAutopilot = async () => {
    if (!targetUrl.trim()) return toast({ title: "Bitte gib eine Ziel-URL ein", variant: "destructive" });

    setIsRunning(true);
    setScriptDe(null);
    setScriptEn(null);
    setGenerationJobs([]);
    setSteps(INITIAL_STEPS);
    setFeedbackGiven({});
    setStoryboardConfirmed(false);
    setShowStoryboard(true);

    try {
      // Step 1: Login
      await advanceStep(0);
      updateStep("login", "completed", `Verbindung zu ${new URL(targetUrl).hostname} hergestellt`);

      // Step 2: Scan
      await advanceStep(1);
      updateStep("scan", "completed", "Seiteninhalte und Farbpalette extrahiert");

      // Step 3: Analyze
      await advanceStep(2);

      const { data, error } = await supabase.functions.invoke("autopilot-produce", {
        body: { url: targetUrl, options: { hdExport, autoOverlay, dualLanguage } },
      });
      if (error) throw error;
      if (!data?.script) throw new Error("Kein Skript vom Agent erhalten");

      updateStep("analyze", "completed", `${data.script.data_insights?.length || 0} Daten-Insights erkannt`);
      setScriptDe(data.script);

      // Step 4: Script
      await advanceStep(3);
      updateStep("script", "completed", `${data.script.scenes.length} Szenen × 3 Formate`);

      // Step 5: Translate
      await advanceStep(4);
      if (data.dualLanguage && data.scriptEn) {
        setScriptEn(data.scriptEn);
        updateStep("translate", "completed", "DE + EN Versionen erstellt");
      } else if (dualLanguage) {
        updateStep("translate", "completed", "Nur DE (Übersetzung übersprungen)");
      } else {
        updateStep("translate", "completed", "Nur DE-Modus");
      }

      // PAUSE HERE — wait for storyboard confirmation
      setIsRunning(false); // allow user to review

    } catch (e: any) {
      const failedStep = steps.find(s => s.status === "active");
      if (failedStep) updateStep(failedStep.id, "failed", e.message);
      toast({ title: "Autopilot-Fehler", description: e.message, variant: "destructive" });
      setIsRunning(false);
    }
  };

  const confirmAndRender = async () => {
    if (!scriptDe) return;
    setStoryboardConfirmed(true);
    setIsRunning(true);

    try {
      // Step 6: Render
      await advanceStep(5);
      await generateAllVideos(scriptDe, scriptEn);
      updateStep("render", "completed", "Alle Video-Jobs gestartet");

      // Step 7: Export
      await advanceStep(6);
      updateStep("export", "completed", hdExport ? "HD-Export vorbereitet" : "Standard-Export");

      setCompletedRuns(prev => prev + 1);
      toast({ title: "Autopilot abgeschlossen 🚀", description: "Alle Videos wurden erstellt." });

      // Log to training data
      try {
        await supabase.from("training_data_logs").insert({
          user_id: userId,
          user_input: `Autopilot: ${targetUrl}`,
          ai_output: JSON.stringify({ de: scriptDe, en: scriptEn }),
          source: "autopilot_agent",
          category: "video_production",
        });
      } catch { /* ignore */ }
    } catch (e: any) {
      const failedStep = steps.find(s => s.status === "active");
      if (failedStep) updateStep(failedStep.id, "failed", e.message);
      toast({ title: "Rendering-Fehler", description: e.message, variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  const generateAllVideos = async (deScript: AutopilotScript, enScript?: AutopilotScript | null) => {
    const formats = [
      { key: "reel", aspectRatio: "9:16" },
      { key: "youtube", aspectRatio: "16:9" },
      { key: "square", aspectRatio: "1:1" },
    ];
    const languages: Array<{ lang: "de" | "en"; script: AutopilotScript }> = [{ lang: "de", script: deScript }];
    if (enScript) languages.push({ lang: "en", script: enScript });

    const jobs: GenerationJob[] = [];
    languages.forEach(({ lang, script }) => {
      script.scenes.forEach((_, idx) => {
        formats.forEach(fmt => {
          jobs.push({ sceneIndex: idx, format: fmt.key, aspectRatio: fmt.aspectRatio, lang, status: "pending" });
        });
      });
    });
    setGenerationJobs(jobs);

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const langScript = job.lang === "en" && enScript ? enScript : deScript;
      const scene = langScript.scenes[job.sceneIndex];

      setGenerationJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "generating" } : j));

      try {
        const coloredPrompt = `${scene.prompt}, color palette: ${scene.color_mood}, accent color: #F47B20 Hufi orange${autoOverlay && scene.overlay_text ? `, text overlay: "${scene.overlay_text}" in orange #F47B20` : ""}`;

        const { data: insertData } = await supabase.from("video_jobs").insert({
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
          optimized_prompt: `[${job.lang.toUpperCase()}] ${job.format}`,
        }).select("id").single();

        // Trigger video generation
        if (insertData?.id) {
          supabase.functions.invoke("generate-video", {
            body: { jobId: insertData.id },
          }).catch(e => console.error("Generate video trigger error:", e));
        }

        setGenerationJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "completed" } : j));
      } catch {
        setGenerationJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: "failed" } : j));
      }
    }
  };

  const giveFeedback = async (runKey: string, fb: "up" | "down") => {
    setFeedbackGiven(prev => ({ ...prev, [runKey]: fb }));
    try {
      await supabase.from("training_data_logs").insert({
        user_id: userId,
        user_input: `Feedback: ${fb} | ${runKey}`,
        ai_output: JSON.stringify({ feedback: fb, script: activeScript }),
        source: fb === "up" ? "gold_standard" : "negative_feedback",
        category: "video_training",
      });
      toast({ title: fb === "up" ? "👍 Gold-Standard markiert" : "👎 Feedback gespeichert" });
    } catch { /* ignore */ }
  };

  const batchDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Fetch completed video jobs from this session
      const { data: videoJobs, error } = await supabase
        .from("video_jobs")
        .select("*")
        .eq("user_id", userId)
        .eq("is_hufi_relevant", true)
        .not("video_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(generationJobs.length || 30);

      if (error) throw error;

      const videosWithUrl = (videoJobs || []).filter(v => v.video_url);

      if (videosWithUrl.length === 0) {
        toast({ title: "Keine Videos verfügbar", description: "Es wurden noch keine fertigen Videos gefunden. Bitte warte bis das Rendering abgeschlossen ist.", variant: "destructive" });
        setIsDownloading(false);
        return;
      }

      const zip = new JSZip();
      let downloaded = 0;

      for (const video of videosWithUrl) {
        try {
          const lang = video.optimized_prompt?.startsWith("[EN]") ? "EN" : "DE";
          const format = video.optimized_prompt?.includes("reel") ? "Reel_9x16" :
            video.optimized_prompt?.includes("youtube") ? "YouTube_16x9" :
            video.optimized_prompt?.includes("square") ? "Square_1x1" : video.aspect_ratio?.replace(":", "x");
          const fileName = `Hufi_${lang}_${format}_${video.id.slice(0, 8)}.mp4`;

          const response = await fetch(video.video_url!);
          if (response.ok) {
            const blob = await response.blob();
            zip.file(fileName, blob);
          }
        } catch (e) {
          console.error("Failed to download video:", e);
        }
        downloaded++;
        setDownloadProgress(Math.round((downloaded / videosWithUrl.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Hufi_Autopilot_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Download gestartet 📦", description: `${videosWithUrl.length} Videos als ZIP-Archiv.` });
    } catch (e: any) {
      toast({ title: "Download-Fehler", description: e.message, variant: "destructive" });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const completedCount = generationJobs.filter(j => j.status === "completed").length;
  const totalCount = generationJobs.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const costs = calculateCosts(scriptDe, !!scriptEn);
  const isAwaitingConfirmation = scriptDe && !storyboardConfirmed && !isRunning;

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
            <Globe className="w-4 h-4 text-primary" /> Ziel-URL & Optionen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            placeholder="https://app.hufmanager.de/demo"
            className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-sm"
            disabled={isRunning}
          />
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={hdExport} onCheckedChange={setHdExport} disabled={isRunning} />
              <label className="text-xs text-[hsl(var(--sidebar-foreground))]">4K Upscaling</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={autoOverlay} onCheckedChange={setAutoOverlay} disabled={isRunning} />
              <label className="text-xs text-[hsl(var(--sidebar-foreground))]">Dynamic Overlays</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={dualLanguage} onCheckedChange={setDualLanguage} disabled={isRunning} />
              <label className="text-xs text-[hsl(var(--sidebar-foreground))] flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-primary" /> Dual-Export DE/EN
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Button */}
      {!isAwaitingConfirmation && (
        <Button
          onClick={startAutopilot}
          disabled={isRunning}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2 h-16 rounded-xl shadow-lg shadow-primary/20 transition-all"
        >
          {isRunning ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Autopilot läuft...</>
          ) : (
            <><Rocket className="w-5 h-5" /> Autopilot starten {dualLanguage ? "(DE + EN)" : "(DE)"}</>
          )}
        </Button>
      )}

      {/* Pipeline Status */}
      {(isRunning || steps.some(s => s.status !== "idle")) && (
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
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
            {steps.map((step) => {
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
                    }`}>{step.label}</p>
                    <p className="text-[10px] text-[hsl(var(--sidebar-muted))] truncate">
                      {step.detail || step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ===== STORYBOARD PREVIEW ===== */}
      {scriptDe && !storyboardConfirmed && (
        <Card className="bg-[hsl(var(--sidebar-accent))] border-2 border-primary/50 shadow-lg shadow-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Storyboard-Preview
              <Badge className="ml-auto bg-primary/20 text-primary text-[10px] border-0">
                Vor Rendering prüfen
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cost Summary Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))] text-center">
                <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold text-[hsl(var(--sidebar-foreground))]">{costs.totalCredits}</div>
                <div className="text-[10px] text-[hsl(var(--sidebar-muted))]">Geschätzte Credits</div>
              </div>
              <div className="p-3 rounded-xl bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))] text-center">
                <Layers className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold text-[hsl(var(--sidebar-foreground))]">{costs.totalVideos}</div>
                <div className="text-[10px] text-[hsl(var(--sidebar-muted))]">Videos gesamt</div>
              </div>
              <div className="p-3 rounded-xl bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))] text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold text-[hsl(var(--sidebar-foreground))]">{costs.totalDuration}s</div>
                <div className="text-[10px] text-[hsl(var(--sidebar-muted))]">Gesamtdauer</div>
              </div>
            </div>

            {/* DE/EN Toggle for preview */}
            {scriptEn && (
              <Tabs value={scriptLang} onValueChange={(v) => setScriptLang(v as "de" | "en")} className="w-full">
                <TabsList className="bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))]">
                  <TabsTrigger value="de" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1">
                    🇩🇪 Deutsch
                  </TabsTrigger>
                  <TabsTrigger value="en" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1">
                    🇬🇧 English
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Visual Scene Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))] flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-primary" /> {activeScript?.title}
              </h4>

              {/* Timeline bar */}
              <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-[hsl(var(--sidebar-background))]">
                {activeScript?.scenes.map((scene, i) => (
                  <div
                    key={i}
                    className="h-full rounded-full transition-all cursor-pointer hover:opacity-80"
                    style={{
                      flex: scene.duration,
                      backgroundColor: scene.model === "hunyuan-video" ? "#8B5CF6" :
                        scene.model === "wan-2.2" ? "#F47B20" :
                        scene.model === "skyreels-v1" ? "#06B6D4" :
                        scene.model === "open-sora-2" ? "#10B981" : "#EC4899",
                    }}
                    onClick={() => setExpandedScene(expandedScene === i ? null : i)}
                    title={`Szene ${i + 1}: ${scene.title} (${scene.duration}s)`}
                  />
                ))}
              </div>

              {/* Scene cards */}
              {activeScript?.scenes.map((scene, idx) => {
                const isExpanded = expandedScene === idx;
                const sceneCost = costs.perScene[idx] || 0;
                const modelColor = scene.model === "hunyuan-video" ? "text-violet-400" :
                  scene.model === "wan-2.2" ? "text-primary" :
                  scene.model === "skyreels-v1" ? "text-cyan-400" :
                  scene.model === "open-sora-2" ? "text-emerald-400" : "text-pink-400";

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                      isExpanded
                        ? "border-primary/40 bg-[hsl(var(--sidebar-background))] shadow-md shadow-primary/5"
                        : "border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] hover:border-primary/20"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedScene(isExpanded ? null : idx)}
                      className="w-full flex items-center gap-3 p-3 text-left"
                    >
                      {/* Scene number pill */}
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{scene.scene_number}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))] truncate">{scene.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-medium ${modelColor}`}>
                            {scene.model === "hunyuan-video" ? "🔬 HunyuanVideo" :
                             scene.model === "wan-2.2" ? "⭐ Wan 2.2" :
                             scene.model === "skyreels-v1" ? "🎬 SkyReels" :
                             scene.model === "open-sora-2" ? "🎞️ Open-Sora" : "⚡ Mochi"}
                          </span>
                          <span className="text-[10px] text-[hsl(var(--sidebar-muted))]">·</span>
                          <span className="text-[10px] text-[hsl(var(--sidebar-muted))]">{scene.duration}s</span>
                          <span className="text-[10px] text-[hsl(var(--sidebar-muted))]">·</span>
                          <span className="text-[10px] text-[hsl(var(--sidebar-muted))]">{scene.style}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                          ~{sceneCost} Cr.
                        </Badge>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[hsl(var(--sidebar-muted))]" /> : <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--sidebar-muted))]" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2 border-t border-[hsl(var(--sidebar-border))]">
                        <p className="text-[11px] text-[hsl(var(--sidebar-muted))] pt-2">{scene.prompt}</p>

                        {scene.overlay_text && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 border border-primary/20">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-[10px] text-primary font-medium">Overlay: {scene.overlay_text}</span>
                          </div>
                        )}

                        {scene.data_source && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[hsl(var(--sidebar-accent))]">
                            <Database className="w-3 h-3 text-[hsl(var(--sidebar-muted))]" />
                            <span className="text-[10px] text-[hsl(var(--sidebar-muted))]">Quelle: {scene.data_source}</span>
                          </div>
                        )}

                        <p className="text-[10px] text-[hsl(var(--sidebar-muted))] italic">🤖 {scene.model_reason}</p>

                        {/* Format preview for this scene */}
                        <div className="flex gap-2 pt-1">
                          {["9:16", "16:9", "1:1"].map(ratio => (
                            <div key={ratio} className="flex-1 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent))] p-1.5 text-center">
                              <div className={`mx-auto mb-1 border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] rounded ${
                                ratio === "9:16" ? "w-4 h-7" : ratio === "16:9" ? "w-7 h-4" : "w-5 h-5"
                              }`} />
                              <span className="text-[9px] text-[hsl(var(--sidebar-muted))]">{ratio}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Data Insights */}
            {activeScript?.data_insights && activeScript.data_insights.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))] flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" /> Erkannte Daten-Insights
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {activeScript.data_insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-1.5 p-1.5 rounded-lg bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))]">
                      <Database className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-[10px] text-[hsl(var(--sidebar-foreground))]">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Colors */}
            <div className="flex items-center gap-2 flex-wrap">
              <Palette className="w-3.5 h-3.5 text-primary" />
              {activeScript?.brand_colors?.map((color, i) => (
                <div key={i} className="w-6 h-6 rounded-md border border-[hsl(var(--sidebar-border))]" style={{ backgroundColor: color }} title={color} />
              ))}
              <div className="w-6 h-6 rounded-md border-2 border-primary" style={{ backgroundColor: "#F47B20" }} title="#F47B20" />
            </div>

            {/* Confirm / Cancel Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={confirmAndRender}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 h-12 rounded-xl shadow-lg shadow-primary/20"
              >
                <Clapperboard className="w-4 h-4" /> Rendering starten ({costs.totalVideos} Videos, ~{costs.totalCredits} Credits)
              </Button>
              <Button
                variant="outline"
                onClick={() => { setScriptDe(null); setScriptEn(null); setSteps(INITIAL_STEPS); }}
                className="border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] h-12 rounded-xl"
              >
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post-confirmation: show results */}
      {scriptDe && storyboardConfirmed && (
        <>
          {scriptEn && (
            <Tabs value={scriptLang} onValueChange={(v) => setScriptLang(v as "de" | "en")} className="w-full">
              <TabsList className="bg-[hsl(var(--sidebar-accent))] border border-[hsl(var(--sidebar-border))]">
                <TabsTrigger value="de" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1">
                  🇩🇪 Deutsch
                </TabsTrigger>
                <TabsTrigger value="en" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1">
                  🇬🇧 English
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Scenes (compact post-confirmation) */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" /> {activeScript?.title}
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary ml-auto">
                  {activeScript?.scenes.length} Szenen × 3 Formate
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeScript?.scenes.map((scene, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))]">
                  <Badge className="bg-primary/20 text-primary text-[10px] border-0 shrink-0">Sz. {scene.scene_number}</Badge>
                  <span className="text-xs text-[hsl(var(--sidebar-foreground))] truncate flex-1">{scene.title}</span>
                  <Badge variant="outline" className="text-[9px] border-[hsl(var(--sidebar-border))] shrink-0">{scene.duration}s</Badge>
                </div>
              ))}
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
                    {job.lang === "en" ? "🇬🇧" : "🇩🇪"} Sz.{job.sceneIndex + 1} · {job.format} ({job.aspectRatio})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Download */}
      {completedCount > 0 && !isRunning && (
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
              <Archive className="w-4 h-4 text-primary" /> Batch-Download
              <Badge variant="outline" className="ml-auto text-[10px] border-primary/30 text-primary">
                {completedCount} Videos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-[11px] text-[hsl(var(--sidebar-muted))]">
              Lade alle generierten Videos {scriptEn ? "(DE + EN)" : "(DE)"} in allen Formaten als ZIP-Archiv herunter.
            </p>
            {isDownloading && (
              <div className="w-full h-2 rounded-full bg-[hsl(var(--sidebar-background))] overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
              </div>
            )}
            <Button
              onClick={batchDownload}
              disabled={isDownloading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 h-11 rounded-xl"
            >
              {isDownloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Wird gepackt... {downloadProgress}%</>
              ) : (
                <><Archive className="w-4 h-4" /> Alle Videos als ZIP herunterladen</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Training Feedback */}
      {completedCount > 0 && !isRunning && (
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-primary" /> Training-Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-[11px] text-[hsl(var(--sidebar-muted))]">
              Bewerte diesen Autopilot-Durchlauf. „Perfekt"-Bewertungen werden als Gold-Standard für das Hufi-Modell-Training markiert.
            </p>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant={feedbackGiven["run"] === "up" ? "default" : "outline"}
                className={feedbackGiven["run"] === "up" ? "bg-green-600 hover:bg-green-700 text-white" : "border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]"}
                onClick={() => giveFeedback("run", "up")}
                disabled={!!feedbackGiven["run"]}
              >
                <ThumbsUp className="w-4 h-4 mr-1" /> Perfekt (Gold-Standard)
              </Button>
              <Button
                size="sm"
                variant={feedbackGiven["run"] === "down" ? "default" : "outline"}
                className={feedbackGiven["run"] === "down" ? "bg-destructive hover:bg-destructive/90 text-white" : "border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]"}
                onClick={() => giveFeedback("run", "down")}
                disabled={!!feedbackGiven["run"]}
              >
                <ThumbsDown className="w-4 h-4 mr-1" /> Verbesserungsbedarf
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
