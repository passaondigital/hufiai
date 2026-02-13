import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, FolderKanban, Trash2, Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    const { data } = await supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setProjects((data as Project[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const createProject = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase.from("projects").insert({ user_id: user.id, name: newName.trim(), description: newDesc.trim() || null });
      if (error) throw error;
      toast.success("Projekt erstellt");
      setNewName(""); setNewDesc(""); setShowNew(false);
      fetchProjects();
    } catch (err: any) { toast.error(err.message); }
    finally { setCreating(false); }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Projekt gelöscht"); fetchProjects(); }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Projekte</h1>
            <p className="text-muted-foreground">Organisiere deine Chats und Dokumente nach Projekten.</p>
          </div>
          <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-2" />Neues Projekt</Button>
        </div>

        {showNew && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-6 animate-fade-in">
            <div className="space-y-4">
              <div><Label>Projektname</Label><Input className="mt-1" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="z.B. Reiterhof Meyer" /></div>
              <div><Label>Beschreibung (optional)</Label><Input className="mt-1" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Kurze Beschreibung" /></div>
              <div className="flex gap-2">
                <Button onClick={createProject} disabled={creating || !newName.trim()}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Erstellen
                </Button>
                <Button variant="outline" onClick={() => setShowNew(false)}>Abbrechen</Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Noch keine Projekte vorhanden.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((p) => (
              <div key={p.id} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(p.created_at).toLocaleDateString("de-DE")}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteProject(p.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
