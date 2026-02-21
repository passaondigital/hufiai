import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Calendar, Plus, Sparkles, Loader2, Trash2, Play, CheckCircle, Clock, Edit2 } from "lucide-react";

type CalendarEntry = {
  id: string;
  title: string;
  description: string | null;
  planned_date: string;
  platform: string;
  content_type: string;
  status: string;
  prompt_suggestion: string | null;
  aspect_ratio: string;
  ai_generated: boolean;
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "tiktok", label: "TikTok", emoji: "🎵" },
  { id: "youtube", label: "YouTube", emoji: "📺" },
  { id: "linkedin", label: "LinkedIn", emoji: "💼" },
];

const CONTENT_TYPES = [
  { id: "reel", label: "Reel/Short", ratio: "9:16" },
  { id: "post", label: "Feed Post", ratio: "1:1" },
  { id: "story", label: "Story", ratio: "9:16" },
  { id: "youtube", label: "YouTube Video", ratio: "16:9" },
  { id: "blog", label: "Blog/Artikel", ratio: "16:9" },
];

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  produced: "bg-emerald-500/20 text-emerald-400",
  published: "bg-primary/20 text-primary",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Geplant",
  in_progress: "In Arbeit",
  produced: "Produziert",
  published: "Veröffentlicht",
};

export default function ContentCalendar({
  userId,
  onCreateVideo,
}: {
  userId: string;
  onCreateVideo?: (prompt: string, aspectRatio: string) => void;
}) {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newPlatform, setNewPlatform] = useState("instagram");
  const [newType, setNewType] = useState("reel");
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    loadEntries();
  }, [userId, viewMonth]);

  const loadEntries = async () => {
    setLoading(true);
    const startDate = `${viewMonth}-01`;
    const endDate = new Date(parseInt(viewMonth.split("-")[0]), parseInt(viewMonth.split("-")[1]), 0)
      .toISOString().split("T")[0];
    
    const { data } = await supabase
      .from("content_calendar")
      .select("*")
      .eq("user_id", userId)
      .gte("planned_date", startDate)
      .lte("planned_date", endDate)
      .order("planned_date");
    if (data) setEntries(data);
    setLoading(false);
  };

  const addEntry = async () => {
    if (!newTitle.trim() || !newDate) return toast({ title: "Titel und Datum erforderlich", variant: "destructive" });
    const contentType = CONTENT_TYPES.find(c => c.id === newType);
    const { error } = await supabase.from("content_calendar").insert({
      user_id: userId,
      title: newTitle.trim(),
      planned_date: newDate,
      platform: newPlatform,
      content_type: newType,
      aspect_ratio: contentType?.ratio || "9:16",
    });
    if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    toast({ title: "Eintrag erstellt ✓" });
    setNewTitle("");
    setNewDate("");
    setShowAddForm(false);
    loadEntries();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("content_calendar").update({ status }).eq("id", id);
    loadEntries();
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("content_calendar").delete().eq("id", id);
    toast({ title: "Gelöscht" });
    loadEntries();
  };

  const generateAIPlan = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          mode: "analyst",
          messages: [{
            role: "user",
            content: `Du bist ein Social-Media-Stratege für die Pferdebranche (Hufbearbeitung, Reitsport, Pferdegesundheit).

Erstelle einen Content-Plan für den Monat ${viewMonth} mit genau 12 Posts. Mische verschiedene Plattformen (Instagram, TikTok, YouTube) und Content-Typen (Reel, Post, Story, YouTube Video).

Antworte NUR mit einem JSON-Array (kein Markdown, kein Text davor/danach):
[
  {
    "title": "Post-Titel",
    "description": "Kurze Beschreibung",
    "planned_date": "YYYY-MM-DD",
    "platform": "instagram|tiktok|youtube|linkedin",
    "content_type": "reel|post|story|youtube|blog",
    "prompt_suggestion": "Detaillierter Video-Prompt für KI-Generierung",
    "aspect_ratio": "9:16|16:9|1:1"
  }
]

Verteile die Posts gleichmäßig über den Monat. Fokus auf praxisnahen Pferde-Content.`
          }]
        }
      });
      if (error) throw error;

      const text = typeof data === "string" ? data : (data?.choices?.[0]?.message?.content || JSON.stringify(data));
      let plan: any[];
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        plan = JSON.parse(jsonMatch?.[0] || text);
      } catch {
        throw new Error("KI-Antwort konnte nicht geparst werden");
      }

      // Insert all entries
      const inserts = plan.map((p: any) => ({
        user_id: userId,
        title: p.title,
        description: p.description || null,
        planned_date: p.planned_date,
        platform: p.platform || "instagram",
        content_type: p.content_type || "reel",
        prompt_suggestion: p.prompt_suggestion || null,
        aspect_ratio: p.aspect_ratio || "9:16",
        ai_generated: true,
      }));

      const { error: insertError } = await supabase.from("content_calendar").insert(inserts);
      if (insertError) throw insertError;

      toast({ title: `${plan.length} Content-Ideen generiert ✨` });
      loadEntries();
    } catch (e: any) {
      toast({ title: "Generierung fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Group entries by week
  const groupedByDate = entries.reduce<Record<string, CalendarEntry[]>>((acc, e) => {
    const key = e.planned_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const monthLabel = new Date(viewMonth + "-01").toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[hsl(var(--sidebar-foreground))]">Redaktionsplan</h3>
                <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">{monthLabel} · {entries.length} Einträge</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input type="month" value={viewMonth} onChange={e => setViewMonth(e.target.value)}
                className="w-40 h-8 text-xs bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]" />
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs h-8 border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] gap-1">
                <Plus className="w-3 h-3" /> Manuell
              </Button>
              <Button size="sm" onClick={generateAIPlan} disabled={isGenerating}
                className="text-xs h-8 bg-primary hover:bg-primary/90 gap-1">
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                KI-Plan generieren
              </Button>
            </div>
          </div>

          {showAddForm && (
            <div className="mt-4 p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Titel"
                  className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs" />
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                  className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs" />
                <Select value={newPlatform} onValueChange={setNewPlatform}>
                  <SelectTrigger className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p.id} value={p.id}>{p.emoji} {p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addEntry} className="bg-primary hover:bg-primary/90 text-xs">Hinzufügen</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="text-xs text-[hsl(var(--sidebar-muted))]">Abbrechen</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
          <CardContent className="py-12 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-[hsl(var(--sidebar-muted))] opacity-30" />
            <p className="text-xs text-[hsl(var(--sidebar-muted))]">Noch keine Einträge für {monthLabel}</p>
            <p className="text-[10px] text-[hsl(var(--sidebar-muted))] mt-1">Klicke "KI-Plan generieren" für automatische Vorschläge</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayEntries]) => (
            <div key={date}>
              <p className="text-[10px] font-semibold text-[hsl(var(--sidebar-muted))] uppercase tracking-wider mb-1.5 px-1">
                {new Date(date).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}
              </p>
              <div className="space-y-1.5">
                {dayEntries.map(entry => {
                  const platformInfo = PLATFORMS.find(p => p.id === entry.platform);
                  return (
                    <Card key={entry.id} className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] hover:border-primary/40 transition-all">
                      <CardContent className="p-3 flex items-center gap-3">
                        <span className="text-lg">{platformInfo?.emoji || "📋"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))] truncate">{entry.title}</p>
                            {entry.ai_generated && <Sparkles className="w-3 h-3 text-primary shrink-0" />}
                          </div>
                          {entry.description && (
                            <p className="text-[10px] text-[hsl(var(--sidebar-muted))] truncate">{entry.description}</p>
                          )}
                          <div className="flex gap-1.5 mt-1">
                            <Badge className={`text-[9px] border-0 ${STATUS_COLORS[entry.status]}`}>
                              {STATUS_LABELS[entry.status]}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))]">
                              {entry.content_type} · {entry.aspect_ratio}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {entry.prompt_suggestion && onCreateVideo && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                              onClick={() => {
                                onCreateVideo(entry.prompt_suggestion!, entry.aspect_ratio);
                                updateStatus(entry.id, "in_progress");
                              }} title="Video erstellen">
                              <Play className="w-3.5 h-3.5 text-primary" />
                            </Button>
                          )}
                          <Select value={entry.status} onValueChange={v => updateStatus(entry.id, v)}>
                            <SelectTrigger className="h-7 w-7 p-0 border-0 bg-transparent [&>svg]:hidden">
                              <Clock className="w-3.5 h-3.5 text-[hsl(var(--sidebar-muted))]" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteEntry(entry.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-[hsl(var(--sidebar-muted))]" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
