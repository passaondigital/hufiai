import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Brain, Sparkles, Bell, Clock, Search, Trash2, Plus, Loader2,
  TrendingUp, MessageSquare, Target, BarChart3, Edit2, Check, X
} from "lucide-react";

interface MemoryItem {
  id: string;
  fact: string;
  category: string | null;
  importance: number;
  confidence: number;
  use_count: number;
  created_at: string;
}

interface ReminderItem {
  id: string;
  reminder_text: string;
  type: string | null;
  trigger_topic: string | null;
  trigger_condition: string | null;
  due_date: string | null;
  is_active: boolean;
  reminded_count: number;
  created_at: string;
}

export default function MemoryDashboard() {
  const { user } = useAuth();
  const [facts, setFacts] = useState<MemoryItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newFact, setNewFact] = useState("");
  const [newReminder, setNewReminder] = useState({ message: "", type: "topic", topic: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addingFact, setAddingFact] = useState(false);
  const [addingReminder, setAddingReminder] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [memRes, remRes] = await Promise.all([
        supabase.from("user_memory" as any).select("id, fact, category, importance, confidence, use_count, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("user_reminders" as any).select("id, reminder_text, type, trigger_topic, trigger_condition, due_date, is_active, reminded_count, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (memRes.data) setFacts(memRes.data as unknown as MemoryItem[]);
      if (remRes.data) setReminders(remRes.data as unknown as ReminderItem[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addFact = async () => {
    if (!user || !newFact.trim()) return;
    setAddingFact(true);
    try {
      const { error } = await (supabase.from("user_memory" as any) as any).insert({
        user_id: user.id, fact: newFact.trim(), category: "fact", importance: 3,
      });
      if (error) throw error;
      setNewFact("");
      toast.success("Fakt gespeichert");
      loadData();
    } catch (err: any) { toast.error(err.message); }
    finally { setAddingFact(false); }
  };

  const deleteFact = async (id: string) => {
    const { error } = await (supabase.from("user_memory" as any) as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { setFacts(f => f.filter(x => x.id !== id)); toast.success("Gelöscht"); }
  };

  const updateFact = async (id: string) => {
    if (!editValue.trim()) return;
    const { error } = await (supabase.from("user_memory" as any) as any).update({ fact: editValue.trim() }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      setFacts(f => f.map(x => x.id === id ? { ...x, fact: editValue.trim() } : x));
      setEditingId(null);
      toast.success("Aktualisiert");
    }
  };

  const addReminder = async () => {
    if (!user || !newReminder.message.trim()) return;
    setAddingReminder(true);
    try {
      const { error } = await (supabase.from("user_reminders" as any) as any).insert({
        user_id: user.id,
        reminder_text: newReminder.message.trim(),
        type: newReminder.type,
        trigger_topic: newReminder.type === "topic" ? newReminder.topic : null,
      });
      if (error) throw error;
      setNewReminder({ message: "", type: "topic", topic: "" });
      toast.success("Erinnerung gespeichert");
      loadData();
    } catch (err: any) { toast.error(err.message); }
    finally { setAddingReminder(false); }
  };

  const deleteReminder = async (id: string) => {
    const { error } = await (supabase.from("user_reminders" as any) as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { setReminders(r => r.filter(x => x.id !== id)); toast.success("Gelöscht"); }
  };

  const toggleReminder = async (id: string, active: boolean) => {
    const { error } = await (supabase.from("user_reminders" as any) as any).update({ is_active: active }).eq("id", id);
    if (!error) setReminders(r => r.map(x => x.id === id ? { ...x, is_active: active } : x));
  };

  const filteredFacts = facts.filter(f =>
    f.fact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(facts.map(f => f.category || "general"))];
  const activeReminders = reminders.filter(r => r.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-lg font-bold">Master Memory</h2>
          <p className="text-sm text-muted-foreground">
            Dein persistenter KI-Kontext – wird in jeden Chat injiziert.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-primary">{facts.length}</p>
          <p className="text-xs text-muted-foreground">Gespeicherte Fakten</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-primary">{activeReminders.length}</p>
          <p className="text-xs text-muted-foreground">Erinnerungen</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-primary">{categories.length}</p>
          <p className="text-xs text-muted-foreground">Kategorien</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-primary">{facts.reduce((sum, f) => sum + f.use_count, 0)}</p>
          <p className="text-xs text-muted-foreground">Mal genutzt</p>
        </div>
      </div>

      <Tabs defaultValue="facts" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="facts"><Brain className="w-4 h-4 mr-1" />Fakten</TabsTrigger>
          <TabsTrigger value="reminders"><Bell className="w-4 h-4 mr-1" />Erinnerungen</TabsTrigger>
          <TabsTrigger value="insights"><BarChart3 className="w-4 h-4 mr-1" />Insights</TabsTrigger>
        </TabsList>

        {/* FACTS TAB */}
        <TabsContent value="facts" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Fakten durchsuchen..." className="pl-9" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm font-medium mb-2">Neuen Fakt hinzufügen</p>
            <div className="flex gap-2">
              <Input value={newFact} onChange={e => setNewFact(e.target.value)} placeholder='z.B. "Mein Pferd Luna hat Hufrehne-Vorgeschichte"' onKeyDown={e => e.key === "Enter" && addFact()} />
              <Button onClick={addFact} disabled={addingFact || !newFact.trim()} size="sm">
                {addingFact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredFacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Noch keine Fakten gespeichert.</p>
                <p className="text-xs mt-1">Chatte mit Hufi – Fakten werden automatisch extrahiert!</p>
              </div>
            ) : (
              filteredFacts.map(fact => (
                <div key={fact.id} className="flex items-start gap-3 p-3 rounded-xl border bg-card border-border">
                  <div className="flex-1 min-w-0">
                    {editingId === fact.id ? (
                      <div className="flex gap-2">
                        <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="text-sm" autoFocus />
                        <Button size="icon" variant="ghost" onClick={() => updateFact(fact.id)}>
                          <Check className="w-4 h-4 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{fact.fact}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{fact.category || "general"}</Badge>
                          <Badge variant="outline" className="text-xs">⭐ {fact.importance}/5</Badge>
                          <Badge variant="outline" className="text-xs">🎯 {Math.round(fact.confidence * 100)}%</Badge>
                          {fact.use_count > 0 && <Badge variant="outline" className="text-xs">×{fact.use_count}</Badge>}
                          <span className="text-xs text-muted-foreground">
                            {new Date(fact.created_at).toLocaleDateString("de-DE")}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  {editingId !== fact.id && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(fact.id); setEditValue(fact.fact); }}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteFact(fact.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* REMINDERS TAB */}
        <TabsContent value="reminders" className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm font-medium">Neue Erinnerung</p>
            <div className="flex gap-2 flex-wrap">
              {(["topic", "condition", "time"] as const).map(t => (
                <Badge key={t} variant={newReminder.type === t ? "default" : "outline"} className="cursor-pointer" onClick={() => setNewReminder(r => ({ ...r, type: t }))}>
                  {t === "topic" ? <><MessageSquare className="w-3 h-3 mr-1" />Thema</> :
                   t === "condition" ? <><Target className="w-3 h-3 mr-1" />Bedingung</> :
                   <><Clock className="w-3 h-3 mr-1" />Zeitbasiert</>}
                </Badge>
              ))}
            </div>
            {newReminder.type === "topic" && (
              <Input value={newReminder.topic} onChange={e => setNewReminder(r => ({ ...r, topic: e.target.value }))} placeholder="Thema z.B. 'Hufrehne', 'Fütterung'" />
            )}
            <Input value={newReminder.message} onChange={e => setNewReminder(r => ({ ...r, message: e.target.value }))} placeholder="Was soll erinnert werden?" />
            <Button onClick={addReminder} disabled={addingReminder || !newReminder.message.trim()} size="sm">
              {addingReminder ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Erinnerung speichern
            </Button>
          </div>

          <div className="space-y-2">
            {reminders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Keine Erinnerungen.</p>
              </div>
            ) : (
              reminders.map(r => (
                <div key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border ${r.is_active ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-60"}`}>
                  <Switch checked={r.is_active} onCheckedChange={v => toggleReminder(r.id, v)} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{r.reminder_text}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {r.type === "topic" ? `📌 ${r.trigger_topic || "Allgemein"}` :
                         r.type === "condition" ? `⚡ Bedingung` : `⏰ Zeitbasiert`}
                      </Badge>
                      {r.reminded_count > 0 && <Badge variant="outline" className="text-xs">×{r.reminded_count} erinnert</Badge>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteReminder(r.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* INSIGHTS TAB */}
        <TabsContent value="insights" className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Memory Insights</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Top Kategorien</p>
                {categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat} ({facts.filter(f => (f.category || "general") === cat).length})
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Noch keine Daten</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Memory Health</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Durchschn. Wichtigkeit</p>
                    <p className="text-lg font-bold">{facts.length > 0 ? (facts.reduce((s, f) => s + f.importance, 0) / facts.length).toFixed(1) : "–"}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Durchschn. Konfidenz</p>
                    <p className="text-lg font-bold">{facts.length > 0 ? `${Math.round((facts.reduce((s, f) => s + f.confidence, 0) / facts.length) * 100)}%` : "–"}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Aktive Erinnerungen</p>
                    <p className="text-lg font-bold">{activeReminders.length}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Gesamt genutzt</p>
                    <p className="text-lg font-bold">{facts.reduce((s, f) => s + f.use_count, 0)}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Zuletzt hinzugefügt</p>
                {facts.slice(0, 3).map(f => (
                  <div key={f.id} className="flex items-center gap-2 py-1">
                    <Sparkles className="w-3 h-3 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">{f.fact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
