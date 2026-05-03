import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles, Download, Palette, Type, BarChart3, Crown, Copy, Layers, Move, Trash2, Plus, Square, Circle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

// ── Google Fonts ──
const GOOGLE_FONTS = [
  "Inter", "Roboto", "Montserrat", "Playfair Display", "Oswald",
  "Lora", "Poppins", "Raleway", "Bebas Neue", "Dancing Script",
  "Merriweather", "Nunito", "Caveat", "Pacifico", "Permanent Marker",
];

// Load Google Fonts dynamically
const loadGoogleFont = (fontFamily: string) => {
  const id = `gfont-${fontFamily.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`;
  document.head.appendChild(link);
};

// ── Template Data ──
const LOGO_STYLES = [
  { id: "minimalist", label: "Minimalistisch", prompt: "Minimalist logo design, clean lines, simple geometry" },
  { id: "modern", label: "Modern", prompt: "Modern professional logo, bold typography, sleek design" },
  { id: "playful", label: "Verspielt", prompt: "Playful and friendly logo, rounded shapes, warm colors" },
  { id: "luxury", label: "Premium", prompt: "Luxury brand logo, elegant, gold accents, sophisticated" },
  { id: "tech", label: "Tech", prompt: "Tech startup logo, geometric, futuristic, gradient" },
  { id: "organic", label: "Organisch", prompt: "Organic natural logo, flowing shapes, earthy tones" },
];

const SM_TEMPLATES = [
  { id: "quote", label: "Zitat-Post", icon: "💬", prompt: "Social media quote post template, elegant typography on clean background" },
  { id: "announcement", label: "Ankündigung", icon: "📢", prompt: "Social media announcement graphic, bold headline, modern layout" },
  { id: "tips", label: "Tipps & Tricks", icon: "💡", prompt: "Tips and tricks infographic for social media, numbered list, icons" },
  { id: "beforeafter", label: "Vorher/Nachher", icon: "↔️", prompt: "Before and after comparison template, split layout, clean design" },
  { id: "testimonial", label: "Testimonial", icon: "⭐", prompt: "Customer testimonial social media post, star rating, professional" },
  { id: "carousel", label: "Karussell", icon: "📱", prompt: "Instagram carousel slide design, consistent branding, modern" },
];

const INFOGRAPHIC_TYPES = [
  { id: "process", label: "Prozess", prompt: "Step-by-step process infographic, numbered steps, clean flow" },
  { id: "comparison", label: "Vergleich", prompt: "Comparison infographic, side by side, pros and cons" },
  { id: "statistics", label: "Statistik", prompt: "Statistics infographic with charts and key numbers, data visualization" },
  { id: "timeline", label: "Zeitstrahl", prompt: "Timeline infographic, chronological events, milestone markers" },
];

// ── Canvas Layer Types ──
interface CanvasLayer {
  id: string;
  type: "text" | "shape" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  opacity: number;
  visible: boolean;
  zIndex: number;
}

export default function GraphicsDesign() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("logo");
  const [prompt, setPrompt] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#F47B20");
  const [brandSecondaryColor, setBrandSecondaryColor] = useState("#1A1A1A");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [exportFormat, setExportFormat] = useState("png");
  const [exportSize, setExportSize] = useState("1080x1080");

  // Canvas Editor State
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const generate = async (basePrompt: string) => {
    setGenerating(true);
    setResult(null);
    try {
      const fullPrompt = [
        basePrompt,
        prompt ? `Content: ${prompt}` : "",
        brandName ? `Brand: "${brandName}"` : "",
        `Brand color: ${brandColor}. Secondary: ${brandSecondaryColor}. High quality, professional graphic design output. On a clean background.`,
      ].filter(Boolean).join(". ");

      const { data, error } = await supabase.functions.invoke("generate-image-ai", {
        body: { prompt: fullPrompt, style: "flat", size: exportSize, model: "google/gemini-3-pro-image-preview" },
      });
      if (error) throw error;
      if (data?.image_url) {
        setResult(data.image_url);

        // Save to generated_content
        if (user) {
          await supabase.from("generated_content" as any).insert({
            user_id: user.id,
            type: "graphic",
            title: prompt?.slice(0, 100) || basePrompt.slice(0, 100),
            original_prompt: fullPrompt,
            file_url: data.image_url,
            dimensions: exportSize,
            format: exportFormat,
          });
        }

        toast.success("Grafik generiert! 🎨");
      }
    } catch (err: any) {
      toast.error(err.message || "Generierung fehlgeschlagen");
    } finally {
      setGenerating(false);
    }
  };

  // ── Layer Management ──
  const addLayer = (type: "text" | "shape" | "image") => {
    const defaultFont = "Inter";
    loadGoogleFont(defaultFont);
    const newLayer: CanvasLayer = {
      id: crypto.randomUUID(),
      type,
      x: 50,
      y: 50,
      width: type === "text" ? 200 : 100,
      height: type === "text" ? 40 : 100,
      content: type === "text" ? "Text hier" : type === "shape" ? "rect" : "",
      color: type === "text" ? "#FFFFFF" : brandColor,
      fontSize: 24,
      fontWeight: "bold",
      fontFamily: defaultFont,
      opacity: 100,
      visible: true,
      zIndex: layers.length,
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (id: string, updates: Partial<CanvasLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const moveLayerOrder = (id: string, direction: "up" | "down") => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx === -1) return prev;
      const newArr = [...prev];
      const swapIdx = direction === "up" ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= newArr.length) return prev;
      [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
      return newArr;
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    setSelectedLayerId(layerId);
    setIsDragging(true);
    const layer = layers.find(l => l.id === layerId);
    if (layer && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - layer.x,
        y: e.clientY - rect.top - layer.y,
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedLayerId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    updateLayer(selectedLayerId, {
      x: Math.max(0, e.clientX - rect.left - dragOffset.x),
      y: Math.max(0, e.clientY - rect.top - dragOffset.y),
    });
  };

  const handleCanvasMouseUp = () => setIsDragging(false);

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `hufi-${activeTab}-${Date.now()}.${exportFormat}`;
    a.target = "_blank";
    a.click();
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[hsl(var(--sidebar-accent))] border border-[hsl(var(--sidebar-border))] mb-4">
            <TabsTrigger value="logo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
              <Crown className="w-3.5 h-3.5" /> Logo
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
              <Type className="w-3.5 h-3.5" /> Social Templates
            </TabsTrigger>
            <TabsTrigger value="infographic" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Infografiken
            </TabsTrigger>
            <TabsTrigger value="editor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Editor
            </TabsTrigger>
            <TabsTrigger value="brandkit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Brand Kit
            </TabsTrigger>
          </TabsList>

          {/* Logo Generator */}
          <TabsContent value="logo">
            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" /> Logo Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input value={brandName} onChange={e => setBrandName(e.target.value)}
                  placeholder="Markenname eingeben..." className="bg-[hsl(var(--sidebar-background))]" />
                <div className="grid grid-cols-3 gap-2">
                  {LOGO_STYLES.map(s => (
                    <button key={s.id} onClick={() => setSelectedTemplate(s.id)}
                      className={`p-2.5 rounded-lg border text-center text-xs transition-all ${selectedTemplate === s.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-[hsl(var(--sidebar-border))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}>
                      <span className="font-semibold">{s.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[hsl(var(--sidebar-muted))]">Primär:</label>
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[hsl(var(--sidebar-muted))]">Sekundär:</label>
                    <input type="color" value={brandSecondaryColor} onChange={e => setBrandSecondaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  </div>
                </div>
                <Textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                  placeholder="Zusätzliche Beschreibung... z.B. 'Für eine Hufpflege-Praxis, mit Hufeisen-Element'"
                  className="min-h-[60px] bg-[hsl(var(--sidebar-background))]" rows={2} />
                <Button onClick={() => generate(LOGO_STYLES.find(s => s.id === selectedTemplate)?.prompt || LOGO_STYLES[0].prompt)}
                  disabled={generating} className="w-full gap-2">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Logo generieren
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Templates */}
          <TabsContent value="social">
            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Social Media Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SM_TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${selectedTemplate === t.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-[hsl(var(--sidebar-border))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}>
                      <div className="text-xl mb-1">{t.icon}</div>
                      <div className="text-xs font-semibold">{t.label}</div>
                    </button>
                  ))}
                </div>
                <Textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                  placeholder="Inhalt des Posts... z.B. 'Hufpflege-Tipps für den Winter'"
                  className="min-h-[60px] bg-[hsl(var(--sidebar-background))]" rows={2} />
                <Button onClick={() => generate(SM_TEMPLATES.find(t => t.id === selectedTemplate)?.prompt || SM_TEMPLATES[0].prompt)}
                  disabled={generating} className="w-full gap-2">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Template generieren
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Infographics */}
          <TabsContent value="infographic">
            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Infografik Creator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {INFOGRAPHIC_TYPES.map(t => (
                    <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                      className={`p-2.5 rounded-lg border text-center text-xs transition-all ${selectedTemplate === t.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-[hsl(var(--sidebar-border))] hover:border-primary/40 bg-[hsl(var(--sidebar-background))]"}`}>
                      <span className="font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
                <Textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                  placeholder="Daten und Inhalte für die Infografik..."
                  className="min-h-[80px] bg-[hsl(var(--sidebar-background))]" rows={3} />
                <Button onClick={() => generate(INFOGRAPHIC_TYPES.find(t => t.id === selectedTemplate)?.prompt || INFOGRAPHIC_TYPES[0].prompt)}
                  disabled={generating} className="w-full gap-2">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Infografik generieren
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Canvas Editor */}
          <TabsContent value="editor">
            <div className="space-y-3">
              {/* Toolbar */}
              <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                <CardContent className="py-2 flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => addLayer("text")} className="text-xs gap-1 h-8">
                    <Type className="w-3 h-3" /> Text
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addLayer("shape")} className="text-xs gap-1 h-8">
                    <Square className="w-3 h-3" /> Shape
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    if (result) {
                      const layer: CanvasLayer = {
                        id: crypto.randomUUID(),
                        type: "image",
                        x: 0, y: 0,
                        width: 300, height: 300,
                        content: result,
                        color: "",
                        opacity: 100,
                        visible: true,
                        zIndex: layers.length,
                      };
                      setLayers(prev => [...prev, layer]);
                    } else {
                      toast.info("Generiere zuerst ein Bild im Logo/Social/Infografik Tab");
                    }
                  }} className="text-xs gap-1 h-8">
                    <ImageIcon className="w-3 h-3" /> Bild einfügen
                  </Button>
                  <div className="flex-1" />
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger className="w-20 h-8 text-xs bg-[hsl(var(--sidebar-background))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="svg">SVG</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={exportSize} onValueChange={setExportSize}>
                    <SelectTrigger className="w-32 h-8 text-xs bg-[hsl(var(--sidebar-background))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1080x1080">1080×1080</SelectItem>
                      <SelectItem value="1080x1920">1080×1920</SelectItem>
                      <SelectItem value="1200x630">1200×630</SelectItem>
                      <SelectItem value="1920x1080">1920×1080</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Canvas */}
              <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                <CardContent className="p-2">
                  <div
                    ref={canvasRef}
                    className="relative bg-[hsl(var(--sidebar-background))] rounded-lg border border-[hsl(var(--sidebar-border))] overflow-hidden"
                    style={{ width: "100%", paddingBottom: exportSize === "1080x1920" ? "177%" : exportSize === "1200x630" ? "52.5%" : "100%", position: "relative" }}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onClick={() => setSelectedLayerId(null)}
                  >
                    <div className="absolute inset-0">
                      {layers.filter(l => l.visible).map(layer => (
                        <div
                          key={layer.id}
                          onMouseDown={e => handleCanvasMouseDown(e, layer.id)}
                          className={`absolute cursor-move select-none ${selectedLayerId === layer.id ? "ring-2 ring-primary" : ""}`}
                          style={{
                            left: layer.x, top: layer.y,
                            width: layer.width, height: layer.height,
                            opacity: layer.opacity / 100,
                            zIndex: layer.zIndex,
                          }}
                        >
                          {layer.type === "text" && (
                            <div
                              style={{ color: layer.color, fontSize: layer.fontSize, fontWeight: layer.fontWeight, fontFamily: layer.fontFamily || "Inter" }}
                              className="w-full h-full flex items-center justify-center"
                            >
                              {layer.content}
                            </div>
                          )}
                          {layer.type === "shape" && (
                            <div
                              className={layer.content === "circle" ? "rounded-full" : "rounded-md"}
                              style={{ backgroundColor: layer.color, width: "100%", height: "100%" }}
                            />
                          )}
                          {layer.type === "image" && layer.content && (
                            <img src={layer.content} alt="" className="w-full h-full object-contain" />
                          )}
                        </div>
                      ))}
                      {layers.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-[hsl(var(--sidebar-muted))]">
                          <div className="text-center">
                            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-xs">Füge Text, Shapes oder Bilder hinzu</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Brand Kit */}
          <TabsContent value="brandkit">
            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" /> Brand Kit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-[hsl(var(--sidebar-muted))]">
                  Definiere deine Markenfarben. Sie werden automatisch auf alle generierten Grafiken angewendet.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Primärfarbe</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                      <Input value={brandColor} onChange={e => setBrandColor(e.target.value)} className="font-mono text-xs bg-[hsl(var(--sidebar-background))]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Sekundärfarbe</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={brandSecondaryColor} onChange={e => setBrandSecondaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                      <Input value={brandSecondaryColor} onChange={e => setBrandSecondaryColor(e.target.value)} className="font-mono text-xs bg-[hsl(var(--sidebar-background))]" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Markenname</label>
                  <Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Dein Markenname" className="bg-[hsl(var(--sidebar-background))]" />
                </div>
                <div className="p-4 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))]">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: brandColor }} />
                      <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: brandSecondaryColor }} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{brandName || "Deine Marke"}</p>
                      <p className="text-xs text-[hsl(var(--sidebar-muted))]">Wird automatisch auf alle Grafiken angewendet</p>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">💡 Tipp: Brandfarben werden bei Logo, Templates und Infografiken automatisch angewendet</Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right: Preview + Layers Panel */}
      <div className="space-y-4">
        {/* Preview Card */}
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Vorschau</CardTitle>
          </CardHeader>
          <CardContent>
            {generating ? (
              <div className="aspect-square rounded-lg bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))] flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-xs text-[hsl(var(--sidebar-muted))]">Generiere Grafik...</p>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-[hsl(var(--sidebar-border))] overflow-hidden bg-[hsl(var(--sidebar-background))]">
                  <img src={result} alt="Generated" className="w-full object-contain max-h-[300px]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={downloadResult} className="text-xs gap-1">
                    <Download className="w-3 h-3" /> {exportFormat.toUpperCase()}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(result);
                    toast.success("URL kopiert!");
                  }} className="text-xs gap-1">
                    <Copy className="w-3 h-3" /> Kopieren
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-square rounded-lg bg-[hsl(var(--sidebar-background))] border border-dashed border-[hsl(var(--sidebar-border))] flex items-center justify-center">
                <div className="text-center text-[hsl(var(--sidebar-muted))]">
                  <Palette className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Wähle einen Typ und generiere</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Layers Panel (only in editor mode) */}
        {activeTab === "editor" && (
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Ebenen ({layers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {layers.length === 0 ? (
                <p className="text-xs text-[hsl(var(--sidebar-muted))]">Noch keine Ebenen</p>
              ) : (
                layers.slice().reverse().map(layer => (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedLayerId === layer.id
                        ? "border-primary bg-primary/10"
                        : "border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] hover:border-primary/40"
                    }`}
                  >
                    <span className="text-[hsl(var(--sidebar-muted))]">
                      {layer.type === "text" ? <Type className="w-3 h-3" /> : layer.type === "shape" ? <Square className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    </span>
                    <span className="flex-1 truncate">{layer.type === "text" ? layer.content : layer.type}</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))
              )}

              {/* Selected layer properties */}
              {selectedLayer && (
                <div className="border-t border-[hsl(var(--sidebar-border))] pt-2 mt-2 space-y-2">
                  <p className="text-[10px] font-medium text-[hsl(var(--sidebar-muted))]">Eigenschaften</p>
                  {selectedLayer.type === "text" && (
                    <Input
                      value={selectedLayer.content}
                      onChange={e => updateLayer(selectedLayer.id, { content: e.target.value })}
                      className="text-xs h-8 bg-[hsl(var(--sidebar-background))]"
                      placeholder="Text..."
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-[hsl(var(--sidebar-muted))]">Farbe:</label>
                    <input type="color" value={selectedLayer.color} onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[hsl(var(--sidebar-muted))]">Deckkraft: {selectedLayer.opacity}%</label>
                    <Slider value={[selectedLayer.opacity]} onValueChange={v => updateLayer(selectedLayer.id, { opacity: v[0] })} min={0} max={100} step={5} className="mt-1" />
                  </div>
                  {selectedLayer.type === "text" && (
                    <>
                      <div>
                        <label className="text-[10px] text-[hsl(var(--sidebar-muted))]">Schriftart</label>
                        <Select value={selectedLayer.fontFamily || "Inter"} onValueChange={v => { loadGoogleFont(v); updateLayer(selectedLayer.id, { fontFamily: v }); }}>
                          <SelectTrigger className="h-8 text-xs bg-[hsl(var(--sidebar-background))] mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GOOGLE_FONTS.map(f => (
                              <SelectItem key={f} value={f}>
                                <span style={{ fontFamily: f }}>{f}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[hsl(var(--sidebar-muted))]">Schriftgröße: {selectedLayer.fontSize}px</label>
                        <Slider value={[selectedLayer.fontSize || 24]} onValueChange={v => updateLayer(selectedLayer.id, { fontSize: v[0] })} min={8} max={72} step={1} className="mt-1" />
                      </div>
                      <div className="flex gap-1">
                        <Button variant={selectedLayer.fontWeight === "bold" ? "default" : "outline"} size="sm" className="text-xs h-7 flex-1"
                          onClick={() => updateLayer(selectedLayer.id, { fontWeight: selectedLayer.fontWeight === "bold" ? "normal" : "bold" })}>
                          <strong>B</strong>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
