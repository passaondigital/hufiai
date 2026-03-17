import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, Loader2, BookOpen, TrendingUp, Palette, Wand2, Heart, Star,
  BarChart3, MessageCircle, PenTool
} from "lucide-react";
import { toast } from "sonner";
import PromptCard, { type PromptItem } from "@/components/prompts/PromptCard";
import PromptGenerator from "@/components/prompts/PromptGenerator";
import PromptEditor from "@/components/prompts/PromptEditor";

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

const DIFFICULTY_FILTERS = [
  { key: "all", label: "Alle Level" },
  { key: "beginner", label: "Einfach" },
  { key: "intermediate", label: "Mittel" },
  { key: "advanced", label: "Fortgeschritten" },
];

export default function PromptLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);

  useEffect(() => { fetchPrompts(); }, [user]);

  const fetchPrompts = async () => {
    if (!user) return;
    setLoading(true);
    const { data: promptData, error } = await supabase
      .from("prompt_library" as any)
      .select("*")
      .order("created_at", { ascending: false });

    const { data: favData } = await supabase
      .from("user_favorite_prompts" as any)
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      toast.error("Prompts konnten nicht geladen werden");
      setLoading(false);
      return;
    }

    const favMap = new Map<string, any>();
    (favData || []).forEach((f: any) => favMap.set(f.prompt_id, f));

    setPrompts(((promptData as any[]) || []).map((p: any) => {
      const fav = favMap.get(p.id);
      return { ...p, use_cases: p.use_cases || [], is_favorite: !!fav, favorite_id: fav?.id || null, custom_name: fav?.custom_name || null };
    }));
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = prompts;
    if (category === "favoriten") result = result.filter(p => p.is_favorite);
    else if (category === "eigene") result = result.filter(p => p.created_by === user?.id);
    else if (category !== "all") result = result.filter(p => p.category === category);
    if (difficulty !== "all") result = result.filter(p => p.difficulty === difficulty);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) || p.use_cases?.some(u => u.toLowerCase().includes(q))
      );
    }
    return result;
  }, [prompts, category, difficulty, search, user]);

  const toggleFavorite = async (prompt: PromptItem) => {
    if (!user) return;
    if (prompt.is_favorite && prompt.favorite_id) {
      await supabase.from("user_favorite_prompts" as any).delete().eq("id", prompt.favorite_id);
      setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, is_favorite: false, favorite_id: null } : p));
      toast.success("Aus Favoriten entfernt");
    } else {
      const { data, error } = await supabase.from("user_favorite_prompts" as any)
        .insert({ user_id: user.id, prompt_id: prompt.id } as any).select().single();
      if (!error && data) {
        setPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, is_favorite: true, favorite_id: (data as any).id } : p));
        toast.success("Zu Favoriten hinzugefügt");
      }
    }
  };

  const usePrompt = async (prompt: PromptItem) => {
    if (!user) return;
    await supabase.from("prompt_usage_logs" as any).insert({ user_id: user.id, prompt_id: prompt.id } as any);
    navigate("/", { state: { prefillPrompt: prompt.content } });
  };

  const handleSavePrompt = async (data: { title: string; content: string; category: string; description: string; difficulty: string }) => {
    if (!user) return;
    if (editingPrompt) {
      const { error } = await supabase.from("prompt_library" as any)
        .update({ title: data.title, content: data.content, category: data.category, description: data.description || null, difficulty: data.difficulty } as any)
        .eq("id", editingPrompt.id);
      if (error) { toast.error("Speichern fehlgeschlagen"); return; }
      toast.success("Prompt aktualisiert");
    } else {
      const { error } = await supabase.from("prompt_library" as any).insert({
        created_by: user.id, title: data.title, content: data.content,
        category: data.category, description: data.description || null,
        difficulty: data.difficulty, is_system: false, use_cases: [],
      } as any);
      if (error) { toast.error("Speichern fehlgeschlagen"); return; }
      toast.success("Prompt erstellt");
    }
    setEditingPrompt(null);
    fetchPrompts();
  };

  const deletePrompt = async (id: string) => {
    const { error } = await supabase.from("prompt_library" as any).delete().eq("id", id);
    if (!error) { toast.success("Prompt gelöscht"); setPrompts(prev => prev.filter(p => p.id !== id)); }
  };

  const handleGeneratorSaveNew = (title: string, content: string, _explanation: string) => {
    setEditingPrompt(null);
    // Pre-fill editor with generated content
    setEditorOpen(true);
    // We need a slight delay so the editor mounts with fresh props
    setTimeout(() => {
      setEditingPrompt({ id: "", title, content, category: "kreativ", description: _explanation.slice(0, 200), use_cases: [], difficulty: "beginner", is_system: false, created_by: user?.id || null });
      setEditorOpen(true);
    }, 50);
  };

  const handleGeneratorSaveFavorite = async (title: string, content: string, explanation: string) => {
    if (!user) return;
    const { data, error } = await supabase.from("prompt_library" as any).insert({
      created_by: user.id, title, content, category: "kreativ",
      description: explanation.slice(0, 200) || null, is_system: false, difficulty: "beginner", use_cases: [],
    } as any).select().single();
    if (error || !data) { toast.error("Speichern fehlgeschlagen"); return; }
    await supabase.from("user_favorite_prompts" as any).insert({ user_id: user.id, prompt_id: (data as any).id } as any);
    toast.success("Als Favorit gespeichert!");
    fetchPrompts();
  };

  const openEdit = (prompt: PromptItem) => {
    setEditingPrompt(prompt);
    setEditorOpen(true);
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
              <Button variant="outline" onClick={() => setGeneratorOpen(true)} className="gap-2">
                <Wand2 className="w-4 h-4" /> Generator
              </Button>
              <Button onClick={() => { setEditingPrompt(null); setEditorOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Eigener Prompt
              </Button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Prompts durchsuchen..." className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setCategory(cat.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    category === cat.key
                      ? `${cat.color} border-current/20 ring-1 ring-current/10`
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}>
                  {cat.icon} {cat.label}
                  {cat.key === "favoriten" && <span className="text-[10px] opacity-70">({favCount})</span>}
                </button>
              ))}
            </div>
            {/* Difficulty filter */}
            <div className="flex gap-2">
              {DIFFICULTY_FILTERS.map(d => (
                <button key={d.key} onClick={() => setDifficulty(d.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    difficulty === d.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}>
                  {d.label}
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
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  userId={user?.id}
                  onUse={usePrompt}
                  onToggleFavorite={toggleFavorite}
                  onEdit={openEdit}
                  onDelete={deletePrompt}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generator */}
      <PromptGenerator
        open={generatorOpen}
        onOpenChange={setGeneratorOpen}
        onSaveAsNew={handleGeneratorSaveNew}
        onSaveAsFavorite={handleGeneratorSaveFavorite}
      />

      {/* Editor (Create / Edit) */}
      <PromptEditor
        key={editingPrompt?.id || "new"}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialTitle={editingPrompt?.title || ""}
        initialContent={editingPrompt?.content || ""}
        initialCategory={editingPrompt?.category || "business"}
        initialDescription={editingPrompt?.description || ""}
        initialDifficulty={editingPrompt?.difficulty || "beginner"}
        isEditing={!!editingPrompt?.id}
        onSave={handleSavePrompt}
      />
    </AppLayout>
  );
}
