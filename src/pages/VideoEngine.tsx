import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import {
  Video, Upload, Sparkles, Download, ThumbsUp, ThumbsDown,
  ChevronDown, Image, Type, Mic, Layers, Loader2, Play, Settings2, Wand2, Trash2
} from "lucide-react";

const MODELS = [
  { id: "wan-2.2", label: "Wan 2.2", desc: "Best Allround", badge: "⭐" },
  { id: "skyreels-v1", label: "SkyReels V1", desc: "Cinematic", badge: "🎬" },
  { id: "hunyuan-video", label: "HunyuanVideo", desc: "Pro Physics", badge: "🔬" },
  { id: "open-sora-2", label: "Open-Sora 2.0", desc: "Long Videos", badge: "🎞️" },
  { id: "mochi-1", label: "Mochi 1", desc: "Fast", badge: "⚡" },
];

const ASPECT_RATIOS = [
  { id: "9:16", label: "9:16", desc: "Reels" },
  { id: "16:9", label: "16:9", desc: "YouTube" },
  { id: "1:1", label: "1:1", desc: "Post" },
  { id: "4:5", label: "4:5", desc: "Portrait" },
];

const PRESETS = [
  { id: "marketing-reel", label: "Marketing Reel", desc: "Kurz & impactful", config: { duration: 5, motion_intensity: 80, stylization: 70, aspect_ratio: "9:16" } },
  { id: "tutorial", label: "Technisches Tutorial", desc: "Lang & klar", config: { duration: 20, motion_intensity: 30, stylization: 20, aspect_ratio: "16:9" } },
  { id: "product", label: "Produktvorstellung", desc: "Logo-Animation", config: { duration: 8, motion_intensity: 60, stylization: 80, aspect_ratio: "1:1" } },
  { id: "detail", label: "Detail-Analyse", desc: "Zoom", config: { duration: 10, motion_intensity: 40, stylization: 30, aspect_ratio: "16:9" } },
];

const INPUT_TYPES = [
  { id: "text", label: "Text-to-Video", icon: Type },
  { id: "image", label: "Image-to-Video", icon: Image },
  { id: "graphics", label: "Graphics-to-Video", icon: Layers },
  { id: "voice", label: "Voice-to-Video", icon: Mic },
];

type VideoJob = {
  id: string;
  prompt: string;
  model: string;
  status: string;
  video_url: string | null;
  thumbnail_url: string | null;
  feedback: string | null;
  format: string;
  created_at: string;
  aspect_ratio: string;
};

export default function VideoEngine() {
  const { user } = useAuth();
  const [model, setModel] = useState("wan-2.2");
  const [inputType, setInputType] = useState("text");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [motionIntensity, setMotionIntensity] = useState(50);
  const [seed, setSeed] = useState<string>("");
  const [coherence, setCoherence] = useState(70);
  const [stylization, setStylization] = useState(50);
  const [hdUpscaling, setHdUpscaling] = useState(false);
  const [format, setFormat] = useState("mp4");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [inputFile, setInputFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchJobs();
    const channel = supabase
      .channel("video-jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_jobs", filter: `user_id=eq.${user.id}` }, () => fetchJobs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("video_jobs")
      .select("id, prompt, model, status, video_url, thumbnail_url, feedback, format, created_at, aspect_ratio")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setJobs(data);
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setDuration(preset.config.duration);
    setMotionIntensity(preset.config.motion_intensity);
    setStylization(preset.config.stylization);
    setAspectRatio(preset.config.aspect_ratio);
    toast({ title: `Preset "${preset.label}" angewendet` });
  };

  const optimizePrompt = async () => {
    if (!prompt.trim()) return toast({ title: "Bitte gib zuerst einen Prompt ein.", variant: "destructive" });
    setIsOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-video-prompt", {
        body: { prompt, model, aspectRatio, duration },
      });
      if (error) throw error;
      if (data?.optimizedPrompt) {
        setPrompt(data.optimizedPrompt);
        toast({ title: "Prompt optimiert ✨" });
      }
    } catch (e: any) {
      toast({ title: "Prompt-Optimierung fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  const startGeneration = async () => {
    if (!prompt.trim()) return toast({ title: "Bitte gib einen Prompt ein.", variant: "destructive" });
    if (!user) return;
    setIsGenerating(true);
    try {
      const { error } = await supabase.from("video_jobs").insert({
        user_id: user.id,
        prompt,
        negative_prompt: negativePrompt || null,
        model,
        input_type: inputType,
        aspect_ratio: aspectRatio,
        duration,
        motion_intensity: motionIntensity,
        seed: seed ? parseInt(seed) : null,
        coherence,
        stylization,
        hd_upscaling: hdUpscaling,
        format,
        status: "queued",
      });
      if (error) throw error;
      toast({ title: "Video-Job erstellt 🎬", description: "Dein Video wird generiert..." });
      setPrompt("");
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const giveFeedback = async (jobId: string, fb: "up" | "down") => {
    await supabase.from("video_jobs").update({ feedback: fb, is_hufi_relevant: true }).eq("id", jobId);
    toast({ title: fb === "up" ? "👍 Positives Feedback gespeichert" : "👎 Negatives Feedback gespeichert" });
    fetchJobs();
  };

  const deleteJob = async (jobId: string) => {
    await supabase.from("video_jobs").delete().eq("id", jobId);
    toast({ title: "Video-Job gelöscht" });
    fetchJobs();
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">HufiAi Video Engine</h1>
                <p className="text-sm text-[hsl(var(--sidebar-muted))]">Professionelle Video-Generierung mit Open-Source Modellen</p>
              </div>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">BETA</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Controls */}
            <div className="lg:col-span-2 space-y-4">
              {/* Model Selector */}
              <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-primary" /> Modell-Auswahl
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {MODELS.map(m => (
                      <button key={m.id} onClick={() => setModel(m.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all text-xs ${model === m.id
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-[hsl(var(--sidebar-border))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <span>{m.badge}</span>
                          <span className="font-semibold text-[hsl(var(--sidebar-foreground))]">{m.label}</span>
                        </div>
                        <span className="text-[hsl(var(--sidebar-muted))]">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Input Type */}
              <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Eingabemethode
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {INPUT_TYPES.map(t => (
                      <button key={t.id} onClick={() => setInputType(t.id)}
                        className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs font-medium transition-all ${inputType === t.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}
                      >
                        <t.icon className="w-4 h-4" />{t.label}
                      </button>
                    ))}
                  </div>

                  {/* File upload for non-text modes */}
                  {inputType !== "text" && (
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-[hsl(var(--sidebar-border))] hover:border-primary/40 cursor-pointer transition-colors bg-[hsl(var(--sidebar-background))]">
                        <Upload className="w-5 h-5 text-[hsl(var(--sidebar-muted))]" />
                        <span className="text-sm text-[hsl(var(--sidebar-muted))]">
                          {inputFile ? inputFile.name : inputType === "image" ? "Bild hochladen" : inputType === "graphics" ? "SVG/Vektor hochladen" : "Audio hochladen"}
                        </span>
                        <input type="file" className="hidden"
                          accept={inputType === "image" ? "image/*" : inputType === "graphics" ? ".svg,image/svg+xml" : "audio/*"}
                          onChange={e => setInputFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  )}

                  {/* Prompt */}
                  <div className="relative">
                    <Textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Beschreibe dein Video... z.B. 'Ein weißes Pferd galoppiert über eine Frühlingswiese bei Sonnenaufgang, cinematisch, 4K'"
                      className="min-h-[120px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] placeholder:text-[hsl(var(--sidebar-muted))] resize-none text-sm"
                    />
                    <Button size="sm" onClick={optimizePrompt} disabled={isOptimizing}
                      className="absolute bottom-3 right-3 bg-primary hover:bg-primary/90 text-xs gap-1.5">
                      {isOptimizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      Prompt Optimieren (KI)
                    </Button>
                  </div>

                  {/* Aspect Ratio + Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 block">Seitenverhältnis</label>
                      <div className="grid grid-cols-4 gap-2">
                        {ASPECT_RATIOS.map(ar => (
                          <button key={ar.id} onClick={() => setAspectRatio(ar.id)}
                            className={`p-2 rounded-lg border text-center text-xs transition-all ${aspectRatio === ar.id
                              ? "border-primary bg-primary/10 text-primary font-bold"
                              : "border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))] bg-[hsl(var(--sidebar-background))]"}`}
                          >
                            <div className="font-semibold">{ar.id}</div>
                            <div className="text-[10px] opacity-70">{ar.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 block">Videolänge: {duration}s</label>
                      <Slider value={[duration]} onValueChange={v => setDuration(v[0])} min={1} max={30} step={1}
                        className="mt-3" />
                      <div className="flex justify-between text-[10px] text-[hsl(var(--sidebar-muted))] mt-1">
                        <span>1s</span><span>30s</span>
                      </div>
                    </div>
                  </div>

                  {/* Presets */}
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 block">Schnell-Presets</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRESETS.map(p => (
                        <button key={p.id} onClick={() => applyPreset(p.id)}
                          className="p-2.5 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] hover:border-primary/40 text-left transition-all text-xs">
                          <div className="font-semibold text-[hsl(var(--sidebar-foreground))]">{p.label}</div>
                          <div className="text-[hsl(var(--sidebar-muted))]">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-primary" /> Erweiterte Einstellungen
                      </CardTitle>
                      <ChevronDown className={`w-4 h-4 text-[hsl(var(--sidebar-muted))] transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* Negative Prompt */}
                      <div>
                        <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-1 block">Negative Prompts</label>
                        <Textarea value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)}
                          placeholder="z.B. deformierte Hufe, unnatürliche Gliedmaßen, verschwommen, Text-Overlay..."
                          className="min-h-[60px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] placeholder:text-[hsl(var(--sidebar-muted))] text-sm" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 block">Motion Intensity: {motionIntensity}%</label>
                          <Slider value={[motionIntensity]} onValueChange={v => setMotionIntensity(v[0])} min={0} max={100} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 block">Coherence: {coherence}%</label>
                          <Slider value={[coherence]} onValueChange={v => setCoherence(v[0])} min={0} max={100} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 block">Stylization: {stylization}%</label>
                          <Slider value={[stylization]} onValueChange={v => setStylization(v[0])} min={0} max={100} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-1 block">Seed (optional)</label>
                          <Input type="number" value={seed} onChange={e => setSeed(e.target.value)} placeholder="Random"
                            className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-sm" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch checked={hdUpscaling} onCheckedChange={setHdUpscaling} />
                          <label className="text-xs text-[hsl(var(--sidebar-foreground))]">HD Upscaling (1080p+)</label>
                        </div>
                        <Select value={format} onValueChange={setFormat}>
                          <SelectTrigger className="w-[120px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mp4">.mp4</SelectItem>
                            <SelectItem value="mov">.mov</SelectItem>
                            <SelectItem value="webm">.webm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Generate Button */}
              <Button onClick={startGeneration} disabled={isGenerating || !prompt.trim()} size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2 h-14 rounded-xl shadow-lg shadow-primary/20">
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                Video generieren
              </Button>
            </div>

            {/* Right: Gallery */}
            <div className="space-y-4">
              <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" /> Video-Galerie
                    {jobs.length > 0 && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary ml-auto">{jobs.length}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {jobs.length === 0 ? (
                    <div className="text-center py-12 text-[hsl(var(--sidebar-muted))]">
                      <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Noch keine Videos generiert</p>
                      <p className="text-xs mt-1">Starte dein erstes Video oben</p>
                    </div>
                  ) : jobs.map(job => (
                    <div key={job.id} className="rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] overflow-hidden">
                      {/* Thumbnail / Preview */}
                      <div className="aspect-video bg-[hsl(var(--sidebar-accent))] relative flex items-center justify-center">
                        {job.status === "completed" && job.video_url ? (
                          <video src={job.video_url} className="w-full h-full object-cover" controls />
                        ) : (
                          <div className="text-center">
                            {job.status === "queued" || job.status === "processing" ? (
                              <>
                                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                                <p className="text-[10px] text-[hsl(var(--sidebar-muted))] mt-2">
                                  {job.status === "queued" ? "In Warteschlange..." : "Generiere..."}
                                </p>
                              </>
                            ) : job.status === "failed" ? (
                              <p className="text-xs text-destructive">Fehlgeschlagen</p>
                            ) : (
                              <p className="text-xs text-[hsl(var(--sidebar-muted))]">Bereit</p>
                            )}
                          </div>
                        )}
                        <Badge className="absolute top-2 left-2 text-[9px] bg-[hsl(var(--sidebar-background))]/80 text-[hsl(var(--sidebar-foreground))]">
                          {MODELS.find(m => m.id === job.model)?.label || job.model}
                        </Badge>
                        <Badge className="absolute top-2 right-2 text-[9px] bg-[hsl(var(--sidebar-background))]/80 text-[hsl(var(--sidebar-foreground))]">
                          {job.aspect_ratio}
                        </Badge>
                      </div>
                      <div className="p-2.5 space-y-2">
                        <p className="text-xs text-[hsl(var(--sidebar-foreground))] line-clamp-2">{job.prompt}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button onClick={() => giveFeedback(job.id, "up")}
                              className={`p-1.5 rounded-md transition-colors ${job.feedback === "up" ? "bg-green-500/20 text-green-400" : "text-[hsl(var(--sidebar-muted))] hover:text-green-400"}`}>
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => giveFeedback(job.id, "down")}
                              className={`p-1.5 rounded-md transition-colors ${job.feedback === "down" ? "bg-red-500/20 text-red-400" : "text-[hsl(var(--sidebar-muted))] hover:text-red-400"}`}>
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            {job.video_url && (
                              <a href={job.video_url} download={`hufi-video.${job.format}`}
                                className="p-1.5 rounded-md text-[hsl(var(--sidebar-muted))] hover:text-primary transition-colors">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button onClick={() => deleteJob(job.id)}
                              className="p-1.5 rounded-md text-[hsl(var(--sidebar-muted))] hover:text-destructive transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-4 border-t border-[hsl(var(--sidebar-border))]">
            <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">
              HufiAi Video Engine · Powered by Open-Source Models · "Wir sind hier, um einen Unterschied zu machen."
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
