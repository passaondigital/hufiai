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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Video, Upload, Sparkles, Download, ThumbsUp, ThumbsDown,
  ChevronDown, Image, Type, Mic, Layers, Loader2, Play, Settings2, Wand2, Trash2,
  Palette, SlidersHorizontal, FileOutput, Stamp, Sun, Droplets, Contrast, AudioLines, CheckSquare, Square,
  Film, Globe, Rocket, BarChart3, Bookmark, Share2, Calendar, Edit2
} from "lucide-react";
import VideoTimeline from "@/components/video/VideoTimeline";
import AgentWorkflow from "@/components/video/AgentWorkflow";
import AutopilotProducer from "@/components/video/AutopilotProducer";
import SocialAnalytics from "@/components/video/SocialAnalytics";
import ContentTemplates from "@/components/video/ContentTemplates";
import MultiFormatExport from "@/components/video/MultiFormatExport";
import ContentCalendar from "@/components/video/ContentCalendar";
import MediaEditor from "@/components/video/MediaEditor";
import AssetLibraryEnhanced from "@/components/video/AssetLibraryEnhanced";
import ImageGenerator from "@/components/video/ImageGenerator";
import GraphicsDesign from "@/components/video/GraphicsDesign";
import StockMedia from "@/components/video/StockMedia";

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

const STYLES = [
  { id: "realistic", label: "Realismus", icon: "📸", desc: "Photorealistisch" },
  { id: "comic", label: "Comic", icon: "🎨", desc: "Cel-Shaded" },
  { id: "3d", label: "3D", icon: "🧊", desc: "Pixar Style" },
  { id: "vintage", label: "Vintage", icon: "📼", desc: "Retro Film" },
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
  preset: string | null;
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
  const [style, setStyle] = useState("realistic");
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [brandingOverlay, setBrandingOverlay] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedJobForProcessing, setSelectedJobForProcessing] = useState<string | null>(null);
  const [lipsyncAudioFile, setLipsyncAudioFile] = useState<File | null>(null);
  const [isLipsyncing, setIsLipsyncing] = useState(false);
  const [lipsyncJobId, setLipsyncJobId] = useState<string | null>(null);
  const [batchSelectedJobs, setBatchSelectedJobs] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [editorMediaUrl, setEditorMediaUrl] = useState<string | null>(null);
  const [editorMediaType, setEditorMediaType] = useState<"video" | "image">("video");

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
      .select("id, prompt, model, status, video_url, thumbnail_url, feedback, format, created_at, aspect_ratio, preset")
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

  const applyTemplate = (templatePrompt: string, templateAspect: string, templateDuration: number, templateStyle: string) => {
    setPrompt(templatePrompt);
    setAspectRatio(templateAspect);
    setDuration(templateDuration);
    setStyle(templateStyle);
    setActiveTab("create");
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

  const uploadInputFile = async (): Promise<string | null> => {
    if (!inputFile || !user) return null;
    const ext = inputFile.name.split('.').pop();
    const path = `${user.id}/video-input-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("generated-images").upload(path, inputFile);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const startGeneration = async () => {
    if (!prompt.trim()) return toast({ title: "Bitte gib einen Prompt ein.", variant: "destructive" });
    if (!user) return;
    setIsGenerating(true);
    try {
      let inputFileUrl: string | null = null;
      if (inputType !== "text" && inputFile) {
        inputFileUrl = await uploadInputFile();
      }
      const { data: insertData, error: insertError } = await supabase.from("video_jobs").insert({
        user_id: user.id, prompt, negative_prompt: negativePrompt || null, model, input_type: inputType,
        input_file_url: inputFileUrl, aspect_ratio: aspectRatio, duration, motion_intensity: motionIntensity,
        seed: seed ? parseInt(seed) : null, coherence, stylization, hd_upscaling: hdUpscaling, format, preset: style, status: "queued",
      }).select("id").single();
      if (insertError) throw insertError;
      supabase.functions.invoke("generate-video", { body: { jobId: insertData.id } }).catch(e => console.error("Generate video trigger error:", e));
      toast({ title: "Video-Job gestartet 🎬", description: "Dein Video wird jetzt generiert..." });
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

  const downloadWithFormat = (videoUrl: string, targetFormat: string) => {
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `hufi-video.${targetFormat}`;
    a.click();
  };

  const processVideo = async (action: string, settings?: Record<string, unknown>) => {
    const jobId = selectedJobForProcessing || jobs.find(j => j.status === "completed" && j.video_url)?.id;
    if (!jobId) return toast({ title: "Kein Video zum Verarbeiten vorhanden", variant: "destructive" });
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("process-video", { body: { jobId, action, settings } });
      if (error) throw error;
      toast({ title: "Verarbeitung gestartet ✨" });
      fetchJobs();
    } catch (e: any) {
      toast({ title: "Verarbeitung fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadLipsyncAudio = async (): Promise<string | null> => {
    if (!lipsyncAudioFile || !user) return null;
    const ext = lipsyncAudioFile.name.split('.').pop();
    const path = `${user.id}/lipsync-audio-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("generated-images").upload(path, lipsyncAudioFile);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const startLipsync = async () => {
    const jobId = lipsyncJobId || jobs.find(j => j.status === "completed" && j.video_url)?.id;
    if (!jobId) return toast({ title: "Kein Video ausgewählt", variant: "destructive" });
    if (!lipsyncAudioFile) return toast({ title: "Bitte eine Audio-Datei hochladen", variant: "destructive" });
    setIsLipsyncing(true);
    try {
      const audioUrl = await uploadLipsyncAudio();
      if (!audioUrl) throw new Error("Audio upload failed");
      const { error } = await supabase.functions.invoke("lipsync-video", { body: { jobId, audioUrl } });
      if (error) throw error;
      toast({ title: "Lipsync gestartet 🎤" });
      setLipsyncAudioFile(null);
      fetchJobs();
    } catch (e: any) {
      toast({ title: "Lipsync fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setIsLipsyncing(false);
    }
  };

  const toggleBatchJob = (jobId: string) => {
    setBatchSelectedJobs(prev => prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]);
  };

  const startBatchProcessing = async (action: string, settings?: Record<string, unknown>) => {
    if (batchSelectedJobs.length === 0) return toast({ title: "Keine Videos ausgewählt", variant: "destructive" });
    setIsBatchProcessing(true);
    let successCount = 0, failCount = 0;
    for (const jobId of batchSelectedJobs) {
      try {
        const { error } = await supabase.functions.invoke("process-video", { body: { jobId, action, settings } });
        if (error) throw error;
        successCount++;
      } catch { failCount++; }
    }
    toast({ title: `Batch abgeschlossen`, description: `${successCount} erfolgreich, ${failCount} fehlgeschlagen` });
    setBatchSelectedJobs([]);
    setIsBatchProcessing(false);
    fetchJobs();
  };

  const cssFilter = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`;

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] min-h-0">
        {/* Fixed Header */}
        <div className="shrink-0 px-4 pt-4 pb-2 border-b border-[hsl(var(--sidebar-border))]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Social Intelligence Hub</h1>
                <p className="text-[11px] text-[hsl(var(--sidebar-muted))]">Video Engine · Analytics · Content · Export</p>
              </div>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary text-xs">BETA</Badge>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-[hsl(var(--sidebar-accent))] border border-[hsl(var(--sidebar-border))] flex flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="create" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Erstellen
                </TabsTrigger>
                <TabsTrigger value="templates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" /> Vorlagen
                </TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <Film className="w-3.5 h-3.5" /> Timeline
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" /> Analytics
                </TabsTrigger>
                <TabsTrigger value="agent" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Agent
                </TabsTrigger>
                <TabsTrigger value="autopilot" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <Rocket className="w-3.5 h-3.5" /> Autopilot
                </TabsTrigger>
                <TabsTrigger value="lipsync" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <AudioLines className="w-3.5 h-3.5" /> Lipsync
                </TabsTrigger>
                <TabsTrigger value="postprocess" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Post
                </TabsTrigger>
                <TabsTrigger value="export" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Export
                </TabsTrigger>
                <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Kalender
                </TabsTrigger>
                <TabsTrigger value="assets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Assets
                </TabsTrigger>
                <TabsTrigger value="editor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> Editor
                </TabsTrigger>
              </TabsList>

              {/* CREATE TAB */}
              <TabsContent value="create">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                : "border-[hsl(var(--sidebar-border))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}>
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

                    {/* Style Engine */}
                    <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                          <Palette className="w-4 h-4 text-primary" /> Stil-Auswahl
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {STYLES.map(s => (
                            <button key={s.id} onClick={() => setStyle(s.id)}
                              className={`p-3 rounded-lg border text-center transition-all ${style === s.id
                                ? "border-primary bg-primary/10 ring-1 ring-primary"
                                : "border-[hsl(var(--sidebar-border))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}>
                              <div className="text-2xl mb-1">{s.icon}</div>
                              <div className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))]">{s.label}</div>
                              <div className="text-[10px] text-[hsl(var(--sidebar-muted))]">{s.desc}</div>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Input Type + Prompt */}
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
                                : "border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}>
                              <t.icon className="w-4 h-4" />{t.label}
                            </button>
                          ))}
                        </div>

                        {inputType !== "text" && (
                          <label className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-[hsl(var(--sidebar-border))] hover:border-primary/40 cursor-pointer transition-colors bg-[hsl(var(--sidebar-background))]">
                            <Upload className="w-5 h-5 text-[hsl(var(--sidebar-muted))]" />
                            <span className="text-sm text-[hsl(var(--sidebar-muted))]">
                              {inputFile ? inputFile.name : inputType === "image" ? "Bild hochladen" : inputType === "graphics" ? "SVG hochladen" : "Audio hochladen"}
                            </span>
                            <input type="file" className="hidden"
                              accept={inputType === "image" ? "image/*" : inputType === "graphics" ? ".svg,image/svg+xml" : "audio/*"}
                              onChange={e => setInputFile(e.target.files?.[0] || null)} />
                          </label>
                        )}

                        <div className="relative">
                          <Textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                            placeholder="Beschreibe dein Video... z.B. 'Ein weißes Pferd galoppiert über eine Frühlingswiese bei Sonnenaufgang, cinematisch, 4K'"
                            className="min-h-[120px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] placeholder:text-[hsl(var(--sidebar-muted))] resize-none text-sm" />
                          <Button size="sm" onClick={optimizePrompt} disabled={isOptimizing}
                            className="absolute bottom-3 right-3 bg-primary hover:bg-primary/90 text-xs gap-1.5">
                            {isOptimizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                            KI-Optimierung
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 block">Seitenverhältnis</label>
                            <div className="grid grid-cols-4 gap-2">
                              {ASPECT_RATIOS.map(ar => (
                                <button key={ar.id} onClick={() => setAspectRatio(ar.id)}
                                  className={`p-2 rounded-lg border text-center text-xs transition-all ${aspectRatio === ar.id
                                    ? "border-primary bg-primary/10 text-primary font-bold"
                                    : "border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))] bg-[hsl(var(--sidebar-background))]"}`}>
                                  <div className="font-semibold">{ar.id}</div>
                                  <div className="text-[10px] opacity-70">{ar.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 block">Videolänge: {duration}s</label>
                            <Slider value={[duration]} onValueChange={v => setDuration(v[0])} min={1} max={30} step={1} className="mt-3" />
                            <div className="flex justify-between text-[10px] text-[hsl(var(--sidebar-muted))] mt-1"><span>1s</span><span>30s</span></div>
                          </div>
                        </div>

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
                            <Textarea value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)}
                              placeholder="Negative Prompts: deformierte Hufe, verschwommen, Text..."
                              className="min-h-[60px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-sm" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 block">Motion: {motionIntensity}%</label>
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
                                <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-1 block">Seed</label>
                                <Input type="number" value={seed} onChange={e => setSeed(e.target.value)} placeholder="Random"
                                  className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-sm" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-3">
                                <Switch checked={hdUpscaling} onCheckedChange={setHdUpscaling} />
                                <label className="text-xs text-[hsl(var(--sidebar-foreground))]">HD Upscaling</label>
                              </div>
                              <div className="flex items-center gap-3">
                                <Switch checked={brandingOverlay} onCheckedChange={setBrandingOverlay} />
                                <label className="text-xs text-[hsl(var(--sidebar-foreground))] flex items-center gap-1">
                                  <Stamp className="w-3.5 h-3.5 text-primary" /> HufiAi Branding
                                </label>
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

                    <Button onClick={startGeneration} disabled={isGenerating || !prompt.trim()} size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2 h-14 rounded-xl shadow-lg shadow-primary/20">
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                      Video generieren
                    </Button>
                  </div>

                  {/* Right: Gallery */}
                  <div className="space-y-4">
                    <GalleryPanel jobs={jobs} giveFeedback={giveFeedback} deleteJob={deleteJob}
                      downloadWithFormat={downloadWithFormat} cssFilter={cssFilter} brandingOverlay={brandingOverlay} />
                  </div>
                </div>
              </TabsContent>

              {/* TEMPLATES TAB */}
              <TabsContent value="templates">
                <ContentTemplates onApplyTemplate={applyTemplate} />
              </TabsContent>

              {/* TIMELINE TAB */}
              <TabsContent value="timeline">
                <VideoTimeline jobs={jobs} />
              </TabsContent>

              {/* ANALYTICS TAB */}
              <TabsContent value="analytics">
                {user ? <SocialAnalytics userId={user.id} /> : (
                  <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                    <CardContent className="py-12 text-center">
                      <p className="text-sm text-[hsl(var(--sidebar-muted))]">Bitte melde dich an</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* AGENT TAB */}
              <TabsContent value="agent">
                {user ? <AgentWorkflow userId={user.id} /> : (
                  <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                    <CardContent className="py-12 text-center"><p className="text-sm text-[hsl(var(--sidebar-muted))]">Bitte melde dich an</p></CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* AUTOPILOT TAB */}
              <TabsContent value="autopilot">
                {user ? <AutopilotProducer userId={user.id} /> : (
                  <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                    <CardContent className="py-12 text-center"><p className="text-sm text-[hsl(var(--sidebar-muted))]">Bitte melde dich an</p></CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* LIPSYNC TAB */}
              <TabsContent value="lipsync">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                    <CardHeader>
                      <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                        <AudioLines className="w-4 h-4 text-primary" /> Voice-to-Video (Lipsync)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs text-[hsl(var(--sidebar-muted))]">
                        Synchronisiere eine Audiodatei mit einem generierten Video via Fal.ai Sync Lipsync 2.0.
                      </p>
                      <div>
                        <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 block">Video auswählen</label>
                        {jobs.filter(j => j.status === "completed" && j.video_url).length > 0 ? (
                          <Select value={lipsyncJobId || ""} onValueChange={setLipsyncJobId}>
                            <SelectTrigger className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs">
                              <SelectValue placeholder="Video auswählen..." />
                            </SelectTrigger>
                            <SelectContent>
                              {jobs.filter(j => j.status === "completed" && j.video_url).map(j => (
                                <SelectItem key={j.id} value={j.id}>{j.prompt.slice(0, 50)}...</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-xs text-[hsl(var(--sidebar-muted))] italic">Generiere zuerst ein Video.</p>
                        )}
                      </div>
                      <label className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-[hsl(var(--sidebar-border))] hover:border-primary/40 cursor-pointer transition-colors bg-[hsl(var(--sidebar-background))]">
                        <Mic className="w-5 h-5 text-[hsl(var(--sidebar-muted))]" />
                        <span className="text-sm text-[hsl(var(--sidebar-muted))]">{lipsyncAudioFile ? lipsyncAudioFile.name : "Audio hochladen"}</span>
                        <input type="file" className="hidden" accept="audio/*" onChange={e => setLipsyncAudioFile(e.target.files?.[0] || null)} />
                      </label>
                      <Button onClick={startLipsync} disabled={isLipsyncing || !lipsyncAudioFile}
                        className="w-full bg-primary hover:bg-primary/90 gap-1.5">
                        {isLipsyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AudioLines className="w-4 h-4" />}
                        Lipsync starten
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                    <CardHeader>
                      <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))]">Vorschau</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => { const j = jobs.find(j => j.id === lipsyncJobId && j.video_url); return j ? (
                        <video src={j.video_url!} controls className="w-full rounded-lg" />
                      ) : (
                        <div className="text-center py-12 text-[hsl(var(--sidebar-muted))]">
                          <AudioLines className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">Wähle ein Video aus</p>
                        </div>
                      ); })()}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* POST-PROCESSING TAB */}
              <TabsContent value="postprocess">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                    <CardHeader>
                      <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-primary" /> Farbanpassung
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 flex items-center gap-1.5"><Sun className="w-3.5 h-3.5" /> Helligkeit: {brightness}%</label>
                        <Slider value={[brightness]} onValueChange={v => setBrightness(v[0])} min={50} max={200} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5" /> Sättigung: {saturation}%</label>
                        <Slider value={[saturation]} onValueChange={v => setSaturation(v[0])} min={0} max={200} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[hsl(var(--sidebar-muted))] mb-2 flex items-center gap-1.5"><Contrast className="w-3.5 h-3.5" /> Kontrast: {contrast}%</label>
                        <Slider value={[contrast]} onValueChange={v => setContrast(v[0])} min={50} max={200} />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setBrightness(100); setSaturation(100); setContrast(100); }}
                          className="text-xs border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))]">Zurücksetzen</Button>
                        <Button size="sm" onClick={() => processVideo("color-grade", { brightness, saturation, contrast })}
                          disabled={isProcessing || !jobs.some(j => j.status === "completed" && j.video_url)}
                          className="bg-primary hover:bg-primary/90 text-xs gap-1.5">
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                          Anwenden
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                    <CardHeader>
                      <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))]">Vorschau mit Filtern</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {jobs.filter(j => j.status === "completed" && j.video_url).slice(0, 1).map(job => (
                        <div key={job.id} className="rounded-lg overflow-hidden border border-[hsl(var(--sidebar-border))] relative">
                          <video src={job.video_url!} controls className="w-full" style={{ filter: cssFilter }} />
                          {brandingOverlay && (
                            <div className="absolute bottom-3 right-3 bg-black/50 px-2 py-1 rounded text-[10px] font-bold text-primary">HufiAi</div>
                          )}
                        </div>
                      ))}
                      {!jobs.some(j => j.status === "completed" && j.video_url) && (
                        <div className="text-center py-12 text-[hsl(var(--sidebar-muted))]">
                          <Video className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">Generiere zuerst ein Video</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Batch Processing */}
                <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" /> Batch-Verarbeitung
                      {batchSelectedJobs.length > 0 && (
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary ml-auto">{batchSelectedJobs.length} ausgewählt</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {jobs.filter(j => j.status === "completed" && j.video_url).length === 0 ? (
                      <div className="text-center py-8"><Layers className="w-10 h-10 mx-auto mb-2 text-[hsl(var(--sidebar-muted))] opacity-30" /><p className="text-xs text-[hsl(var(--sidebar-muted))]">Keine fertigen Videos</p></div>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto">
                          {jobs.filter(j => j.status === "completed" && j.video_url).map(job => (
                            <button key={job.id} onClick={() => toggleBatchJob(job.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                                batchSelectedJobs.includes(job.id) ? "border-primary bg-primary/10" : "border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] hover:border-primary/40"
                              }`}>
                              {batchSelectedJobs.includes(job.id) ? <CheckSquare className="w-4 h-4 text-primary shrink-0" /> : <Square className="w-4 h-4 text-[hsl(var(--sidebar-muted))] shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[hsl(var(--sidebar-foreground))] truncate">{job.prompt}</p>
                                <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">{job.aspect_ratio}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Button size="sm" onClick={() => startBatchProcessing("upscale")} disabled={isBatchProcessing || batchSelectedJobs.length === 0}
                            className="bg-primary hover:bg-primary/90 text-xs gap-1">{isBatchProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Upscale</Button>
                          <Button size="sm" onClick={() => startBatchProcessing("color-grade", { brightness, saturation, contrast })} disabled={isBatchProcessing || batchSelectedJobs.length === 0}
                            variant="outline" className="text-xs gap-1 border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]"><Palette className="w-3 h-3" /> Farbe</Button>
                          <Button size="sm" onClick={() => setBatchSelectedJobs([])} variant="ghost" className="text-xs text-[hsl(var(--sidebar-muted))]">Aufheben</Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* EXPORT TAB */}
              <TabsContent value="export">
                {user ? <MultiFormatExport jobs={jobs} userId={user.id} /> : (
                  <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                    <CardContent className="py-12 text-center"><p className="text-sm text-[hsl(var(--sidebar-muted))]">Bitte melde dich an</p></CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* CALENDAR TAB */}
              <TabsContent value="calendar">
                {user ? (
                  <ContentCalendar
                    userId={user.id}
                    onCreateVideo={(promptSuggestion, ar) => {
                      setPrompt(promptSuggestion);
                      setAspectRatio(ar);
                      setActiveTab("create");
                    }}
                  />
                ) : (
                  <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                    <CardContent className="py-12 text-center"><p className="text-sm text-[hsl(var(--sidebar-muted))]">Bitte melde dich an</p></CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ASSETS TAB */}
              <TabsContent value="assets">
                {user ? <AssetLibraryEnhanced userId={user.id} /> : (
                  <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                    <CardContent className="py-12 text-center"><p className="text-sm text-[hsl(var(--sidebar-muted))]">Bitte melde dich an</p></CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* EDITOR TAB */}
              <TabsContent value="editor">
                {(() => {
                  const editableJob = jobs.find(j => j.status === "completed" && j.video_url);
                  const mediaUrl = editorMediaUrl || editableJob?.video_url;
                  if (!mediaUrl) {
                    return (
                      <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                        <CardContent className="py-12 text-center">
                          <Edit2 className="w-10 h-10 mx-auto mb-2 text-[hsl(var(--sidebar-muted))] opacity-30" />
                          <p className="text-xs text-[hsl(var(--sidebar-muted))]">Kein Medium zum Bearbeiten vorhanden</p>
                          <p className="text-[10px] text-[hsl(var(--sidebar-muted))] mt-1">Generiere zuerst ein Video oder Bild</p>
                        </CardContent>
                      </Card>
                    );
                  }
                  return <MediaEditor mediaUrl={mediaUrl} mediaType={editorMediaType} />;
                })()}
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="text-center py-4 border-t border-[hsl(var(--sidebar-border))]">
            <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">
              HufiAi Social Intelligence Hub · Powered by Open-Source Models · "Wir sind hier, um einen Unterschied zu machen."
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Gallery Panel Component
function GalleryPanel({ jobs, giveFeedback, deleteJob, downloadWithFormat, cssFilter, brandingOverlay }: {
  jobs: VideoJob[];
  giveFeedback: (id: string, fb: "up" | "down") => void;
  deleteJob: (id: string) => void;
  downloadWithFormat: (url: string, fmt: string) => void;
  cssFilter: string;
  brandingOverlay: boolean;
}) {
  return (
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
            <p className="text-sm">Noch keine Videos</p>
          </div>
        ) : jobs.map(job => (
          <div key={job.id} className="rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] overflow-hidden">
            <div className="aspect-video bg-[hsl(var(--sidebar-accent))] relative flex items-center justify-center">
              {job.status === "completed" && job.video_url ? (
                <div className="relative w-full h-full">
                  <video src={job.video_url} className="w-full h-full object-cover" controls style={{ filter: cssFilter }} />
                  {brandingOverlay && (
                    <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-bold text-primary pointer-events-none">HufiAi</div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  {(job.status === "queued" || job.status === "processing") ? (
                    <><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /><p className="text-[10px] text-[hsl(var(--sidebar-muted))] mt-2">{job.status === "queued" ? "Warteschlange..." : "Generiere..."}</p></>
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
            <div className="p-3 space-y-2">
              <p className="text-xs text-[hsl(var(--sidebar-foreground))] line-clamp-2">{job.prompt}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[hsl(var(--sidebar-muted))]">{new Date(job.created_at).toLocaleString("de-DE")}</span>
                <div className="flex items-center gap-1">
                  {job.status === "completed" && job.video_url && (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => giveFeedback(job.id, "up")}><ThumbsUp className={`w-3 h-3 ${job.feedback === "up" ? "text-primary" : "text-[hsl(var(--sidebar-muted))]"}`} /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => giveFeedback(job.id, "down")}><ThumbsDown className={`w-3 h-3 ${job.feedback === "down" ? "text-destructive" : "text-[hsl(var(--sidebar-muted))]"}`} /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => downloadWithFormat(job.video_url!, job.format)}><Download className="w-3 h-3 text-[hsl(var(--sidebar-muted))]" /></Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteJob(job.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
