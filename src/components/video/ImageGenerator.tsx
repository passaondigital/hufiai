import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Loader2, Sparkles, Download, Copy, Share2, Wand2 } from "lucide-react";
import { toast } from "sonner";

const STYLES = [
  { id: "modern", label: "Modern", icon: "✨", desc: "Clean & Professional" },
  { id: "minimalist", label: "Minimalist", icon: "◻️", desc: "Elegant & Einfach" },
  { id: "vibrant", label: "Vibrant", icon: "🎨", desc: "Bold & Farbenfroh" },
  { id: "vintage", label: "Vintage", icon: "📼", desc: "Retro & Warm" },
  { id: "watercolor", label: "Aquarell", icon: "🖌️", desc: "Weich & Fließend" },
  { id: "3d", label: "3D Render", icon: "🧊", desc: "Realistisch" },
  { id: "flat", label: "Flat Design", icon: "📐", desc: "Shapes & Farben" },
  { id: "neon", label: "Neon", icon: "💡", desc: "Glow & Dunkel" },
];

const SIZES = [
  { id: "1080x1080", label: "Instagram Post", ratio: "1:1", icon: "📸" },
  { id: "1080x1920", label: "Story / Reel", ratio: "9:16", icon: "📱" },
  { id: "1200x630", label: "LinkedIn / FB", ratio: "1.9:1", icon: "💼" },
  { id: "1500x500", label: "Twitter Header", ratio: "3:1", icon: "🐦" },
  { id: "1920x1080", label: "YouTube Thumb", ratio: "16:9", icon: "▶️" },
];

const MODELS = [
  { id: "google/gemini-3-pro-image-preview", label: "Gemini 3 Pro", desc: "Beste Qualität", badge: "⭐" },
  { id: "google/gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash", desc: "Schnell + Gut", badge: "⚡" },
  { id: "google/gemini-2.5-flash-image", label: "Nano Banana", desc: "Schnellste", badge: "🍌" },
];

interface GeneratedImage {
  url: string;
  prompt: string;
  style: string;
  size: string;
  timestamp: number;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("modern");
  const [size, setSize] = useState("1080x1080");
  const [model, setModel] = useState("google/gemini-3-pro-image-preview");
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image-ai", {
        body: { prompt, style, size, model },
      });
      if (error) throw error;
      if (data?.image_url) {
        setImages(prev => [{
          url: data.image_url,
          prompt,
          style,
          size,
          timestamp: Date.now(),
        }, ...prev]);
        toast.success("Bild generiert! 🎨");
      } else {
        toast.error("Kein Bild empfangen");
      }
    } catch (err: any) {
      toast.error(err.message || "Bildgenerierung fehlgeschlagen");
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = (url: string, idx: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `hufiai-image-${idx}-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const copyToClipboard = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success("Bild kopiert!");
    } catch {
      navigator.clipboard.writeText(url);
      toast.success("URL kopiert!");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Model Selection */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" /> KI-Modell
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {MODELS.map(m => (
                  <button key={m.id} onClick={() => setModel(m.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all text-xs ${model === m.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-[hsl(var(--sidebar-border))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span>{m.badge}</span>
                      <span className="font-semibold">{m.label}</span>
                    </div>
                    <span className="text-[hsl(var(--sidebar-muted))]">{m.desc}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Style Selection */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> Style-Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STYLES.map(s => (
                  <button key={s.id} onClick={() => setStyle(s.id)}
                    className={`p-3 rounded-lg border text-center transition-all ${style === s.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-[hsl(var(--sidebar-border))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}>
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="text-xs font-semibold">{s.label}</div>
                    <div className="text-[10px] text-[hsl(var(--sidebar-muted))]">{s.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Size Selection */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                📐 Social-Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SIZES.map(s => (
                  <button key={s.id} onClick={() => setSize(s.id)}
                    className={`p-2.5 rounded-lg border text-center transition-all text-xs ${size === s.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-[hsl(var(--sidebar-border))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}>
                    <div className="text-lg mb-0.5">{s.icon}</div>
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-[10px] text-[hsl(var(--sidebar-muted))]">{s.ratio}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prompt Input */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardContent className="pt-4 space-y-3">
              <Textarea
                value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="Beschreibe das gewünschte Bild... z.B. 'Ein Pferd auf einer Koppel bei Sonnenuntergang, professionelles Marketing-Foto'"
                className="min-h-[100px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))]"
              />
              <Button onClick={generate} disabled={generating || !prompt.trim()} className="w-full gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Generiere..." : "Bild generieren"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Vorschau</CardTitle>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="aspect-square rounded-lg bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))] flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-xs text-[hsl(var(--sidebar-muted))]">Generiere mit {MODELS.find(m => m.id === model)?.label}...</p>
                  </div>
                </div>
              ) : images.length > 0 ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-[hsl(var(--sidebar-border))] overflow-hidden bg-[hsl(var(--sidebar-background))]">
                    <img src={images[0].url} alt="Generated" className="w-full object-contain max-h-[400px]" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadImage(images[0].url, 0)} className="text-xs gap-1">
                      <Download className="w-3 h-3" /> Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(images[0].url)} className="text-xs gap-1">
                      <Copy className="w-3 h-3" /> Kopieren
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: "HufiAi Bild", url: images[0].url });
                      } else {
                        navigator.clipboard.writeText(images[0].url);
                        toast.success("URL kopiert!");
                      }
                    }} className="text-xs gap-1">
                      <Share2 className="w-3 h-3" /> Teilen
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">{STYLES.find(s => s.id === images[0].style)?.label}</Badge>
                    <Badge variant="outline" className="text-[10px]">{SIZES.find(s => s.id === images[0].size)?.label}</Badge>
                  </div>
                </div>
              ) : (
                <div className="aspect-square rounded-lg bg-[hsl(var(--sidebar-background))] border border-dashed border-[hsl(var(--sidebar-border))] flex items-center justify-center">
                  <div className="text-center text-[hsl(var(--sidebar-muted))]">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Gib einen Prompt ein und generiere dein erstes Bild</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Gallery */}
          {images.length > 1 && (
            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Letzte Generierungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {images.slice(1, 7).map((img, i) => (
                    <button key={i} onClick={() => setImages(prev => {
                      const target = prev[i + 1];
                      return [target, ...prev.filter((_, idx) => idx !== i + 1)];
                    })} className="rounded-lg border border-[hsl(var(--sidebar-border))] overflow-hidden hover:ring-1 hover:ring-primary transition-all">
                      <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
