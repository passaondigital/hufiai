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
  Search, Star, StarOff, Plus, Sparkles, Copy, Loader2,
  BookOpen, TrendingUp, Palette, Wand2, Heart, Trash2, Edit3,
  BarChart3, MessageCircle, PenTool, ArrowRight, Check
} from "lucide-react";
import { toast } from "sonner";

interface PromptItem {
  id: string;
  title: string;
  content: string;
  category: string;
  description: string | null;
  use_cases: string[];
  difficulty: string;
  is_system: boolean;
  created_by: string | null;
  is_favorite?: boolean;       // joined from user_favorite_prompts
  favorite_id?: string | null;  // id in user_favorite_prompts
  custom_name?: string | null;
}

const CATEGORIES: { key: string; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "all", label: "Alle", icon: <BookOpen className="w-4 h-4" />, color: "bg-muted" },
  { key: "business", label: "Business", icon: <TrendingUp className="w-4 h-4" />, color: "bg-blue-500/10 text-blue-600" },
  { key: "content", label: "Content", icon: <PenTool className="w-4 h-4" />, color: "bg-pink-500/10 text-pink-600" },
  { key: "analyse", label: "Analyse", icon: <BarChart3 className="w-4 h-4" />, color: "bg-emerald-500/10 text-emerald-600" },
  { key: "coaching", label: "Coaching", icon: <MessageCircle className="w-4 h-4" />, color: "bg-amber-500/10 text-amber-600" },
  { key: "kreativ", label: "Kreativ", icon: <Palette className="w-4 h-4" />, color: "bg-purple-500/10 text-purple-600" },
  { key: "favoriten", label: "Favoriten", icon: <Star className="w-4 h-4" />, color: "bg-yellow-500/10 text-yellow-600" },
  { key: "eigene", label: "Meine", icon: <Heart className="w-4 h-4" />, color: "bg-red-500/10 text-red-600" },
];

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Einfach",
  intermediate: "Mittel",
  advanced: "Fortgeschritten",
};

export default function PromptLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);

  // Create/Edit form
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("business");
  const [formDescription, setFormDescription] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("beginner");

  // Generator state
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [genStep, setGenStep] = useState<1 | 2 | 3>(1);
  const [genGoal, setGenGoal] = useState("");
  const [genContext, setGenContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generatedExplanation, setGeneratedExplanation] = useState("");

  useEffect(() => { fetchPrompts(); }, [user]);

  const fetchPrompts = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch prompts from prompt_library
    const { data: promptData, error: pErr } = await supabase
      .from("prompt_library" as any)
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch user's favorites
    const { data: favData } = await supabase
      .from("user_favorite_prompts" as any)
      .select("*")
      .eq("user_id", user.id);

    if (pErr) {
      console.error(pErr);
      toast.error("Prompts konnten nicht geladen werden");
      setLoading(false);
      return;
    }

    const favMap = new Map<string, any>();
    (favData || []).forEach((f: any) => favMap.set(f.prompt_id, f));

    const merged: PromptItem[] = ((promptData as any[]) || []).map((p: any) => {
      const fav = favMap.get(p.id);
      return {
        ...p,
        use_cases: p.use_cases || [],
        is_favorite: !!fav,
        favorite_id: fav?.id || null,
        custom_name: fav?.custom_name || null,
      };
    });

    setPrompts(merged);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = prompts;
    if (category === "favoriten") {
      result = result.filter(p => p.is_favorite);
    } else if (category === "eigene") {
      result = result.filter(p => p.created_by === user?.id);
    } else if (category !== "all") {
      result = result.filter(p => p.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.use_cases?.some(u => u.toLowerCase().includes(q))
      );
    }
    return result;
  }, [prompts, category, search, user]);

  const toggleFavorite = async (prompt: PromptItem) => {
    if (!user) return;
    if (prompt.is_favorite && prompt.favorite_id) {
      // Remove favorite
      await supabase.from("user_favorite_prompts" as any).delete().eq("id", prompt.favorite_id);
      setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, is_favorite: false, favorite_id: null } : p));
      toast.success("Aus Favoriten entfernt");
    } else {
      // Add favorite
      const { data, error } = await supabase.from("user_favorite_prompts" as any).insert({
        user_id: user.id,
        prompt_id: prompt.id,
      } as any).select().single();
      if (!error && data) {
        setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, is_favorite: true, favorite_id: (data as any).id } : p));
        toast.success("Zu Favoriten hinzugefügt");
      }
    }
  };

  const usePrompt = async (prompt: PromptItem) => {
    if (!user) return;
    // Log usage
    await supabase.from("prompt_usage_logs" as any).insert({
      user_id: user.id,
      prompt_id: prompt.id,
    } as any);
    navigate("/", { state: { prefillPrompt: prompt.content } });
  };

  const copyPrompt = (prompt: PromptItem) => {
    navigator.clipboard.writeText(prompt.content);
    toast.success("Prompt kopiert!");
  };

  const savePrompt = async () => {
    if (!formTitle.trim() || !formContent.trim() || !user) return;
    if (editingPrompt) {
      const { error } = await supabase.from("prompt_library" as any)
        .update({ title: formTitle, content: formContent, category: formCategory, description: formDescription || null, difficulty: formDifficulty } as any)
        .eq("id", editingPrompt.id);
      if (error) { toast.error("Speichern fehlgeschlagen"); return; }
      toast.success("Prompt aktualisiert");
    } else {
      const { error } = await supabase.from("prompt_library" as any).insert({
        created_by: user.id, title: formTitle, content: formContent,
        category: formCategory, description: formDescription || null,
        difficulty: formDifficulty, is_system: false, use_cases: [],
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
    const { error } = await supabase.from("prompt_library" as any).delete().eq("id", id);
    if (!error) { toast.success("Prompt gelöscht"); setPrompts(prev => prev.filter(p => p.id !== id)); }
  };

  const resetForm = () => {
    setFormTitle(""); setFormContent(""); setFormCategory("business"); setFormDescription(""); setFormDifficulty("beginner");
  };

  const openEdit = (prompt: PromptItem) => {
    setEditingPrompt(prompt);
    setFormTitle(prompt.title); setFormContent(prompt.content);
    setFormCategory(prompt.category); setFormDescription(prompt.description || "");
    setFormDifficulty(prompt.difficulty || "beginner");
    setCreateOpen(true);
  };

  // ─── 3-Step Generator ─────────────────────────────────────
  const resetGenerator = () => {
    setGenStep(1); setGenGoal(""); setGenContext(""); setGeneratedPrompt(""); setGeneratedExplanation(""); setGenerating(false);
  };

  const generatePrompt = async () => {
    if (!genGoal.trim()) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Nicht eingeloggt");
      const res = await supabase.functions.invoke("generate-content", {
        body: { action: "generate_prompt", idea: genGoal, context: genContext },
      });
      if (res.error) throw res.error;
      setGeneratedPrompt(res.data?.prompt || "");
      setGeneratedExplanation(res.data?.explanation || "");
      setGenStep(3);
    } catch (err: any) {
      toast.error(err.message || "Generator fehlgeschlagen");
    } finally {
      setGenerating(false);
    }
  };

  const saveGeneratedPrompt = () => {
    setFormContent(generatedPrompt);
    setFormTitle(genGoal.slice(0, 60));
    setGeneratorOpen(false);
    resetGenerator();
    setCreateOpen(true);
  };

  const saveGeneratedAsFavorite = async () => {
    if (!user) return;
    // First save to prompt_library, then add to favorites
    const { data, error } = await supabase.from("prompt_library" as any).insert({
      created_by: user.id, title: genGoal.slice(0, 60), content: generatedPrompt,
      category: "kreativ", description: generatedExplanation?.slice(0, 200) || null,
      is_system: false, difficulty: "beginner", use_cases: [],
    } as any).select().single();
    if (error || !data) { toast.error("Speichern fehlgeschlagen"); return; }
    // Add to favorites
    await supabase.from("user_favorite_prompts" as any).insert({
      user_id: user.id, prompt_id: (data as any).id,
    } as any);
    toast.success("Als Favorit gespeichert!");
    fetchPrompts();
    setGeneratorOpen(false);
    resetGenerator();
  };

  const favCount = prompts.filter(p => p.is_favorite).length;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
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
              <Button variant="outline" onClick={() => { resetGenerator(); setGeneratorOpen(true); }} className="gap-2">
                <Wand2 className="w-4 h-4" /> Generator
              </Button>
              <Button onClick={() => { resetForm(); setEditingPrompt(null); setCreateOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Eigener Prompt
              </Button>
            </div>
          </div>

          {/* Search + Categories */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Prompts durchsuchen..." className="pl-10" />
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
                  {cat.key === "favoriten" && <span className="text-[10px] opacity-70">({favCount})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
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
                <Card key={prompt.id} className="p-4 hover:border-primary/30 transition-all group cursor-pointer" onClick={() => usePrompt(prompt)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-tight">{prompt.custom_name || prompt.title}</h3>
                    <button onClick={e => { e.stopPropagation(); toggleFavorite(prompt); }} className="p-1 rounded-lg hover:bg-accent transition-colors shrink-0">
                      {prompt.is_favorite
                        ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        : <StarOff className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>
                  </div>
                  {prompt.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{prompt.description}</p>}
                  <p className="text-xs text-foreground/70 line-clamp-3 mb-3 font-mono bg-muted/50 rounded-lg p-2">{prompt.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {CATEGORIES.find(c => c.key === prompt.category)?.label || prompt.category}
                      </Badge>
                      {prompt.difficulty && prompt.difficulty !== "beginner" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {DIFFICULTY_LABELS[prompt.difficulty] || prompt.difficulty}
                        </Badge>
                      )}
                      {prompt.is_system && <Badge variant="outline" className="text-[10px] px-1.5 py-0">System</Badge>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); copyPrompt(prompt); }} className="p-1.5 rounded-lg hover:bg-accent" title="Kopieren">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {prompt.created_by === user?.id && !prompt.is_system && (
                        <>
                          <button onClick={e => { e.stopPropagation(); openEdit(prompt); }} className="p-1.5 rounded-lg hover:bg-accent" title="Bearbeiten">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); deletePrompt(prompt.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive" title="Löschen">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Use Cases */}
                  {prompt.use_cases && prompt.use_cases.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prompt.use_cases.slice(0, 3).map((uc, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground">{uc}</span>
                      ))}
                    </div>
                  )}
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
              <Textarea value={formContent} onChange={e => setFormContent(e.target.value)} placeholder="Dein Prompt-Text..." className="mt-1 min-h-[120px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategorie</Label>
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {CATEGORIES.filter(c => !["all", "favoriten", "eigene"].includes(c.key)).map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Schwierigkeit</Label>
                <select value={formDifficulty} onChange={e => setFormDifficulty(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="beginner">Einfach</option>
                  <option value="intermediate">Mittel</option>
                  <option value="advanced">Fortgeschritten</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Beschreibung (optional)</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Kurze Beschreibung" className="mt-1" />
            </div>
            <Button onClick={savePrompt} disabled={!formTitle.trim() || !formContent.trim()} className="w-full">
              {editingPrompt ? "Speichern" : "Prompt erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3-Step Generator Dialog */}
      <Dialog open={generatorOpen} onOpenChange={v => { setGeneratorOpen(v); if (!v) resetGenerator(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" /> Prompt-Generator
            </DialogTitle>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  genStep === step ? "bg-primary text-primary-foreground" :
                  genStep > step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {genStep > step ? <Check className="w-3.5 h-3.5" /> : step}
                </div>
                <span className={`text-xs hidden sm:inline ${genStep === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {step === 1 ? "Ziel" : step === 2 ? "Kontext" : "Ergebnis"}
                </span>
                {step < 3 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>

          {genStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Was möchtest du erreichen?</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">Beschreibe dein Ziel in 1-2 Sätzen.</p>
                <Textarea value={genGoal} onChange={e => setGenGoal(e.target.value)}
                  placeholder="z.B. Ich will eine Hufanalyse durchführen und dem Besitzer die Ergebnisse verständlich erklären..."
                  className="min-h-[100px]" autoFocus />
              </div>
              <Button onClick={() => setGenStep(2)} disabled={!genGoal.trim()} className="w-full gap-2">
                Weiter <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {genStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Kontext & Details (optional)</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">Gibt es besondere Anforderungen, Zielgruppe oder Formatwünsche?</p>
                <Textarea value={genContext} onChange={e => setGenContext(e.target.value)}
                  placeholder="z.B. Für Pferdebesitzer ohne Fachkenntnisse, tabellarisch, mit Handlungsempfehlungen..."
                  className="min-h-[100px]" autoFocus />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setGenStep(1)} className="flex-1">Zurück</Button>
                <Button onClick={generatePrompt} disabled={generating} className="flex-1 gap-2">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? "Generiere..." : "Prompt generieren"}
                </Button>
              </div>
            </div>
          )}

          {genStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted border border-border">
                <p className="text-xs font-medium mb-1.5 text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Generierter Prompt
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{generatedPrompt}</p>
              </div>
              {generatedExplanation && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs font-medium mb-1 text-primary/80">💡 Warum funktioniert dieser Prompt?</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{generatedExplanation}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(generatedPrompt); toast.success("Kopiert!"); }} className="gap-1.5 text-xs">
                  <Copy className="w-3.5 h-3.5" /> Kopieren
                </Button>
                <Button variant="outline" onClick={saveGeneratedPrompt} className="gap-1.5 text-xs">
                  <Edit3 className="w-3.5 h-3.5" /> Bearbeiten
                </Button>
                <Button onClick={saveGeneratedAsFavorite} className="gap-1.5 text-xs">
                  <Star className="w-3.5 h-3.5" /> Favorit
                </Button>
              </div>
              <Button variant="ghost" onClick={resetGenerator} className="w-full text-xs text-muted-foreground">
                Neuen Prompt generieren
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
