import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Video, Loader2, Play, Sparkles, Download, Share2, Subtitles,
  Smartphone, Film, Music, Scissors, FileOutput, RotateCcw
} from "lucide-react";
import { toast } from "sonner";

const AUTO_FORMATS = [
  { id: "reel", label: "Instagram Reel", icon: "📱", ratio: "9:16", maxDuration: 90, desc: "Vertikal, max 90s" },
  { id: "short", label: "YouTube Short", icon: "🎬", ratio: "9:16", maxDuration: 60, desc: "Vertikal, max 60s" },
  { id: "tiktok", label: "TikTok", icon: "🎵", ratio: "9:16", maxDuration: 180, desc: "Vertikal, max 3min" },
  { id: "story", label: "Story", icon: "📸", ratio: "9:16", maxDuration: 15, desc: "15 Sekunden" },
  { id: "youtube", label: "YouTube", icon: "▶️", ratio: "16:9", maxDuration: 600, desc: "Landscape, lang" },
  { id: "post", label: "Feed Post", icon: "🖼️", ratio: "1:1", maxDuration: 60, desc: "Quadrat, max 60s" },
];

const TRANSITION_STYLES = [
  { id: "none", label: "Kein" },
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide" },
  { id: "zoom", label: "Zoom" },
  { id: "dissolve", label: "Dissolve" },
];

const MUSIC_MOODS = [
  { id: "none", label: "Keine Musik", icon: "🔇" },
  { id: "upbeat", label: "Fröhlich", icon: "🎵" },
  { id: "calm", label: "Ruhig", icon: "🎶" },
  { id: "dramatic", label: "Dramatisch", icon: "🎻" },
  { id: "corporate", label: "Business", icon: "💼" },
  { id: "nature", label: "Natur", icon: "🌿" },
];

interface VideoJob {
  id: string;
  prompt: string;
  status: string;
  video_url: string | null;
  aspect_ratio: string;
  created_at: string;
  format: string;
}

export default function VideoCreator() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("reel");
  const [duration, setDuration] = useState(5);
  const [autoSubtitles, setAutoSubtitles] = useState(true);
  const [subtitleText, setSubtitleText] = useState("");
  const [subtitleStyle, setSubtitleStyle] = useState("modern");
  const [transition, setTransition] = useState("fade");
  const [musicMood, setMusicMood] = useState("none");
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobs, setJobs] = useState<VideoJob[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchJobs();
    const channel = supabase
      .channel("video-creator-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_jobs", filter: `user_id=eq.${user.id}` }, () => fetchJobs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("video_jobs")
      .select("id, prompt, status, video_url, aspect_ratio, created_at, format")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setJobs(data);
  };

  const activeFormat = AUTO_FORMATS.find(f => f.id === selectedFormat)!;

  const generateVideo = async () => {
    if (!prompt.trim() || !user) return;
    setIsGenerating(true);
    try {
      const enhancedPrompt = [
        prompt,
        autoSubtitles && subtitleText ? `With subtitles: "${subtitleText}"` : "",
        musicMood !== "none" ? `Background music mood: ${musicMood}` : "",
        transition !== "none" ? `Transition style: ${transition}` : "",
      ].filter(Boolean).join(". ");

      const { data: insertData, error: insertError } = await supabase.from("video_jobs").insert({
        user_id: user.id,
        prompt: enhancedPrompt,
        model: "wan-2.2",
        input_type: "text",
        aspect_ratio: activeFormat.ratio,
        duration: Math.min(duration, activeFormat.maxDuration),
        motion_intensity: 60,
        coherence: 70,
        stylization: 50,
        format: "mp4",
        preset: selectedFormat,
        status: "queued",
      }).select("id").single();

      if (insertError) throw insertError;

      supabase.functions.invoke("generate-video", { body: { jobId: insertData.id } })
        .catch(e => console.error("Video trigger error:", e));

      // Save to generated_content
      await supabase.from("generated_content" as any).insert({
        user_id: user.id,
        type: "video",
        title: prompt.slice(0, 100),
        original_prompt: enhancedPrompt,
        dimensions: activeFormat.ratio.replace(":", "x"),
        format: "mp4",
        social_platform: selectedFormat === "reel" ? "instagram" : selectedFormat === "short" ? "youtube" : selectedFormat === "tiktok" ? "tiktok" : null,
      });

      toast.success("Video-Job gestartet! 🎬");
      setPrompt("");
    } catch (err: any) {
      toast.error(err.message || "Video-Erstellung fehlgeschlagen");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportForPlatform = (job: VideoJob, platform: string) => {
    if (!job.video_url) return;
    const a = document.createElement("a");
    a.href = job.video_url;
    a.download = `hufi-${platform}-${Date.now()}.${job.format}`;
    a.click();
    toast.success(`Export für ${platform} gestartet!`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Format Selection */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" /> Auto-Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AUTO_FORMATS.map(f => (
                  <button key={f.id} onClick={() => {
                    setSelectedFormat(f.id);
                    setDuration(Math.min(duration, f.maxDuration));
                  }}
                    className={`p-3 rounded-lg border text-center transition-all ${selectedFormat === f.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-[hsl(var(--sidebar-border))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}>
                    <div className="text-xl mb-1">{f.icon}</div>
                    <div className="text-xs font-semibold">{f.label}</div>
                    <div className="text-[10px] text-[hsl(var(--sidebar-muted))]">{f.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Duration + Transitions + Music */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-primary" /> Dauer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-primary">{duration}s</p>
                  <Slider value={[duration]} onValueChange={v => setDuration(v[0])} min={3} max={activeFormat.maxDuration} step={1} />
                  <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">Max: {activeFormat.maxDuration}s für {activeFormat.label}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-primary" /> Übergang
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={transition} onValueChange={setTransition}>
                  <SelectTrigger className="bg-[hsl(var(--sidebar-background))] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSITION_STYLES.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-primary" /> Musik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={musicMood} onValueChange={setMusicMood}>
                  <SelectTrigger className="bg-[hsl(var(--sidebar-background))] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSIC_MOODS.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.icon} {m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Subtitles */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Subtitles className="w-4 h-4 text-primary" /> Auto-Untertitel
                </CardTitle>
                <Switch checked={autoSubtitles} onCheckedChange={setAutoSubtitles} />
              </div>
            </CardHeader>
            {autoSubtitles && (
              <CardContent className="space-y-2">
                <Textarea
                  value={subtitleText}
                  onChange={e => setSubtitleText(e.target.value)}
                  placeholder="Untertitel-Text eingeben... (optional, wird aus dem Prompt generiert wenn leer)"
                  className="min-h-[60px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-xs"
                  rows={2}
                />
                <div className="flex gap-2">
                  {["modern", "bold", "minimal", "karaoke"].map(s => (
                    <button key={s} onClick={() => setSubtitleStyle(s)}
                      className={`px-3 py-1.5 rounded-md border text-[10px] font-medium transition-all capitalize ${
                        subtitleStyle === s
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] hover:border-primary/40"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Prompt Input */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardContent className="pt-4 space-y-3">
              <Textarea
                value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="Beschreibe das Video... z.B. 'Pferd galoppiert über eine Wiese bei Sonnenuntergang, cinematic, slow motion'"
                className="min-h-[100px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))]"
              />
              <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--sidebar-muted))]">
                <Badge variant="outline" className="text-[10px]">{activeFormat.label}</Badge>
                <Badge variant="outline" className="text-[10px]">{activeFormat.ratio}</Badge>
                <Badge variant="outline" className="text-[10px]">{duration}s</Badge>
                {autoSubtitles && <Badge variant="outline" className="text-[10px]">🔤 Untertitel</Badge>}
                {musicMood !== "none" && <Badge variant="outline" className="text-[10px]">🎵 {musicMood}</Badge>}
              </div>
              <Button onClick={generateVideo} disabled={isGenerating || !prompt.trim()} className="w-full gap-2">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? "Generiere..." : `${activeFormat.label} erstellen`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Recent + Export */}
        <div className="space-y-4">
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Letzte Videos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {jobs.length === 0 ? (
                <div className="text-center py-6 text-[hsl(var(--sidebar-muted))]">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Noch keine Videos erstellt</p>
                </div>
              ) : jobs.slice(0, 5).map(job => (
                <div key={job.id} className="rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] overflow-hidden">
                  <div className="aspect-video relative flex items-center justify-center bg-[hsl(var(--sidebar-accent))]">
                    {job.status === "completed" && job.video_url ? (
                      <video src={job.video_url} className="w-full h-full object-cover" controls />
                    ) : (
                      <div className="text-center">
                        {job.status === "queued" || job.status === "processing" ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                            <p className="text-[10px] text-[hsl(var(--sidebar-muted))] mt-1">{job.status === "queued" ? "Warteschlange..." : "Generiere..."}</p>
                          </>
                        ) : (
                          <p className="text-xs text-destructive">Fehlgeschlagen</p>
                        )}
                      </div>
                    )}
                    <Badge className="absolute top-1.5 right-1.5 text-[9px] bg-[hsl(var(--sidebar-background))]/80">{job.aspect_ratio}</Badge>
                  </div>
                  <div className="p-2 space-y-1.5">
                    <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] line-clamp-1">{job.prompt}</p>
                    {job.status === "completed" && job.video_url && (
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="text-[9px] h-6 flex-1" onClick={() => exportForPlatform(job, "instagram")}>
                          📸 Insta
                        </Button>
                        <Button variant="outline" size="sm" className="text-[9px] h-6 flex-1" onClick={() => exportForPlatform(job, "youtube")}>
                          ▶️ YT
                        </Button>
                        <Button variant="outline" size="sm" className="text-[9px] h-6 flex-1" onClick={() => exportForPlatform(job, "tiktok")}>
                          🎵 TT
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
