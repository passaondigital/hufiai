import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Download, Palette, Type, BarChart3, Crown, Copy } from "lucide-react";
import { toast } from "sonner";

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

export default function GraphicsDesign() {
  const [activeTab, setActiveTab] = useState("logo");
  const [prompt, setPrompt] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandColor, setBrandColor] = useState("#F47B20");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const generate = async (basePrompt: string) => {
    setGenerating(true);
    setResult(null);
    try {
      const fullPrompt = [
        basePrompt,
        prompt ? `Content: ${prompt}` : "",
        brandName ? `Brand: "${brandName}"` : "",
        `Brand color: ${brandColor}. High quality, professional graphic design output. On a clean background.`,
      ].filter(Boolean).join(". ");

      const { data, error } = await supabase.functions.invoke("generate-image-ai", {
        body: { prompt: fullPrompt, style: "flat", size: "1080x1080", model: "google/gemini-3-pro-image-preview" },
      });
      if (error) throw error;
      if (data?.image_url) {
        setResult(data.image_url);
        toast.success("Grafik generiert! 🎨");
      }
    } catch (err: any) {
      toast.error(err.message || "Generierung fehlgeschlagen");
    } finally {
      setGenerating(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `hufiai-${activeTab}-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
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
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[hsl(var(--sidebar-muted))]">Brandfarbe:</label>
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  <span className="text-xs font-mono">{brandColor}</span>
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
                    <label className="text-xs font-medium mb-1 block">Markenname</label>
                    <Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Dein Markenname" className="bg-[hsl(var(--sidebar-background))]" />
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: brandColor }} />
                    <div>
                      <p className="font-bold text-sm">{brandName || "Deine Marke"}</p>
                      <p className="text-xs text-[hsl(var(--sidebar-muted))]">Brandfarbe wird automatisch auf alle Grafiken angewendet</p>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">💡 Tipp: Brandfarbe wird bei Logo, Templates und Infografiken automatisch angewendet</Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right: Preview */}
      <div>
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
                  <img src={result} alt="Generated" className="w-full object-contain max-h-[400px]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={downloadResult} className="text-xs gap-1">
                    <Download className="w-3 h-3" /> Download
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
                  <p className="text-xs">Wähle einen Typ und generiere deine Grafik</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
