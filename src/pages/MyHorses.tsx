import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus, Trash2, Star, Edit2, Loader2, Clock, MessageSquare, Download, ChevronDown
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import HorsePhotoUpload from "@/components/HorsePhotoUpload";

interface Horse {
  id: string;
  name: string;
  breed: string | null;
  age: number | null;
  color: string | null;
  known_issues: string | null;
  notes: string | null;
  is_primary: boolean;
  keeping_type: string | null;
  hoof_type: string | null;
  last_trim_date: string | null;
  ai_summary: string | null;
  photo_url: string | null;
  horse_id: string | null;
}

interface ChatHistory {
  id: string;
  title: string | null;
  created_at: string;
  message_count?: number;
}

const KEEPING_LABELS: Record<string, string> = {
  box: "Box", offenstall: "Offenstall", paddock: "Paddock", weide: "Weide", mixed: "Mischform"
};
const HOOF_LABELS: Record<string, string> = {
  barefoot: "Barhuf", shod: "Beschlagen", alternative: "Alternativ (Hufschuh etc.)"
};

export default function MyHorses() {
  const { user } = useAuth();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editHorse, setEditHorse] = useState<Horse | null>(null);
  const [form, setForm] = useState({
    name: "", breed: "", age: "", color: "", known_issues: "", notes: "",
    keeping_type: "", hoof_type: "", last_trim_date: "", horse_id: ""
  });

  // Timeline state
  const [timelineHorseId, setTimelineHorseId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHorses = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("user_horses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false });
    if (data) setHorses(data as Horse[]);
    setLoading(false);
  };

  useEffect(() => { fetchHorses(); }, [user]);

  const openNew = () => {
    setEditHorse(null);
    setForm({ name: "", breed: "", age: "", color: "", known_issues: "", notes: "", keeping_type: "", hoof_type: "", last_trim_date: "", horse_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (h: Horse) => {
    setEditHorse(h);
    setForm({
      name: h.name, breed: h.breed || "", age: h.age?.toString() || "",
      color: h.color || "", known_issues: h.known_issues || "", notes: h.notes || "",
      keeping_type: h.keeping_type || "", hoof_type: h.hoof_type || "",
      last_trim_date: h.last_trim_date || "", horse_id: h.horse_id || "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!user || !form.name.trim()) return;
    try {
      const payload = {
        name: form.name.trim(), breed: form.breed || null,
        age: form.age ? parseInt(form.age) : null, color: form.color || null,
        known_issues: form.known_issues || null, notes: form.notes || null,
        keeping_type: form.keeping_type || null, hoof_type: form.hoof_type || null,
        last_trim_date: form.last_trim_date || null, horse_id: form.horse_id || null,
      };
      if (editHorse) {
        await supabase.from("user_horses").update(payload).eq("id", editHorse.id);
      } else {
        await supabase.from("user_horses").insert({ ...payload, user_id: user.id, is_primary: horses.length === 0 });
      }
      toast.success(editHorse ? "Pferd aktualisiert" : "Pferd hinzugefügt");
      setDialogOpen(false);
      fetchHorses();
    } catch (err: any) { toast.error(err.message); }
  };

  const setPrimary = async (id: string) => {
    if (!user) return;
    await supabase.from("user_horses").update({ is_primary: false }).eq("user_id", user.id);
    await supabase.from("user_horses").update({ is_primary: true }).eq("id", id);
    fetchHorses();
    toast.success("Hauptpferd gesetzt");
  };

  const deleteHorse = async (id: string) => {
    await supabase.from("user_horses").delete().eq("id", id);
    toast.success("Pferd entfernt");
    fetchHorses();
  };

  const viewHistory = async (horseId: string) => {
    if (timelineHorseId === horseId) { setTimelineHorseId(null); return; }
    setTimelineHorseId(horseId);
    setHistoryLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", user!.id)
      .eq("horse_id", horseId)
      .order("created_at", { ascending: false })
      .limit(20);
    setChatHistory((data as ChatHistory[]) || []);
    setHistoryLoading(false);
  };

  const exportHorseJson = (horse: Horse) => {
    const exportData = {
      hufmanager_version: "1.0",
      export_date: new Date().toISOString(),
      horse: {
        external_id: horse.horse_id,
        name: horse.name,
        breed: horse.breed,
        age: horse.age,
        color: horse.color,
        keeping_type: horse.keeping_type,
        hoof_type: horse.hoof_type,
        last_trim_date: horse.last_trim_date,
        core_health_issues: horse.known_issues,
        ai_case_summary: horse.ai_summary,
        notes: horse.notes,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hufiai_${horse.name.toLowerCase().replace(/\s/g, "_")}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exportiert");
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto overflow-y-auto h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">🐴 Meine Pferde</h1>
            <p className="text-muted-foreground text-sm">Verwalte deine Pferde. HufiAi merkt sich alles für personalisierte Beratung.</p>
          </div>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" /> Pferd hinzufügen
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : horses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🐴</div>
            <h2 className="text-lg font-semibold mb-2">Noch keine Pferde</h2>
            <p className="text-muted-foreground text-sm mb-4">Füge dein erstes Pferd hinzu, damit HufiAi dich persönlich beraten kann.</p>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Erstes Pferd hinzufügen</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {horses.map((h) => (
              <div key={h.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                {/* Card header with photo area */}
                <div className="h-32 bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center relative">
                  {h.photo_url ? (
                    <img src={h.photo_url} alt={h.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">🐴</span>
                  )}
                  {h.is_primary && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Hauptpferd
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{h.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {[h.breed, h.age ? `${h.age} J.` : null, h.color].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {h.keeping_type && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{KEEPING_LABELS[h.keeping_type] || h.keeping_type}</span>
                    )}
                    {h.hoof_type && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{HOOF_LABELS[h.hoof_type] || h.hoof_type}</span>
                    )}
                    {h.last_trim_date && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Letzter Beschlag: {new Date(h.last_trim_date).toLocaleDateString("de-DE")}
                      </span>
                    )}
                  </div>

                  {h.known_issues && (
                    <div className="text-xs text-destructive bg-destructive/5 p-2 rounded-lg mb-3">
                      ⚠ {h.known_issues}
                    </div>
                  )}

                  {h.ai_summary && (
                    <div className="text-xs text-muted-foreground bg-primary/5 p-2 rounded-lg mb-3">
                      🧠 KI-Zusammenfassung: {h.ai_summary}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-3 border-t border-border">
                    <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => viewHistory(h.id)}>
                      <MessageSquare className="w-3 h-3 mr-1" />Historie
                      <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${timelineHorseId === h.id ? "rotate-180" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => openEdit(h)}>
                      <Edit2 className="w-3 h-3 mr-1" />Bearbeiten
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => exportHorseJson(h)}>
                      <Download className="w-3 h-3 mr-1" />JSON
                    </Button>
                    {!h.is_primary && (
                      <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setPrimary(h.id)}>
                        <Star className="w-3 h-3 mr-1" />Hauptpferd
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-destructive ml-auto" onClick={() => deleteHorse(h.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Timeline */}
                  {timelineHorseId === h.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">CHAT-VERLAUF</h4>
                      {historyLoading ? (
                        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
                      ) : chatHistory.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Noch keine Chats mit diesem Pferd verknüpft.</p>
                      ) : (
                        <div className="space-y-2">
                          {chatHistory.map((chat) => (
                            <div key={chat.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                              <MessageSquare className="w-3 h-3 text-primary shrink-0" />
                              <span className="truncate flex-1">{chat.title || "Chat"}</span>
                              <span className="text-muted-foreground shrink-0">
                                {new Date(chat.created_at).toLocaleDateString("de-DE")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editHorse ? "Pferd bearbeiten" : "Neues Pferd hinzufügen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editHorse && (
              <div>
                <Label>Profilbild</Label>
                <div className="mt-1">
                  {editHorse.photo_url && (
                    <img src={editHorse.photo_url} alt={editHorse.name} className="w-20 h-20 rounded-xl object-cover mb-2" />
                  )}
                  <HorsePhotoUpload
                    horseId={editHorse.id}
                    userId={user!.id}
                    currentUrl={editHorse.photo_url}
                    onUploaded={(url) => {
                      setEditHorse({ ...editHorse, photo_url: url });
                      fetchHorses();
                    }}
                  />
                </div>
              </div>
            )}
            <div><Label>Name *</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="z.B. Luna" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Rasse</Label><Input className="mt-1" value={form.breed} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))} placeholder="z.B. Haflinger" /></div>
              <div><Label>Alter</Label><Input className="mt-1" type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} placeholder="Jahre" /></div>
            </div>
            <div><Label>Farbe</Label><Input className="mt-1" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="z.B. Fuchs" /></div>
            <div>
              <Label>Haltungsart</Label>
              <Select value={form.keeping_type} onValueChange={(v) => setForm((f) => ({ ...f, keeping_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(KEEPING_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Huftyp</Label>
              <Select value={form.hoof_type} onValueChange={(v) => setForm((f) => ({ ...f, hoof_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(HOOF_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Letzter Beschlag / Schnitt</Label>
              <Input className="mt-1" type="date" value={form.last_trim_date} onChange={(e) => setForm((f) => ({ ...f, last_trim_date: e.target.value }))} />
            </div>
            <div>
              <Label>Bekannte Gesundheitsprobleme</Label>
              <Textarea className="mt-1" rows={2} value={form.known_issues} onChange={(e) => setForm((f) => ({ ...f, known_issues: e.target.value }))} placeholder="z.B. Strahlfäule, Rehe, Hufrehe vorne links..." />
            </div>
            <div>
              <Label>Notizen</Label>
              <Textarea className="mt-1" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Weitere Infos..." />
            </div>
            <div>
              <Label>Externe ID (Hufmanager)</Label>
              <Input className="mt-1" value={form.horse_id} onChange={(e) => setForm((f) => ({ ...f, horse_id: e.target.value }))} placeholder="Optionale externe ID für API-Anbindung" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={save} disabled={!form.name.trim()}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
