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
  CheckCircle, Eye, Edit, Trash2
} from "lucide-react";

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
};

export default function ContentEngine() {
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [openClaw, setOpenClaw] = useState<TrendTopic[]>([]);
  const [drafts, setDrafts] = useState<BlogDraft[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-primary" /> Trending Topics
          </CardTitle>
          <Button size="sm" variant="outline" onClick={fetchTrends} disabled={loadingTrends}>
            {loadingTrends ? <Loader2 className="w-4 h-4 animate-spin" /> : "Trends laden"}
          </Button>
        </CardHeader>
        <CardContent>
          {trends.length === 0 && openClaw.length === 0 ? (
            <p className="text-sm text-muted-foreground">Klicke "Trends laden" um aktuelle Themen zu analysieren.</p>
          ) : (
            <div className="space-y-4">
              {trends.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">📊 HufiAi Chat-Trends</p>
                  <div className="flex flex-wrap gap-2">
                    {trends.map((t) => (
                      <button
                        key={t.category}
                        onClick={() => {
                          setSelectedCategory(t.category);
                          setSelectedTopic(t.snippets[0] || t.category);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all text-sm"
                      >
                        <span>{CATEGORY_LABELS[t.category] || t.category}</span>
                        <Badge variant="secondary" className="text-xs">{t.count}×</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {openClaw.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">🌐 OpenClaw API (Mock)</p>
                  <div className="flex flex-wrap gap-2">
                    {openClaw.map((t) => (
                      <button
                        key={t.category}
                        onClick={() => {
                          setSelectedCategory(t.category);
                          setSelectedTopic(t.snippets[0] || t.category);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-accent transition-all text-sm"
                      >
                        <span>{CATEGORY_LABELS[t.category] || t.category}</span>
                        <Badge variant="outline" className="text-xs">{t.count}×</Badge>
                      </button>
                    ))}
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
            <Sparkles className="w-5 h-5 text-primary" /> Artikel generieren
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            placeholder="Thema eingeben oder aus Trends wählen…"
          />
          <div className="flex gap-2 items-center">
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateImage(d.id, d.title)}
                        disabled={generatingImage === d.id}
                      >
                        {generatingImage === d.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ImageIcon className="w-3 h-3 mr-1" />}
                        Bild generieren
                      </Button>
                    )}
                    {d.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => publishPost(d.id)}
                        disabled={publishing === d.id}
                      >
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
    </div>
  );
}
