import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Star, Edit2, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

interface Horse {
  id: string;
  name: string;
  breed: string | null;
  age: number | null;
  color: string | null;
  known_issues: string | null;
  notes: string | null;
  is_primary: boolean;
}

export default function HorseManager() {
  const { user } = useAuth();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editHorse, setEditHorse] = useState<Horse | null>(null);
  const [form, setForm] = useState({ name: "", breed: "", age: "", color: "", known_issues: "", notes: "" });

  const fetchHorses = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("user_horses").select("*").eq("user_id", user.id).order("is_primary", { ascending: false });
    if (data) setHorses(data as Horse[]);
    setLoading(false);
  };

  useEffect(() => { fetchHorses(); }, [user]);

  const openNew = () => {
    setEditHorse(null);
    setForm({ name: "", breed: "", age: "", color: "", known_issues: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (h: Horse) => {
    setEditHorse(h);
    setForm({
      name: h.name, breed: h.breed || "", age: h.age?.toString() || "",
      color: h.color || "", known_issues: h.known_issues || "", notes: h.notes || "",
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

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">🐴 Meine Pferde</h2>
          <p className="text-xs text-muted-foreground">HufiAi merkt sich deine Pferde für personalisierte Beratung.</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Pferd hinzufügen</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : horses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Noch keine Pferde hinterlegt.</p>
      ) : (
        <div className="space-y-3">
          {horses.map((h) => (
            <div key={h.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                {h.is_primary && <Star className="w-4 h-4 text-primary fill-primary" />}
                <div>
                  <p className="font-medium text-sm">{h.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[h.breed, h.age ? `${h.age} Jahre` : null, h.color].filter(Boolean).join(" · ") || "Keine Details"}
                  </p>
                  {h.known_issues && <p className="text-xs text-destructive mt-0.5">⚠ {h.known_issues}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!h.is_primary && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPrimary(h.id)} title="Als Hauptpferd setzen">
                    <Star className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(h)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteHorse(h.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editHorse ? "Pferd bearbeiten" : "Neues Pferd"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="z.B. Luna" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Rasse</Label><Input className="mt-1" value={form.breed} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))} placeholder="z.B. Haflinger" /></div>
              <div><Label>Alter</Label><Input className="mt-1" type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} placeholder="Jahre" /></div>
            </div>
            <div><Label>Farbe</Label><Input className="mt-1" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="z.B. Fuchs" /></div>
            <div><Label>Bekannte Probleme</Label><Textarea className="mt-1" rows={2} value={form.known_issues} onChange={(e) => setForm((f) => ({ ...f, known_issues: e.target.value }))} placeholder="z.B. Strahlfäule, Rehe..." /></div>
            <div><Label>Notizen</Label><Textarea className="mt-1" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Weitere Infos..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={save} disabled={!form.name.trim()}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
