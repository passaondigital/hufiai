import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ImageIcon, Loader2, Sparkles, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ImageLab() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [style, setStyle] = useState("realistic");

  const STYLES = [
    { id: "realistic", label: "📸 Realistisch" },
    { id: "illustration", label: "🎨 Illustration" },
    { id: "social-media", label: "📱 Social Media" },
    { id: "infographic", label: "📊 Infografik" },
  ];

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setImageUrl(null);
    try {
      const styledPrompt = style === "realistic"
        ? prompt
        : style === "illustration"
        ? `Digital illustration style: ${prompt}`
        : style === "social-media"
        ? `Modern social media graphic design: ${prompt}`
        : `Clean infographic style: ${prompt}`;

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          action: "generate_image",
          prompt: styledPrompt,
        },
      });

      if (error) throw error;

      if (data.image_url) {
        setImageUrl(data.image_url);
        toast.success("Bild generiert!");
      } else {
        toast.error("Kein Bild empfangen");
      }
    } catch (err: any) {
      toast.error(err.message || "Bildgenerierung fehlgeschlagen");
    }
    setGenerating(false);
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `hufi-image-${Date.now()}.png`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="w-5 h-5 text-primary" /> Image Lab
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generiere Bilder mit KI. Ideal für Social Media, Blog-Header und Marketing-Material.
        </p>

        {/* Style Selection */}
        <div className="flex gap-2 flex-wrap">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                style === s.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Beschreibe das gewünschte Bild auf Deutsch, z.B. 'Ein Pferd auf einer Koppel bei Sonnenuntergang'…"
          rows={3}
        />

        <Button onClick={generateImage} disabled={generating || !prompt.trim()} className="w-full">
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {generating ? "Generiere…" : "Bild generieren"}
        </Button>

        {imageUrl && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
              <img src={imageUrl} alt="Generated" className="w-full max-h-[500px] object-contain" />
            </div>
            <Button variant="outline" onClick={downloadImage} className="w-full">
              <Download className="w-4 h-4 mr-2" /> Bild herunterladen
            </Button>
          </div>
        )}

        <Badge variant="outline" className="text-xs">Modell: Gemini Image (google/gemini-2.5-flash-image)</Badge>
      </CardContent>
    </Card>
  );
}
