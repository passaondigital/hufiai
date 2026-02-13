import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Map, Plus, Loader2, Bug, Lightbulb, Sparkles, CheckCircle, Clock, XCircle,
  ArrowUpCircle, AlertTriangle, Trash2
} from "lucide-react";

interface RoadmapEntry {
  id: string; title: string; description: string | null;
  type: string; status: string; priority: string;
  created_at: string; updated_at: string;
}

const TYPE_CONFIG = {
  feature: { label: "Feature", icon: Sparkles, color: "text-primary" },
  bug: { label: "Bug", icon: Bug, color: "text-destructive" },
  idea: { label: "Idee", icon: Lightbulb, color: "text-warning" },
} as const;

const STATUS_CONFIG = {
  planned: { label: "Geplant", icon: Clock },
  in_progress: { label: "In Arbeit", icon: ArrowUpCircle },
  done: { label: "Erledigt", icon: CheckCircle },
  cancelled: { label: "Verworfen", icon: XCircle },
} as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

export default function Roadmap() {
  const { user, isAdmin } = useAuth();
  const [entries, setEntries] = useState<RoadmapEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("feature");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("roadmap_entries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setEntries((data as RoadmapEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchEntries(); }, [isAdmin]);

  const addEntry = async () => {
    if (!title.trim() || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("roadmap_entries").insert({
        title: title.trim(),
        description: description.trim() || null,
        type,
        priority,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success("Eintrag hinzugefügt");
      setTitle(""); setDescription(""); setShowForm(false);
      fetchEntries();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("roadmap_entries").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("roadmap_entries").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Gelöscht"); fetchEntries(); }
  };

  const filtered = filter ? entries.filter((e) => e.type === filter) : entries;

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Map className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold">Kein Zugriff</h2>
            <p className="text-muted-foreground">Nur für Administratoren.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Map className="w-6 h-6 text-primary" /> Developer Roadmap
            </h1>
            <p className="text-muted-foreground">Features, Bugs und Ideen für HufiAi.</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Neuer Eintrag
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          <Button variant={filter === null ? "default" : "outline"} size="sm" onClick={() => setFilter(null)}>Alle</Button>
          {(Object.entries(TYPE_CONFIG) as [string, any][]).map(([key, cfg]) => (
            <Button key={key} variant={filter === key ? "default" : "outline"} size="sm" onClick={() => setFilter(key)}>
              <cfg.icon className="w-4 h-4 mr-1" /> {cfg.label}
            </Button>
          ))}
        </div>

        {/* New Entry Form */}
        {showForm && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-6 animate-fade-in">
            <h2 className="font-semibold mb-4">Neuer Eintrag</h2>
            <div className="space-y-4">
              <div>
                <Label>Titel</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" placeholder="z.B. Chat-Export als PDF" />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" placeholder="Details..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Typ</Label>
                  <div className="flex gap-2 mt-2">
                    {(Object.entries(TYPE_CONFIG) as [string, any][]).map(([key, cfg]) => (
                      <button key={key} onClick={() => setType(key)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 text-sm ${type === key ? "border-primary bg-accent" : "border-border"}`}>
                        <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} /> {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Priorität</Label>
                  <div className="flex gap-2 mt-2">
                    {["low", "medium", "high", "critical"].map((p) => (
                      <button key={p} onClick={() => setPriority(p)} className={`px-3 py-1.5 rounded-lg border-2 text-sm capitalize ${priority === p ? "border-primary bg-accent" : "border-border"}`}>
                        {p === "low" ? "Niedrig" : p === "medium" ? "Mittel" : p === "high" ? "Hoch" : "Kritisch"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addEntry} disabled={saving || !title.trim()}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Erstellen
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
              </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Noch keine Einträge. Starte mit deinem ersten Feature oder Bug!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => {
              const typeCfg = TYPE_CONFIG[entry.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.feature;
              const statusCfg = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planned;
              return (
                <div key={entry.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <typeCfg.icon className={`w-4 h-4 ${typeCfg.color}`} />
                        <h3 className="font-semibold">{entry.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[entry.priority] || ""}`}>
                          {entry.priority === "low" ? "Niedrig" : entry.priority === "medium" ? "Mittel" : entry.priority === "high" ? "Hoch" : "Kritisch"}
                        </span>
                      </div>
                      {entry.description && <p className="text-sm text-muted-foreground mb-2">{entry.description}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString("de-DE")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={entry.status}
                        onChange={(e) => updateStatus(entry.id, e.target.value)}
                        className="text-xs border border-border rounded-lg px-2 py-1 bg-background"
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
                      <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
