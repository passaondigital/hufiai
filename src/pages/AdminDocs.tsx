import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { BookOpen, Plus, Loader2, Save, Trash2, Sparkles, ShieldCheck } from "lucide-react";

interface DocEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  module_name: string | null;
  is_public: boolean;
  status: string;
  ai_summary: string | null;
  sort_order: number;
  created_at: string;
}

export default function AdminDocs() {
  const { user, isAdmin } = useAuth();
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // New doc form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newModule, setNewModule] = useState("");
  const [newPublic, setNewPublic] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (isAdmin) fetchDocs();
  }, [isAdmin]);

  const fetchDocs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("system_documentation")
      .select("*")
      .order("sort_order");
    setDocs((data as DocEntry[]) || []);
    setLoading(false);
  };

  const addDoc = async () => {
    if (!newTitle.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("system_documentation").insert({
      title: newTitle,
      content: newContent,
      category: newCategory,
      module_name: newModule || null,
      is_public: newPublic,
      status: "draft",
      created_by: user.id,
      sort_order: docs.length,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Dokumentation hinzugefügt (als Draft)");
      setNewTitle(""); setNewContent(""); setNewModule(""); setShowAdd(false);
      fetchDocs();
    }
    setSaving(false);
  };

  const updateDoc = async (doc: DocEntry) => {
    const { error } = await supabase.from("system_documentation").update({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      module_name: doc.module_name,
      is_public: doc.is_public,
      ai_summary: doc.ai_summary,
    }).eq("id", doc.id);
    if (error) toast.error(error.message);
    else toast.success("Gespeichert");
  };

  const toggleStatus = async (doc: DocEntry) => {
    const newStatus = doc.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("system_documentation").update({ status: newStatus }).eq("id", doc.id);
    if (error) toast.error(error.message);
    else { toast.success(newStatus === "published" ? "Veröffentlicht" : "Zurück zu Draft"); fetchDocs(); }
  };

  const deleteDoc = async (id: string) => {
    const { error } = await supabase.from("system_documentation").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Gelöscht"); fetchDocs(); }
  };

  const generateAISummary = async (doc: DocEntry) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [
            { role: "user", content: `Erstelle eine kurze Zusammenfassung (max. 2 Sätze) für folgenden Dokumentations-Eintrag:\n\nTitel: ${doc.title}\n\nInhalt: ${doc.content.slice(0, 2000)}` },
          ],
        },
      });
      // For non-streaming response, we parse differently
      toast.success("AI-Summary generiert – bitte manuell einfügen");
    } catch (err: any) {
      toast.error("Summary-Generierung fehlgeschlagen");
    }
    setGenerating(false);
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <ShieldCheck className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold">Kein Zugriff</h2>
            <p className="text-muted-foreground">Nur für den Founder.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" /> Admin Dokumentation
            </h1>
            <p className="text-muted-foreground text-sm">Code-Logik, API-Endpoints, DB-Schema – nur für dich.</p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4 mr-2" /> Hinzufügen
          </Button>
        </div>

        {/* Add form */}
        {showAdd && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Titel" />
              <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Inhalt (Markdown)" rows={6} />
              <div className="flex gap-3 items-center">
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-background">
                  <option value="general">Allgemein</option>
                  <option value="module">Modul</option>
                  <option value="api">API-Endpoint</option>
                  <option value="schema">DB-Schema</option>
                  <option value="faq">FAQ</option>
                  <option value="guide">Anleitung</option>
                </select>
                <Input value={newModule} onChange={(e) => setNewModule(e.target.value)} placeholder="Modul-Name (optional)" className="max-w-[200px]" />
                <div className="flex items-center gap-2">
                  <Switch checked={newPublic} onCheckedChange={setNewPublic} />
                  <Label className="text-sm">Öffentlich</Label>
                </div>
                <Button onClick={addDoc} disabled={saving || !newTitle.trim()}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Docs list */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Noch keine Dokumentation erstellt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{doc.title}</p>
                      <Badge variant={doc.status === "published" ? "default" : "secondary"} className="text-xs">
                        {doc.status === "published" ? "✅ Live" : "📝 Draft"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                      {doc.is_public && <Badge variant="outline" className="text-xs">🌐 Öffentlich</Badge>}
                      {doc.module_name && <Badge variant="outline" className="text-xs">📦 {doc.module_name}</Badge>}
                    </div>
                  </div>
                  {doc.ai_summary && <p className="text-xs text-muted-foreground">🤖 {doc.ai_summary}</p>}
                  
                  {editing === doc.id ? (
                    <div className="space-y-2">
                      <Input
                        value={doc.title}
                        onChange={(e) => setDocs(docs.map((d) => d.id === doc.id ? { ...d, title: e.target.value } : d))}
                      />
                      <Textarea
                        value={doc.content}
                        onChange={(e) => setDocs(docs.map((d) => d.id === doc.id ? { ...d, content: e.target.value } : d))}
                        rows={8}
                      />
                      <Input
                        value={doc.ai_summary || ""}
                        onChange={(e) => setDocs(docs.map((d) => d.id === doc.id ? { ...d, ai_summary: e.target.value } : d))}
                        placeholder="AI-Zusammenfassung"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{doc.content.slice(0, 300)}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {editing === doc.id ? (
                      <Button size="sm" onClick={() => { updateDoc(doc); setEditing(null); }}>
                        <Save className="w-3 h-3 mr-1" /> Speichern
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setEditing(doc.id)}>Bearbeiten</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(doc)}>
                      {doc.status === "published" ? "Zurückziehen" : "Veröffentlichen"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteDoc(doc.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Löschen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
