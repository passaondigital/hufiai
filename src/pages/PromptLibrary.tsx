import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Star, StarOff, Plus, Sparkles, Copy, Play, Loader2, Filter,
  BookOpen, Stethoscope, TrendingUp, Home, Scale, Palette, Wand2, Heart, Trash2, Edit3
} from "lucide-react";
import { toast } from "sonner";

interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  category: string;
  description: string | null;
  is_system: boolean;
  is_favorite: boolean;
  usage_count: number;
  tags: string[];
  user_id: string | null;
}

const CATEGORIES: { key: string; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "all", label: "Alle", icon: <BookOpen className="w-4 h-4" />, color: "bg-muted" },
  { key: "hufpflege", label: "Hufpflege", icon: <Sparkles className="w-4 h-4" />, color: "bg-primary/10 text-primary" },
  { key: "gesundheit", label: "Gesundheit", icon: <Stethoscope className="w-4 h-4" />, color: "bg-emerald-500/10 text-emerald-600" },
  { key: "business", label: "Business", icon: <TrendingUp className="w-4 h-4" />, color: "bg-blue-500/10 text-blue-600" },
  { key: "stall", label: "Stall", icon: <Home className="w-4 h-4" />, color: "bg-amber-500/10 text-amber-600" },
  { key: "recht", label: "Recht", icon: <Scale className="w-4 h-4" />, color: "bg-purple-500/10 text-purple-600" },
  { key: "kreativ", label: "Kreativ", icon: <Palette className="w-4 h-4" />, color: "bg-pink-500/10 text-pink-600" },
  { key: "favoriten", label: "Favoriten", icon: <Star className="w-4 h-4" />, color: "bg-yellow-500/10 text-yellow-600" },
  { key: "eigene", label: "Meine", icon: <Heart className="w-4 h-4" />, color: "bg-red-500/10 text-red-600" },
];

export default function PromptLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);

  // Create/Edit form
  const [formTitle, setFormTitle] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [formDescription, setFormDescription] = useState("");

  // Generator
  const [generatorInput, setGeneratorInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  useEffect(() => {
    fetchPrompts();
  }, [user]);

  const fetchPrompts = async () => {
    if (!user) return;
    setLoading(true);
    // Fetch system prompts and user's own prompts
    const { data, error } = await supabase
      .from("prompt_templates")
      .select("*")
      .or(`is_system.eq.true,user_id.eq.${user.id}`)
      .order("usage_count", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Prompts konnten nicht geladen werden");
    } else {
      setPrompts((data as any[]) || []);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = prompts;
    if (category === "favoriten") {
      result = result.filter(p => p.is_favorite);
    } else if (category === "eigene") {
      result = result.filter(p => p.user_id === user?.id);
    } else if (category !== "all") {
      result = result.filter(p => p.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [prompts, category, search, user]);

  const toggleFavorite = async (prompt: PromptTemplate) => {
    if (prompt.is_system && !prompt.user_id) {
      // Clone system prompt as user's favorite
      const { error } = await supabase.from("prompt_templates").insert({
        user_id: user!.id,
        title: prompt.title,
        prompt: prompt.prompt,
        category: prompt.category,
        description: prompt.description,
        is_system: false,
        is_favorite: true,
        tags: prompt.tags,
      } as any);
      if (!error) {
        toast.success("Zu Favoriten hinzugefügt");
        fetchPrompts();
      }
    } else {
      const { error } = await supabase
        .from("prompt_templates")
        .update({ is_favorite: !prompt.is_favorite } as any)
        .eq("id", prompt.id);
      if (!error) {
        setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, is_favorite: !p.is_favorite } : p));
      }
    }
  };

  const usePrompt = async (prompt: PromptTemplate) => {
    // Increment usage count
    if (prompt.user_id === user?.id) {
      await supabase.from("prompt_templates").update({ usage_count: prompt.usage_count + 1 } as any).eq("id", prompt.id);
    }
    // Navigate to chat with prompt pre-filled
    navigate("/", { state: { prefillPrompt: prompt.prompt } });
  };

  const copyPrompt = (prompt: PromptTemplate) => {
    navigator.clipboard.writeText(prompt.prompt);
    toast.success("Prompt kopiert!");
  };

  const savePrompt = async () => {
    if (!formTitle.trim() || !formPrompt.trim() || !user) return;

    if (editingPrompt) {
      const { error } = await supabase.from("prompt_templates")
        .update({ title: formTitle, prompt: formPrompt, category: formCategory, description: formDescription || null } as any)
        .eq("id", editingPrompt.id);
      if (error) { toast.error("Speichern fehlgeschlagen"); return; }
      toast.success("Prompt aktualisiert");
    } else {
      const { error } = await supabase.from("prompt_templates").insert({
        user_id: user.id,
        title: formTitle,
        prompt: formPrompt,
        category: formCategory,
        description: formDescription || null,
        is_system: false,
        tags: [],
      } as any);
      if (error) { toast.error("Speichern fehlgeschlagen"); return; }
      toast.success("Prompt erstellt");
    }
    setCreateOpen(false);
    setEditingPrompt(null);
    resetForm();
    fetchPrompts();
  };

  const deletePrompt = async (id: string) => {
    const { error } = await supabase.from("prompt_templates").delete().eq("id", id);
    if (!error) {
      toast.success("Prompt gelöscht");
      setPrompts(prev => prev.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormPrompt("");
    setFormCategory("general");
    setFormDescription("");
  };

  const openEdit = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    setFormTitle(prompt.title);
    setFormPrompt(prompt.prompt);
    setFormCategory(prompt.category);
    setFormDescription(prompt.description || "");
    setCreateOpen(true);
  };

  const generatePrompt = async () => {
    if (!generatorInput.trim()) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Nicht eingeloggt");

      const res = await supabase.functions.invoke("generate-content", {
        body: {
          action: "generate_prompt",
          idea: generatorInput,
        },
      });

      if (res.error) throw res.error;
      setGeneratedPrompt(res.data?.prompt || res.data?.content || "Prompt konnte nicht generiert werden.");
    } catch (err: any) {
      toast.error(err.message || "Generator fehlgeschlagen");
    } finally {
      setGenerating(false);
    }
  };

  const useGeneratedPrompt = () => {
    setFormPrompt(generatedPrompt);
    setGeneratorOpen(false);
    setCreateOpen(true);
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                Prompt-Bibliothek
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {prompts.length} Prompts · Finde den perfekten Prompt für jede Situation
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setGeneratorOpen(true)} className="gap-2">
                <Wand2 className="w-4 h-4" />
                Generator
              </Button>
              <Button onClick={() => { resetForm(); setEditingPrompt(null); setCreateOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" />
                Eigener Prompt
              </Button>
            </div>
          </div>

          {/* Search + Categories */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Prompts durchsuchen..."
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    category === cat.key
                      ? `${cat.color} border-current/20 ring-1 ring-current/10`
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                  {cat.key === "favoriten" && (
                    <span className="text-[10px] opacity-70">
                      ({prompts.filter(p => p.is_favorite).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Prompts grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Keine Prompts gefunden</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(prompt => (
                <Card
                  key={prompt.id}
                  className="p-4 hover:border-primary/30 transition-all group cursor-pointer"
                  onClick={() => usePrompt(prompt)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-tight">{prompt.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); toggleFavorite(prompt); }}
                        className="p-1 rounded-lg hover:bg-accent transition-colors"
                      >
                        {prompt.is_favorite ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>
                  </div>
                  {prompt.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{prompt.description}</p>
                  )}
                  <p className="text-xs text-foreground/70 line-clamp-3 mb-3 font-mono bg-muted/50 rounded-lg p-2">
                    {prompt.prompt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {CATEGORIES.find(c => c.key === prompt.category)?.label || prompt.category}
                      </Badge>
                      {prompt.is_system && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">System</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); copyPrompt(prompt); }}
                        className="p-1.5 rounded-lg hover:bg-accent"
                        title="Kopieren"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {prompt.user_id === user?.id && (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); openEdit(prompt); }}
                            className="p-1.5 rounded-lg hover:bg-accent"
                            title="Bearbeiten"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); deletePrompt(prompt.id); }}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                            title="Löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) { setEditingPrompt(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? "Prompt bearbeiten" : "Neuen Prompt erstellen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="z.B. Huf-Befund analysieren" className="mt-1" />
            </div>
            <div>
              <Label>Prompt</Label>
              <Textarea value={formPrompt} onChange={e => setFormPrompt(e.target.value)} placeholder="Dein Prompt-Text..." className="mt-1 min-h-[120px]" />
            </div>
            <div>
              <Label>Kategorie</Label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CATEGORIES.filter(c => !["all", "favoriten", "eigene"].includes(c.key)).map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
                <option value="general">Allgemein</option>
              </select>
            </div>
            <div>
              <Label>Beschreibung (optional)</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Kurze Beschreibung" className="mt-1" />
            </div>
            <Button onClick={savePrompt} disabled={!formTitle.trim() || !formPrompt.trim()} className="w-full">
              {editingPrompt ? "Speichern" : "Prompt erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generator Dialog */}
      <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              Prompt-Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Was möchtest du erreichen?</Label>
              <Textarea
                value={generatorInput}
                onChange={e => setGeneratorInput(e.target.value)}
                placeholder="z.B. Ich will einen Prompt der mir hilft, die Hufqualität meines Pferdes zu beurteilen..."
                className="mt-1 min-h-[100px]"
              />
            </div>
            <Button onClick={generatePrompt} disabled={generating || !generatorInput.trim()} className="w-full gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "Generiere..." : "Prompt generieren"}
            </Button>
            {generatedPrompt && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted border border-border">
                  <p className="text-xs font-medium mb-1 text-muted-foreground">Generierter Prompt:</p>
                  <p className="text-sm whitespace-pre-wrap">{generatedPrompt}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(generatedPrompt); toast.success("Kopiert!"); }} className="flex-1 gap-2">
                    <Copy className="w-4 h-4" /> Kopieren
                  </Button>
                  <Button onClick={useGeneratedPrompt} className="flex-1 gap-2">
                    <Plus className="w-4 h-4" /> Als Prompt speichern
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
