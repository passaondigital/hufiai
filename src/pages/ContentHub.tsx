import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus, Calendar as CalendarIcon, Loader2, Sparkles, Instagram, Linkedin, FileText,
  Mic, LayoutGrid, ChevronLeft, ChevronRight, Trash2, Edit2, ArrowUpRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  status: string;
  content: string | null;
  hook: string | null;
  visual_ideas: string | null;
  hashtags: string[] | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof Instagram> = {
  reel: Instagram,
  linkedin: Linkedin,
  blog: FileText,
  podcast: Mic,
  post: LayoutGrid,
};

const TYPE_LABELS: Record<string, string> = {
  reel: "Instagram Reel",
  linkedin: "LinkedIn Post",
  blog: "Blog-Beitrag",
  podcast: "Podcast-Outline",
  post: "Social Post",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-warning/10 text-warning",
  published: "bg-green-100 text-green-700",
};

const TIER_LIMIT = 10;

export default function ContentHub() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [tier, setTier] = useState("basic");

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date());

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [form, setForm] = useState({ title: "", content_type: "post", content: "", hook: "", scheduled_at: "" });

  // AI generate dialog
  const [aiOpen, setAiOpen] = useState(false);
  const [aiIdea, setAiIdea] = useState("");
  const [aiType, setAiType] = useState("reel");

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("content_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setItems(data as ContentItem[]);
    setLoading(false);
  };

  const fetchUsage = async () => {
    if (!user) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data } = await supabase
      .from("content_usage")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      if ((data as any).month_year === currentMonth) {
        setUsageCount((data as any).posts_this_month);
      } else {
        setUsageCount(0);
      }
      setTier((data as any).tier);
    }
  };

  useEffect(() => { fetchItems(); fetchUsage(); }, [user]);

  const incrementUsage = async () => {
    if (!user) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: existing } = await supabase
      .from("content_usage")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing && (existing as any).month_year === currentMonth) {
      await supabase.from("content_usage").update({
        posts_this_month: (existing as any).posts_this_month + 1,
      }).eq("user_id", user.id);
    } else if (existing) {
      await supabase.from("content_usage").update({
        posts_this_month: 1, month_year: currentMonth,
      }).eq("user_id", user.id);
    } else {
      await supabase.from("content_usage").insert({
        user_id: user.id, posts_this_month: 1, month_year: currentMonth, tier: "basic",
      });
    }
    fetchUsage();
  };

  const canGenerate = tier === "power" || usageCount < TIER_LIMIT;

  const saveItem = async () => {
    if (!user || !form.title.trim()) return;
    try {
      if (editItem) {
        await supabase.from("content_items").update({
          title: form.title, content_type: form.content_type, content: form.content, hook: form.hook,
          scheduled_at: form.scheduled_at || null,
        }).eq("id", editItem.id);
        toast.success("Gespeichert!");
      } else {
        await supabase.from("content_items").insert({
          user_id: user.id, title: form.title, content_type: form.content_type,
          content: form.content, hook: form.hook, scheduled_at: form.scheduled_at || null,
        });
        toast.success("Content erstellt!");
      }
      setDialogOpen(false);
      setEditItem(null);
      setForm({ title: "", content_type: "post", content: "", hook: "", scheduled_at: "" });
      fetchItems();
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteItem = async (id: string) => {
    await supabase.from("content_items").delete().eq("id", id);
    toast.success("Gelöscht");
    fetchItems();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("content_items").update({ status, published_at: status === "published" ? new Date().toISOString() : null }).eq("id", id);
    fetchItems();
  };

  const openEdit = (item: ContentItem) => {
    setEditItem(item);
    setForm({
      title: item.title, content_type: item.content_type, content: item.content || "",
      hook: item.hook || "", scheduled_at: item.scheduled_at?.slice(0, 16) || "",
    });
    setDialogOpen(true);
  };

  const generateWithAI = async () => {
    if (!canGenerate) { toast.error("Limit erreicht – Upgrade auf Power User!"); return; }
    if (!aiIdea.trim()) { toast.error("Bitte gib eine Idee ein"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { idea: aiIdea, content_type: aiType, user_id: user!.id },
      });
      if (error) throw error;
      if (data?.item) {
        await incrementUsage();
        fetchItems();
        toast.success("Content generiert!");
        setAiOpen(false);
        setAiIdea("");
      }
    } catch (err: any) {
      toast.error(err.message || "Fehler bei der Generierung");
    } finally { setGenerating(false); }
  };

  // Calendar helpers
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay() + 6) % 7;
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const itemsByDate = useMemo(() => {
    const map: Record<string, ContentItem[]> = {};
    items.forEach((item) => {
      const dateStr = item.scheduled_at ? item.scheduled_at.slice(0, 10) : item.created_at.slice(0, 10);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(item);
    });
    return map;
  }, [items]);

  if (profile?.user_type !== "gewerbe") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Content Hub – Nur für Gewerbe</h2>
            <p className="text-muted-foreground text-sm">
              Der Content Hub ist exklusiv für Gewerbe-Nutzer verfügbar. Wechsle deinen Kontotyp in den Einstellungen.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto overflow-y-auto h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" /> Content Hub
            </h1>
            <p className="text-muted-foreground text-sm">Marketing-Inhalte erstellen, planen & veröffentlichen.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditItem(null); setForm({ title: "", content_type: "post", content: "", hook: "", scheduled_at: "" }); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Manuell
            </Button>
            <Button onClick={() => setAiOpen(true)}>
              <Sparkles className="w-4 h-4 mr-1" /> KI generieren
            </Button>
          </div>
        </div>

        {/* Usage bar */}
        {tier === "basic" && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{usageCount}/{TIER_LIMIT} Posts diesen Monat</span>
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Upgrade für Unlimited</span>
            </div>
            <Progress value={(usageCount / TIER_LIMIT) * 100} className="h-2" />
          </div>
        )}

        <Tabs defaultValue="cards" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cards"><LayoutGrid className="w-4 h-4 mr-1" />Übersicht</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarIcon className="w-4 h-4 mr-1" />Kalender</TabsTrigger>
          </TabsList>

          {/* Cards view */}
          <TabsContent value="cards">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Noch keine Inhalte. Erstelle deinen ersten Post!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {
                  const Icon = TYPE_ICONS[item.content_type] || LayoutGrid;
                  return (
                    <div key={item.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-shadow group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">{TYPE_LABELS[item.content_type]}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                          {item.status === "draft" ? "Entwurf" : item.status === "scheduled" ? "Geplant" : "Veröffentlicht"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{item.title}</h3>
                      {item.hook && <p className="text-xs text-primary font-medium mb-1">🎣 {item.hook}</p>}
                      {item.content && <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{item.content}</p>}
                      {item.hashtags && item.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.hashtags.slice(0, 5).map((h) => (
                            <span key={h} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">#{h}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1 pt-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openEdit(item)}>
                          <Edit2 className="w-3 h-3 mr-1" />Bearbeiten
                        </Button>
                        {item.status === "draft" && (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateStatus(item.id, "scheduled")}>
                            <CalendarIcon className="w-3 h-3 mr-1" />Planen
                          </Button>
                        )}
                        {item.status === "scheduled" && (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateStatus(item.id, "published")}>
                            <ArrowUpRight className="w-3 h-3 mr-1" />Posten
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Calendar view */}
          <TabsContent value="calendar">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="font-semibold">
                  {calMonth.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
                {calendarDays.map((day) => {
                  const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayItems = itemsByDate[dateStr] || [];
                  const isToday = dateStr === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={day} className={`min-h-[60px] p-1 rounded-lg border text-xs ${isToday ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"}`}>
                      <div className={`font-medium mb-0.5 ${isToday ? "text-primary" : ""}`}>{day}</div>
                      {dayItems.slice(0, 2).map((item) => {
                        const Icon = TYPE_ICONS[item.content_type] || LayoutGrid;
                        return (
                          <div key={item.id} className="flex items-center gap-0.5 truncate cursor-pointer" onClick={() => openEdit(item)}>
                            <Icon className="w-2.5 h-2.5 text-primary shrink-0" />
                            <span className="truncate text-[10px]">{item.title}</span>
                          </div>
                        );
                      })}
                      {dayItems.length > 2 && <span className="text-[10px] text-muted-foreground">+{dayItems.length - 2}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Manual create/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Content bearbeiten" : "Neuen Content erstellen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel</Label>
              <Input className="mt-1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="z.B. Strahlfäule erkennen" />
            </div>
            <div>
              <Label>Typ</Label>
              <Select value={form.content_type} onValueChange={(v) => setForm((f) => ({ ...f, content_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hook / Einstieg</Label>
              <Input className="mt-1" value={form.hook} onChange={(e) => setForm((f) => ({ ...f, hook: e.target.value }))} placeholder="Aufmerksamkeit gewinnen..." />
            </div>
            <div>
              <Label>Inhalt</Label>
              <Textarea className="mt-1" rows={4} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Dein Content..." />
            </div>
            <div>
              <Label>Geplant für</Label>
              <Input className="mt-1" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={saveItem} disabled={!form.title.trim()}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI generate dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> KI-Content generieren
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Deine Idee / Thema</Label>
              <Textarea
                className="mt-1" rows={3} value={aiIdea}
                onChange={(e) => setAiIdea(e.target.value)}
                placeholder="z.B. 'Tipps zur Strahlfäule-Prävention' oder 'Mein letzter Beschlag war besonders herausfordernd...'"
              />
            </div>
            <div>
              <Label>Content-Typ</Label>
              <Select value={aiType} onValueChange={setAiType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!canGenerate && (
              <div className="bg-warning/10 text-warning text-sm p-3 rounded-lg">
                Du hast dein monatliches Limit erreicht ({TIER_LIMIT} Posts). Upgrade auf Power User für unbegrenzte KI-Generierungen.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiOpen(false)}>Abbrechen</Button>
            <Button onClick={generateWithAI} disabled={generating || !canGenerate || !aiIdea.trim()}>
              {generating ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Generiere...</> : "Generieren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
