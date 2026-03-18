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

interface MemoryFact {
  id: string;
  fact: string;
  source: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

interface Reminder {
  id: string;
  reminder_type: string;
  trigger_topic: string | null;
  trigger_condition: string | null;
  trigger_date: string | null;
  message: string;
  is_active: boolean;
  is_triggered: boolean;
  created_at: string;
}

export default function MemoryDashboard() {
  const { user, profile } = useAuth();
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
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
      const [factsRes, remindersRes] = await Promise.all([
        supabase.from("memory_facts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("user_reminders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (factsRes.data) setFacts(factsRes.data as MemoryFact[]);
      if (remindersRes.data) setReminders(remindersRes.data as Reminder[]);
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
      const { error } = await supabase.from("memory_facts").insert({
        user_id: user.id, fact: newFact.trim(), source: "manual", category: "general",
      });
      if (error) throw error;
      setNewFact("");
      toast.success("Fakt gespeichert");
      loadData();
    } catch (err: any) { toast.error(err.message); }
    finally { setAddingFact(false); }
  };

  const deleteFact = async (id: string) => {
    const { error } = await supabase.from("memory_facts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { setFacts(f => f.filter(x => x.id !== id)); toast.success("Gelöscht"); }
  };

  const updateFact = async (id: string) => {
    if (!editValue.trim()) return;
    const { error } = await supabase.from("memory_facts").update({ fact: editValue.trim() }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      setFacts(f => f.map(x => x.id === id ? { ...x, fact: editValue.trim() } : x));
      setEditingId(null);
      toast.success("Aktualisiert");
    }
  };

  const toggleFact = async (id: string, active: boolean) => {
    const { error } = await supabase.from("memory_facts").update({ is_active: active }).eq("id", id);
    if (!error) setFacts(f => f.map(x => x.id === id ? { ...x, is_active: active } : x));
  };

  const addReminder = async () => {
    if (!user || !newReminder.message.trim()) return;
    setAddingReminder(true);
    try {
      const { error } = await supabase.from("user_reminders").insert({
        user_id: user.id,
        message: newReminder.message.trim(),
        reminder_type: newReminder.type,
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
    const { error } = await supabase.from("user_reminders").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { setReminders(r => r.filter(x => x.id !== id)); toast.success("Gelöscht"); }
  };

  const toggleReminder = async (id: string, active: boolean) => {
    const { error } = await supabase.from("user_reminders").update({ is_active: active }).eq("id", id);
    if (!error) setReminders(r => r.map(x => x.id === id ? { ...x, is_active: active } : x));
  };

  const filteredFacts = facts.filter(f =>
    f.fact.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFacts = facts.filter(f => f.is_active);
  const autoFacts = facts.filter(f => f.source === "auto");
  const manualFacts = facts.filter(f => f.source === "manual");
  const categories = [...new Set(facts.map(f => f.category))];
  const activeReminders = reminders.filter(r => r.is_active && !r.is_triggered);

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
          <p className="text-2xl font-bold text-primary">{activeFacts.length}</p>
          <p className="text-xs text-muted-foreground">Aktive Fakten</p>
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
          <p className="text-2xl font-bold text-primary">{autoFacts.length}</p>
          <p className="text-xs text-muted-foreground">Auto-extrahiert</p>
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
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Fakten durchsuchen..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Add new fact */}
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm font-medium mb-2">Neuen Fakt hinzufügen</p>
            <div className="flex gap-2">
              <Input
                value={newFact}
                onChange={e => setNewFact(e.target.value)}
                placeholder='z.B. "Mein Pferd Luna hat Hufrehne-Vorgeschichte"'
                onKeyDown={e => e.key === "Enter" && addFact()}
              />
              <Button onClick={addFact} disabled={addingFact || !newFact.trim()} size="sm">
                {addingFact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Facts List */}
          <div className="space-y-2">
            {filteredFacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Noch keine Fakten gespeichert.</p>
                <p className="text-xs mt-1">Chatte mit HufiAi – Fakten werden automatisch extrahiert!</p>
              </div>
            ) : (
              filteredFacts.map(fact => (
                <div key={fact.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${fact.is_active ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-60"}`}>
                  <Switch
                    checked={fact.is_active}
                    onCheckedChange={v => toggleFact(fact.id, v)}
                    className="mt-0.5 shrink-0"
                  />
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
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{fact.category}</Badge>
                          <Badge variant={fact.source === "auto" ? "default" : "outline"} className="text-xs">
                            {fact.source === "auto" ? "Auto" : "Manuell"}
                          </Badge>
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

          {/* Legacy ai_memory is stored in profiles table and injected via edge function */}
        </TabsContent>

        {/* REMINDERS TAB */}
        <TabsContent value="reminders" className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm font-medium">Neue Erinnerung</p>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={newReminder.type === "topic" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setNewReminder(r => ({ ...r, type: "topic" }))}
              >
                <MessageSquare className="w-3 h-3 mr-1" />Thema
              </Badge>
              <Badge
                variant={newReminder.type === "condition" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setNewReminder(r => ({ ...r, type: "condition" }))}
              >
                <Target className="w-3 h-3 mr-1" />Bedingung
              </Badge>
              <Badge
                variant={newReminder.type === "time" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setNewReminder(r => ({ ...r, type: "time" }))}
              >
                <Clock className="w-3 h-3 mr-1" />Zeitbasiert
              </Badge>
            </div>
            {newReminder.type === "topic" && (
              <Input
                value={newReminder.topic}
                onChange={e => setNewReminder(r => ({ ...r, topic: e.target.value }))}
                placeholder="Thema z.B. 'Hufrehne', 'Fütterung'"
              />
            )}
            <Input
              value={newReminder.message}
              onChange={e => setNewReminder(r => ({ ...r, message: e.target.value }))}
              placeholder="Was soll erinnert werden?"
            />
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
                <p className="text-xs mt-1">Erstelle Erinnerungen für themen- oder zeitbasierte Hinweise.</p>
              </div>
            ) : (
              reminders.map(r => (
                <div key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border ${r.is_triggered ? "bg-green-500/5 border-green-500/20" : r.is_active ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-60"}`}>
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={v => toggleReminder(r.id, v)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{r.message}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {r.reminder_type === "topic" ? `📌 ${r.trigger_topic || "Allgemein"}` :
                         r.reminder_type === "condition" ? `⚡ Bedingung` : `⏰ Zeitbasiert`}
                      </Badge>
                      {r.is_triggered && <Badge variant="default" className="text-xs">✓ Ausgelöst</Badge>}
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
                    {categories.map(cat => {
                      const count = facts.filter(f => f.category === cat).length;
                      return (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat} ({count})
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Noch keine Daten</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Memory Health</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Automatisch</p>
                    <p className="text-lg font-bold">{autoFacts.length}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Manuell</p>
                    <p className="text-lg font-bold">{manualFacts.length}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Aktive Erinnerungen</p>
                    <p className="text-lg font-bold">{activeReminders.length}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Ausgelöst</p>
                    <p className="text-lg font-bold">{reminders.filter(r => r.is_triggered).length}</p>
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
