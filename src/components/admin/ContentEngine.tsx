import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  TrendingUp, Sparkles, Image as ImageIcon, Send, Loader2, FileText,
  Eye, Trash2, AlertTriangle, MessageSquare, Hash, Download, CloudUpload, Paintbrush
} from "lucide-react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const DRIVE_SCOPES = "https://www.googleapis.com/auth/drive.file";

const IMAGE_PRESETS = [
  { id: "technical", label: "📐 Technisches Diagramm", prompt: "Clean technical diagram with labeled parts, white background, precise line art, professional veterinary/farrier style: " },
  { id: "social", label: "📱 Social Media Visual", prompt: "Eye-catching social media graphic, vibrant colors, modern design, Instagram-ready, equestrian branding: " },
  { id: "realistic", label: "📸 Realistisch", prompt: "" },
  { id: "infographic", label: "📊 Infografik", prompt: "Clean infographic style with icons and data visualization: " },
];

interface TrendTopic {
  category: string;
  count: number;
  snippets: string[];
}

interface BlogDraft {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  status: string;
  created_at: string;
  published_at: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  "hoof-care": "🔨 Hufpflege",
  health: "🩺 Gesundheit",
  feeding: "🌾 Fütterung",
  "stable-management": "🏠 Stallbetrieb",
  business: "💼 Business",
  content: "📱 Social Media",
  training: "🏇 Training",
  general: "📝 Allgemein",
  "hoof-rehab": "🦶 Huf-Reha",
  "equine-nutrition": "🥕 Pferdeernährung",
  "stable-tech": "⚙️ Stall-Technik",
  "ethical-debate": "⚖️ Ethik-Debatte",
  "barefoot-vs-shoeing": "🔨 Barhuf vs. Beschlag",
  "feed-controversy": "🌿 Futter-Kontroverse",
  "welfare-scandals": "🛡️ Tierwohl-Aufklärung",
};

export default function ContentEngine() {
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [openClaw, setOpenClaw] = useState<TrendTopic[]>([]);
  const [ethicalConflicts, setEthicalConflicts] = useState<TrendTopic[]>([]);
  const [drafts, setDrafts] = useState<BlogDraft[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [generatingHook, setGeneratingHook] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [hookPreview, setHookPreview] = useState<Record<string, string>>({});

  // Image Generator state
  const [imagePrompt, setImagePrompt] = useState("");
  const [imagePreset, setImagePreset] = useState("social");
  const [generatingImg, setGeneratingImg] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [savingToDrive, setSavingToDrive] = useState(false);

  useEffect(() => { fetchDrafts(); }, []);

  const fetchDrafts = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, content, excerpt, image_url, category, status, created_at, published_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setDrafts(data as BlogDraft[]);
  };

  const fetchTrends = async () => {
    setLoadingTrends(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog", {
        body: { action: "trending" },
      });
      if (error) throw error;
      setTrends(data.trends || []);
      setOpenClaw(data.openClaw || []);
      setEthicalConflicts(data.ethicalConflicts || []);
    } catch (err: any) {
      toast.error(err.message || "Trends konnten nicht geladen werden");
    }
    setLoadingTrends(false);
  };

  const generateDraft = async () => {
    if (!selectedTopic.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog", {
        body: { action: "generate", topic: selectedTopic, category: selectedCategory },
      });
      if (error) throw error;
      toast.success(`Draft erstellt: "${data.post.title}"`);
      setSelectedTopic("");
      setPreviewContent(data.content);
      fetchDrafts();
    } catch (err: any) {
      toast.error(err.message || "Generierung fehlgeschlagen");
    }
    setGenerating(false);
  };

  const generateImage = async (blogId: string, title: string) => {
    setGeneratingImage(blogId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog", {
        body: { action: "generate_image", topic: title, blog_id: blogId },
      });
      if (error) throw error;
      toast.success("Bild generiert und gespeichert!");
      fetchDrafts();
    } catch (err: any) {
      toast.error(err.message || "Bildgenerierung fehlgeschlagen");
    }
    setGeneratingImage(null);
  };

  const generateHook = async (blogId: string, title: string) => {
    setGeneratingHook(blogId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog", {
        body: { action: "generate_hook", topic: title, blog_id: blogId },
      });
      if (error) throw error;
      setHookPreview((prev) => ({ ...prev, [blogId]: data.hooks }));
      toast.success("Social Media Hooks generiert!");
    } catch (err: any) {
      toast.error(err.message || "Hook-Generierung fehlgeschlagen");
    }
    setGeneratingHook(null);
  };

  const publishPost = async (blogId: string) => {
    setPublishing(blogId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog", {
        body: { action: "publish", blog_id: blogId },
      });
      if (error) throw error;
      toast.success("Artikel veröffentlicht! Webhook für Social Media & News Portal ausgelöst.");
      fetchDrafts();
    } catch (err: any) {
      toast.error(err.message || "Veröffentlichung fehlgeschlagen");
    }
    setPublishing(null);
  };

  const deleteDraft = async (blogId: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", blogId);
    if (error) toast.error(error.message);
    else { toast.success("Entwurf gelöscht"); fetchDrafts(); }
  };

  // ─── Image Generation ──────────────────────────────────────────
  const generateImageFromPrompt = async () => {
    if (!imagePrompt.trim()) return;
    setGeneratingImg(true);
    setGeneratedImageUrl(null);
    try {
      const preset = IMAGE_PRESETS.find((p) => p.id === imagePreset);
      const fullPrompt = (preset?.prompt || "") + imagePrompt;

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { action: "generate_image", prompt: fullPrompt },
      });
      if (error) throw error;
      if (data.image_url) {
        setGeneratedImageUrl(data.image_url);
        toast.success("Bild generiert!");
        // Auto-save to Google Drive
        autoSaveToDrive(data.image_url, imagePrompt);
      } else {
        toast.error("Kein Bild empfangen");
      }
    } catch (err: any) {
      toast.error(err.message || "Bildgenerierung fehlgeschlagen");
    }
    setGeneratingImg(false);
  };

  const autoSaveToDrive = async (imageDataUrl: string, promptText: string) => {
    if (!GOOGLE_CLIENT_ID) return; // skip if not configured
    setSavingToDrive(true);
    try {
      const redirectUri = window.location.origin;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(DRIVE_SCOPES)}&access_type=offline&prompt=consent`;

      const popup = window.open(authUrl, "google-auth", "width=500,height=600");
      if (!popup) { toast.error("Popup blockiert"); setSavingToDrive(false); return; }

      const code = await new Promise<string>((resolve, reject) => {
        const interval = setInterval(() => {
          try {
            if (popup.closed) { clearInterval(interval); reject(new Error("Popup geschlossen")); return; }
            const url = popup.location.href;
            if (url.includes("code=")) {
              const params = new URLSearchParams(new URL(url).search);
              const c = params.get("code");
              popup.close();
              clearInterval(interval);
              if (c) resolve(c); else reject(new Error("Kein Code"));
            }
          } catch { /* cross-origin, ignore */ }
        }, 500);
      });

      const { data: tokenData, error: tokenErr } = await supabase.functions.invoke("export-to-drive", {
        body: { action: "exchange_code", code, redirect_uri: redirectUri },
      });
      if (tokenErr) throw tokenErr;

      const fileName = `HufiAi_Image_${imagePreset}_${Date.now()}.png`;
      const { data: uploadData, error: uploadErr } = await supabase.functions.invoke("export-to-drive", {
        body: {
          action: "upload",
          access_token: tokenData.access_token,
          content: imageDataUrl,
          file_name: fileName,
        },
      });
      if (uploadErr) throw uploadErr;

      toast.success("Bild in Google Drive gespeichert!", {
        action: { label: "Öffnen", onClick: () => window.open(uploadData.web_view_link, "_blank") },
      });
    } catch (err: any) {
      console.error("Drive auto-save error:", err);
      // Silent fail for auto-save – image is still generated
      toast.info("Bild generiert, Drive-Export übersprungen");
    }
    setSavingToDrive(false);
  };

  const downloadGeneratedImage = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement("a");
    a.href = generatedImageUrl;
    a.download = `hufiai-${imagePreset}-${Date.now()}.png`;
    a.click();
  };

  const TopicButton = ({ t, dashed }: { t: TrendTopic; dashed?: boolean }) => (
    <button
      key={t.category}
      onClick={() => {
        setSelectedCategory(t.category);
        setSelectedTopic(t.snippets[0] || t.category);
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${dashed ? "border-dashed" : ""} border-border hover:border-primary/50 hover:bg-accent transition-all text-sm text-left`}
    >
      <span>{CATEGORY_LABELS[t.category] || t.category}</span>
      <Badge variant={dashed ? "outline" : "secondary"} className="text-xs">{t.count}×</Badge>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-primary" /> Trend-Radar
          </CardTitle>
          <Button size="sm" variant="outline" onClick={fetchTrends} disabled={loadingTrends}>
            {loadingTrends ? <Loader2 className="w-4 h-4 animate-spin" /> : "Trends laden"}
          </Button>
        </CardHeader>
        <CardContent>
          {trends.length === 0 && openClaw.length === 0 && ethicalConflicts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Klicke "Trends laden" um aktuelle Themen zu analysieren.</p>
          ) : (
            <div className="space-y-5">
              {/* Ethical Conflicts - prioritized */}
              {ethicalConflicts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Ethische Konflikthemen (Priorität)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ethicalConflicts.map((t) => <TopicButton key={t.category} t={t} />)}
                  </div>
                </div>
              )}
              {trends.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">📊 HufiAi Chat-Trends</p>
                  <div className="flex flex-wrap gap-2">
                    {trends.map((t) => <TopicButton key={t.category} t={t} />)}
                  </div>
                </div>
              )}
              {openClaw.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">🌐 OpenClaw API (Mock)</p>
                  <div className="flex flex-wrap gap-2">
                    {openClaw.map((t) => <TopicButton key={t.category} t={t} dashed />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Article Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-primary" /> Artikel generieren (Solution-Provider)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            placeholder="Thema eingeben oder aus Trends wählen…"
          />
          <div className="flex gap-2 items-center flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
            >
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <Button onClick={generateDraft} disabled={generating || !selectedTopic.trim()}>
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Draft
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            ⚖️ Alle generierten Inhalte werden als <strong>Draft</strong> gespeichert. Du entscheidest über die finale Veröffentlichung.
          </p>
        </CardContent>
      </Card>

      {/* Blog Drafts & Published */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-primary" /> Blog-Beiträge ({drafts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Beiträge vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {drafts.map((d) => (
                <div key={d.id} className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{d.title}</p>
                        <Badge variant={d.status === "published" ? "default" : "secondary"} className="text-xs">
                          {d.status === "published" ? "✅ Veröffentlicht" : "📝 Entwurf"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {d.category && (CATEGORY_LABELS[d.category] || d.category)} · {new Date(d.created_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    {d.image_url && (
                      <img src={d.image_url} alt="" className="w-16 h-10 object-cover rounded-lg" />
                    )}
                  </div>
                  {d.excerpt && <p className="text-xs text-muted-foreground line-clamp-2">{d.excerpt}</p>}
                  <div className="flex flex-wrap gap-2">
                    {!d.image_url && (
                      <Button size="sm" variant="outline" onClick={() => generateImage(d.id, d.title)} disabled={generatingImage === d.id}>
                        {generatingImage === d.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ImageIcon className="w-3 h-3 mr-1" />}
                        Bild generieren
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => generateHook(d.id, d.title)} disabled={generatingHook === d.id}>
                      {generatingHook === d.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Hash className="w-3 h-3 mr-1" />}
                      Social Hooks
                    </Button>
                    {d.status === "draft" && (
                      <Button size="sm" onClick={() => publishPost(d.id)} disabled={publishing === d.id}>
                        {publishing === d.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                        Final Release
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setPreviewContent(previewContent === d.content ? null : d.content)}>
                      <Eye className="w-3 h-3 mr-1" /> Vorschau
                    </Button>
                    {d.status === "draft" && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteDraft(d.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Löschen
                      </Button>
                    )}
                  </div>
                  {/* Hook preview */}
                  {hookPreview[d.id] && (
                    <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Social Media Hooks
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{hookPreview[d.id]}</p>
                    </div>
                  )}
                  {previewContent === d.content && (
                    <div className="mt-3 p-4 rounded-lg bg-background border border-border text-sm prose prose-sm max-w-none whitespace-pre-wrap">
                      {d.content.slice(0, 2000)}{d.content.length > 2000 ? "…" : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Image Generator ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Paintbrush className="w-5 h-5 text-primary" /> Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generiere Bilder für Blog-Header, Social Posts und technische Dokumentation. Bilder werden automatisch in Google Drive gespeichert.
          </p>

          {/* Preset Selection */}
          <div className="flex gap-2 flex-wrap">
            {IMAGE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setImagePreset(p.id)}
                className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                  imagePreset === p.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder={
              imagePreset === "technical"
                ? "z.B. 'Querschnitt eines Pferdehufes mit beschrifteten Strukturen (Strahl, Sohle, Tragrand)'…"
                : imagePreset === "social"
                ? "z.B. 'Hufschmied bei der Arbeit, warmes Licht, Instagram-Story Format'…"
                : "Beschreibe das gewünschte Bild…"
            }
            rows={3}
          />

          <Button onClick={generateImageFromPrompt} disabled={generatingImg || !imagePrompt.trim()} className="w-full">
            {generatingImg ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {generatingImg ? "Generiere…" : "Bild generieren"}
          </Button>

          {generatedImageUrl && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
                <img src={generatedImageUrl} alt="Generated" className="w-full max-h-[500px] object-contain" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadGeneratedImage} className="flex-1">
                  <Download className="w-4 h-4 mr-2" /> Herunterladen
                </Button>
                {GOOGLE_CLIENT_ID && (
                  <Button variant="outline" onClick={() => autoSaveToDrive(generatedImageUrl, imagePrompt)} disabled={savingToDrive} className="flex-1">
                    {savingToDrive ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CloudUpload className="w-4 h-4 mr-2" />}
                    {savingToDrive ? "Speichere…" : "In Drive speichern"}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Modell: Gemini Image</Badge>
            {savingToDrive && <Badge variant="secondary" className="text-xs animate-pulse">Drive-Export läuft…</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
