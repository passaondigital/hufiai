import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface DocEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  module_name: string | null;
  ai_summary: string | null;
  sort_order: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  module: "📦 Modul",
  faq: "❓ FAQ",
  guide: "📖 Anleitung",
  general: "📝 Allgemein",
};

export default function Manual() {
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("system_documentation")
      .select("id, title, content, category, module_name, ai_summary, sort_order")
      .eq("is_public", true)
      .eq("status", "published")
      .order("sort_order")
      .then(({ data }) => {
        setDocs((data as DocEntry[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = docs.filter((d) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return d.title.toLowerCase().includes(term) || d.content.toLowerCase().includes(term) || d.module_name?.toLowerCase().includes(term);
  });

  const grouped = filtered.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {} as Record<string, DocEntry[]>);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Zurück</span>
          </Link>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Hufi Handbuch
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Handbuch & FAQ</h2>
          <p className="text-muted-foreground">Alles was du über Hufi wissen musst – automatisch aktualisiert.</p>
        </div>

        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suchen…" className="pl-10" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Noch keine Dokumentation veröffentlicht.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <section key={cat} className="space-y-3">
              <h3 className="font-semibold text-lg">{CATEGORY_LABELS[cat] || cat}</h3>
              {items.map((doc) => (
                <div key={doc.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
                    className="w-full text-left p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      {doc.ai_summary && <p className="text-xs text-muted-foreground mt-1">{doc.ai_summary}</p>}
                    </div>
                    {doc.module_name && <Badge variant="outline" className="text-xs shrink-0">{doc.module_name}</Badge>}
                  </button>
                  {expanded === doc.id && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-wrap border-t border-border pt-3">
                      {doc.content}
                    </div>
                  )}
                </div>
              ))}
            </section>
          ))
        )}

        <p className="text-xs text-muted-foreground text-center pt-4">
          📖 Dieses Handbuch wird automatisch aktualisiert wenn neue Module hinzugefügt werden.
        </p>
      </main>
    </div>
  );
}
