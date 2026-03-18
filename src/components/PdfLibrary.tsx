import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileText, Download, Trash2, Share2, Search, Loader2, Clock, FileDown, Archive, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfExport {
  id: string;
  pdf_title: string | null;
  file_url: string | null;
  file_size: number | null;
  page_count: number | null;
  created_at: string | null;
  downloaded_count: number | null;
  format_options: Record<string, unknown> | null;
  template_id: string | null;
  conversation_id: string | null;
}

type SortBy = "newest" | "oldest" | "name" | "size";

export default function PdfLibrary() {
  const { user } = useAuth();
  const [exports, setExports] = useState<PdfExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadExports = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("pdf_exports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setExports(data as unknown as PdfExport[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadExports(); }, [user]);

  const filtered = exports
    .filter(e => !searchQuery || (e.pdf_title || "").toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (sortBy === "oldest") return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      if (sortBy === "name") return (a.pdf_title || "").localeCompare(b.pdf_title || "");
      if (sortBy === "size") return (b.file_size || 0) - (a.file_size || 0);
      return 0;
    });

  const handleDownload = async (exp: PdfExport) => {
    if (!exp.file_url) {
      toast.error("Keine Datei verfügbar");
      return;
    }
    window.open(exp.file_url, "_blank");
    // Increment download count
    await supabase.from("pdf_exports").update({
      downloaded_count: (exp.downloaded_count || 0) + 1,
      last_downloaded_at: new Date().toISOString(),
    }).eq("id", exp.id);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("pdf_exports").delete().eq("id", id);
    if (error) {
      toast.error("Fehler beim Löschen");
    } else {
      setExports(prev => prev.filter(e => e.id !== id));
      toast.success("PDF gelöscht");
    }
    setDeleting(null);
  };

  const handleShareLink = (exp: PdfExport) => {
    if (exp.file_url) {
      navigator.clipboard.writeText(exp.file_url);
      toast.success("Link kopiert!");
    } else {
      toast.error("Kein Link verfügbar");
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "–";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Search & Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="PDFs durchsuchen…"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={sortBy} onValueChange={v => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-[140px] h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Neueste zuerst</SelectItem>
            <SelectItem value="oldest">Älteste zuerst</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="size">Größe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-2.5 text-center">
          <p className="text-lg font-bold text-foreground">{exports.length}</p>
          <p className="text-[10px] text-muted-foreground">Gesamt</p>
        </Card>
        <Card className="p-2.5 text-center">
          <p className="text-lg font-bold text-foreground">
            {formatSize(exports.reduce((sum, e) => sum + (e.file_size || 0), 0))}
          </p>
          <p className="text-[10px] text-muted-foreground">Speicher</p>
        </Card>
        <Card className="p-2.5 text-center">
          <p className="text-lg font-bold text-foreground">
            {exports.reduce((sum, e) => sum + (e.downloaded_count || 0), 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Downloads</p>
        </Card>
      </div>

      {/* List */}
      <ScrollArea className="h-[350px]">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Keine PDFs gefunden" : "Noch keine PDFs exportiert"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(exp => (
              <Card key={exp.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-10 rounded bg-destructive/10 flex items-center justify-center shrink-0">
                    <FileDown className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exp.pdf_title || "Unbenanntes PDF"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {exp.created_at ? new Date(exp.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }) : "–"}
                      </span>
                      {exp.page_count && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1">{exp.page_count} Seiten</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{formatSize(exp.file_size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDownload(exp)}
                      title="Herunterladen"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleShareLink(exp)}
                      title="Link kopieren"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(exp.id)}
                      disabled={deleting === exp.id}
                      title="Löschen"
                    >
                      {deleting === exp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
