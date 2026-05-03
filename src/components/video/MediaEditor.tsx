import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Crop, Type, Palette, Sun, Contrast, Droplets, Download, RotateCcw, 
  Loader2, Image as ImageIcon, Bold, AlignCenter
} from "lucide-react";

type MediaEditorProps = {
  mediaUrl: string;
  mediaType: "video" | "image";
  onClose?: () => void;
};

export default function MediaEditor({ mediaUrl, mediaType, onClose }: MediaEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [brandOverlay, setBrandOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [textSize, setTextSize] = useState(32);
  const [isExporting, setIsExporting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (mediaType === "image") {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imgRef.current = img;
        setImageLoaded(true);
        drawCanvas();
      };
      img.src = mediaUrl;
    }
  }, [mediaUrl]);

  useEffect(() => {
    if (imageLoaded) drawCanvas();
  }, [brightness, contrast, saturation, brandOverlay, overlayText, textPosition, textSize, imageLoaded]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(img, 0, 0);
    ctx.filter = "none";

    // Brand overlay (orange gradient at bottom)
    if (brandOverlay) {
      const grad = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
      grad.addColorStop(0, "rgba(244, 123, 32, 0)");
      grad.addColorStop(1, "rgba(244, 123, 32, 0.6)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
    }

    // Text overlay
    if (overlayText) {
      const fontSize = textSize * (canvas.width / 600);
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = fontSize * 0.08;

      let y: number;
      switch (textPosition) {
        case "top": y = fontSize * 1.5; break;
        case "center": y = canvas.height / 2; break;
        default: y = canvas.height - fontSize;
      }

      ctx.strokeText(overlayText, canvas.width / 2, y);
      ctx.fillText(overlayText, canvas.width / 2, y);
    }
  };

  const resetAll = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBrandOverlay(false);
    setOverlayText("");
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);
    try {
      const link = document.createElement("a");
      link.download = `Hufi_edited_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Bild exportiert ✓" });
    } catch {
      toast({ title: "Export fehlgeschlagen", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

  return (
    <div className="space-y-4">
      {/* Preview */}
      <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))]">Editor</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={resetAll} className="text-xs h-7 gap-1 text-[hsl(var(--sidebar-muted))]">
                <RotateCcw className="w-3 h-3" /> Reset
              </Button>
              <Button size="sm" onClick={exportImage} disabled={isExporting} className="text-xs h-7 bg-primary hover:bg-primary/90 gap-1">
                {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                Exportieren
              </Button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black/50 flex items-center justify-center" style={{ maxHeight: 400 }}>
            {mediaType === "image" ? (
              <canvas ref={canvasRef} className="max-w-full max-h-[400px] object-contain" />
            ) : (
              <video src={mediaUrl} controls className="max-w-full max-h-[400px]" style={{ filter: cssFilter }} />
            )}
            {brandOverlay && mediaType === "video" && (
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#F47B20]/60 to-transparent pointer-events-none" />
            )}
            {overlayText && mediaType === "video" && (
              <div className={`absolute left-0 right-0 text-center pointer-events-none ${
                textPosition === "top" ? "top-4" : textPosition === "center" ? "top-1/2 -translate-y-1/2" : "bottom-4"
              }`}>
                <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: textSize }}>{overlayText}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Color Grading */}
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
          <CardContent className="p-4 space-y-4">
            <p className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> Color Grading
            </p>
            {[
              { label: "Helligkeit", icon: Sun, value: brightness, setter: setBrightness },
              { label: "Kontrast", icon: Contrast, value: contrast, setter: setContrast },
              { label: "Sättigung", icon: Droplets, value: saturation, setter: setSaturation },
            ].map(ctrl => (
              <div key={ctrl.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[hsl(var(--sidebar-muted))] flex items-center gap-1">
                    <ctrl.icon className="w-3 h-3" /> {ctrl.label}
                  </span>
                  <span className="text-[10px] text-primary font-mono">{ctrl.value}%</span>
                </div>
                <Slider value={[ctrl.value]} onValueChange={v => ctrl.setter(v[0])} min={0} max={200} step={1}
                  className="[&_[role=slider]]:bg-primary" />
              </div>
            ))}
            <Button size="sm" variant={brandOverlay ? "default" : "outline"} onClick={() => setBrandOverlay(!brandOverlay)}
              className={`w-full text-xs h-8 gap-1 ${brandOverlay ? "bg-primary hover:bg-primary/90" : "border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]"}`}>
              <Palette className="w-3 h-3" /> Brand-Overlay (#F47B20)
            </Button>
          </CardContent>
        </Card>

        {/* Text Overlay */}
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
          <CardContent className="p-4 space-y-4">
            <p className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" /> Text-Overlay
            </p>
            <Input value={overlayText} onChange={e => setOverlayText(e.target.value)} placeholder="Text eingeben..."
              className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs" />
            <div className="space-y-1">
              <span className="text-[10px] text-[hsl(var(--sidebar-muted))]">Position</span>
              <div className="flex gap-1">
                {(["top", "center", "bottom"] as const).map(pos => (
                  <Button key={pos} size="sm" variant={textPosition === pos ? "default" : "outline"}
                    onClick={() => setTextPosition(pos)}
                    className={`flex-1 text-[10px] h-7 ${textPosition === pos ? "bg-primary hover:bg-primary/90" : "border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))]"}`}>
                    {pos === "top" ? "Oben" : pos === "center" ? "Mitte" : "Unten"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[hsl(var(--sidebar-muted))] flex items-center gap-1">
                  <Bold className="w-3 h-3" /> Schriftgröße
                </span>
                <span className="text-[10px] text-primary font-mono">{textSize}px</span>
              </div>
              <Slider value={[textSize]} onValueChange={v => setTextSize(v[0])} min={12} max={72} step={1}
                className="[&_[role=slider]]:bg-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
