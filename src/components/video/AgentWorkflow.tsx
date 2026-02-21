import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Globe, Sparkles, Loader2, Film, Palette, Layers, Play, CheckCircle,
  Clock, Wand2, Eye, RotateCw
} from "lucide-react";

type Scene = {
  scene_number: number;
  title: string;
  prompt: string;
  model: string;
  model_reason: string;
  aspect_ratio: string;
  duration: number;
  style: string;
  color_mood: string;
};

type VideoScript = {
  title: string;
  summary: string;
  brand_colors: string[];
  dominant_color: string;
  scenes: Scene[];
  multi_output: {
    reel: { aspect_ratio: string; scenes: number[] };
    youtube: { aspect_ratio: string; scenes: number[] };
    square: { aspect_ratio: string; scenes: number[] };
  };
};

type GenerationStatus = {
  sceneIndex: number;
  format: string;
  status: "pending" | "generating" | "completed" | "failed";
};

const MODEL_LABELS: Record<string, string> = {
  "wan-2.2": "⭐ Wan 2.2",
  "skyreels-v1": "🎬 SkyReels",
  "hunyuan-video": "🔬 HunyuanVideo",
  "open-sora-2": "🎞️ Open-Sora",
  "mochi-1": "⚡ Mochi",
};

export default function AgentWorkflow({ userId }: { userId: string }) {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [multiOutput, setMultiOutput] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatuses, setGenerationStatuses] = useState<GenerationStatus[]>([]);

  const analyzeUrl = async () => {
    if (!url.trim()) return toast({ title: "Bitte gib eine URL ein", variant: "destructive" });
    setIsAnalyzing(true);
    setScript(null);
    try {
      const { data, error } = await supabase.functions.invoke("web-to-video", {
        body: { url, action: "analyze" },
      });
      if (error) throw error;
      if (data?.script) {
        setScript(data.script);
        toast({ title: "Web-Analyse abgeschlossen ✨", description: `${data.script.scenes.length} Szenen erstellt` });
      } else {
        throw new Error("Kein Skript erhalten");
      }
    } catch (e: any) {
      toast({ title: "Analyse fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAllVideos = async () => {
    if (!script) return;
    setIsGenerating(true);

    const formats = multiOutput
      ? ["reel", "youtube", "square"]
      : ["youtube"];

    const statuses: GenerationStatus[] = [];
    script.scenes.forEach((_, idx) => {
      formats.forEach(fmt => {
        statuses.push({ sceneIndex: idx, format: fmt, status: "pending" });
      });
    });
    setGenerationStatuses(statuses);

    for (let i = 0; i < statuses.length; i++) {
      const s = statuses[i];
      const scene = script.scenes[s.sceneIndex];
      const aspectRatio = s.format === "reel" ? "9:16" : s.format === "square" ? "1:1" : "16:9";

      setGenerationStatuses(prev =>
        prev.map((p, idx) => idx === i ? { ...p, status: "generating" } : p)
      );

      try {
        // Build color-graded prompt
        const coloredPrompt = `${scene.prompt}, color palette: ${scene.color_mood}, accent color: #F47B20 HufiAi orange`;

        const { data: insertData, error: insertError } = await supabase.from("video_jobs").insert({
          user_id: userId,
          prompt: coloredPrompt,
          model: scene.model,
          input_type: "text",
          aspect_ratio: aspectRatio,
          duration: scene.duration,
          motion_intensity: 60,
          coherence: 70,
          stylization: 50,
          format: "mp4",
          preset: scene.style,
          status: "queued",
        }).select("id").single();
        if (insertError) throw insertError;

        // Trigger video generation
        supabase.functions.invoke("generate-video", {
          body: { jobId: insertData.id },
        }).catch(e => console.error("Generate video trigger error:", e));

        setGenerationStatuses(prev =>
          prev.map((p, idx) => idx === i ? { ...p, status: "completed" } : p)
        );
      } catch {
        setGenerationStatuses(prev =>
          prev.map((p, idx) => idx === i ? { ...p, status: "failed" } : p)
        );
      }
    }

    toast({
      title: "Agent-Workflow abgeschlossen 🚀",
      description: `${statuses.filter(s => s.status !== "failed").length} Video-Jobs erstellt`,
    });
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
        <CardHeader>
          <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Web-Intelligence Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[hsl(var(--sidebar-muted))]">
            Gib eine URL ein. Der Agent liest die Seite, erkennt Farben und Inhalte, erstellt automatisch ein Video-Skript
            mit 3-5 Szenen und wählt das optimale Modell pro Szene.
          </p>

          <div className="flex gap-2">
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://beispiel.de/hufrehe-heilung"
              className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-sm"
            />
            <Button onClick={analyzeUrl} disabled={isAnalyzing} className="bg-primary hover:bg-primary/90 text-xs gap-1.5 shrink-0">
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              Analysieren
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={multiOutput} onCheckedChange={setMultiOutput} />
            <label className="text-xs text-[hsl(var(--sidebar-foreground))]">
              Multi-Output: Reel (9:16) + YouTube (16:9) + Square (1:1) gleichzeitig
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Script Preview */}
      {script && (
        <>
          {/* Brand Colors */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Erkannte Farben & Branding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 flex-wrap">
                {script.brand_colors.map((color, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-[hsl(var(--sidebar-border))] shadow-sm" style={{ backgroundColor: color }} />
                    <span className="text-[10px] text-[hsl(var(--sidebar-muted))] font-mono">{color}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 ml-3 pl-3 border-l border-[hsl(var(--sidebar-border))]">
                  <div className="w-8 h-8 rounded-lg border-2 border-primary shadow-sm" style={{ backgroundColor: "#F47B20" }} />
                  <span className="text-[10px] text-primary font-mono font-bold">#F47B20 (HufiAi Akzent)</span>
                </div>
              </div>
              <p className="text-[10px] text-[hsl(var(--sidebar-muted))] mt-3">
                Dominante Farbe: <span className="font-mono">{script.dominant_color}</span> · Wird automatisch ins Color Grading übernommen.
              </p>
            </CardContent>
          </Card>

          {/* Scenes */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" /> Video-Skript: {script.title}
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary ml-auto">
                  {script.scenes.length} Szenen
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
                    <Badge variant="outline" className="text-[9px] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))]">
                      {scene.duration}s
                    </Badge>
                  </div>

                  <p className="text-xs text-[hsl(var(--sidebar-muted))]">{scene.prompt}</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                      {MODEL_LABELS[scene.model] || scene.model}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))]">
                      {scene.style}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full border border-[hsl(var(--sidebar-border))]" style={{ backgroundColor: scene.color_mood.split(",")[0]?.trim() || "#F47B20" }} />
                      <span className="text-[9px] text-[hsl(var(--sidebar-muted))]">{scene.color_mood}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[hsl(var(--sidebar-muted))] italic">
                    🤖 Modell-Begründung: {scene.model_reason}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Multi-Output Overview */}
          {multiOutput && (
            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Multi-Purpose Output
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Reel", ratio: "9:16", icon: "📱", target: "Instagram/TikTok" },
                    { label: "YouTube", ratio: "16:9", icon: "🎬", target: "YouTube/Website" },
                    { label: "Square", ratio: "1:1", icon: "📐", target: "Blog/LinkedIn" },
                  ].map(fmt => (
                    <div key={fmt.label} className="p-3 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] text-center">
                      <div className="text-xl mb-1">{fmt.icon}</div>
                      <div className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))]">{fmt.label}</div>
                      <div className="text-[10px] text-[hsl(var(--sidebar-muted))]">{fmt.ratio}</div>
                      <div className="text-[9px] text-primary mt-1">{fmt.target}</div>
                      <div className="text-[10px] text-[hsl(var(--sidebar-muted))] mt-1">
                        {script.scenes.length} Szenen
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generation Status */}
          {generationStatuses.length > 0 && (
            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-primary" /> Generierungs-Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {generationStatuses.map((gs, idx) => (
                    <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                      gs.status === "completed" ? "border-green-500/30 bg-green-500/5" :
                      gs.status === "generating" ? "border-primary/30 bg-primary/5" :
                      gs.status === "failed" ? "border-destructive/30 bg-destructive/5" :
                      "border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))]"
                    }`}>
                      {gs.status === "generating" ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> :
                       gs.status === "completed" ? <CheckCircle className="w-3 h-3 text-green-400" /> :
                       gs.status === "failed" ? <span className="text-destructive">✕</span> :
                       <Clock className="w-3 h-3 text-[hsl(var(--sidebar-muted))]" />}
                      <span className="text-[hsl(var(--sidebar-foreground))]">
                        Szene {gs.sceneIndex + 1} · {gs.format}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateAllVideos}
            disabled={isGenerating}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2 h-14 rounded-xl shadow-lg shadow-primary/20"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {multiOutput
              ? `${script.scenes.length * 3} Videos generieren (Reel + YouTube + Square)`
              : `${script.scenes.length} Videos generieren`}
          </Button>
        </>
      )}
    </div>
  );
}
