import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Files, Loader2, FileDown, Upload, Clock, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string | null;
  folder: string | null;
}

export default function BatchPdfExport() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [format, setFormat] = useState<"separate_pdfs" | "combined_pdf">("separate_pdfs");
  const [template, setTemplate] = useState("report");
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoDrive, setAutoDrive] = useState(false);
  const [driveFolder, setDriveFolder] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("conversations")
      .select("id, title, updated_at, folder")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setConversations(data || []);
        setLoading(false);
      });
  }, [user]);

  const filtered = conversations.filter(c =>
    !searchQuery || (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(c => c.id));
    }
  };

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const startExport = async () => {
    if (selectedIds.length === 0) { toast.error("Keine Chats ausgewählt"); return; }
    if (!user) return;
    setGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Nicht eingeloggt");

      // Create batch record
      const { data: batchRecord, error: batchErr } = await supabase.from("pdf_batch_exports").insert({
        user_id: user.id,
        conversation_ids: selectedIds,
        export_status: "processing",
        output_format: format,
      }).select().single();

      if (batchErr) throw batchErr;

      // Generate PDFs
      const payload = {
        conversation_ids: selectedIds,
        batch_action: format === "combined_pdf" ? "combined" : "individual",
        template,
        include_prompts: true,
        include_metadata: true,
        include_toc: true,
      };

      const res = await supabase.functions.invoke("generate-pdf", { body: payload });
      if (res.error) throw res.error;

      // Download
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "combined_pdf"
        ? `HufiAi-Sammelexport-${Date.now()}.pdf`
        : `HufiAi-Batch-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update batch status
      await supabase.from("pdf_batch_exports").update({
        export_status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", batchRecord.id);

      // Auto-upload to Google Drive if enabled
      if (autoDrive) {
        try {
          const driveToken = localStorage.getItem("google_drive_token");
          if (driveToken) {
            const content = await blob.text();
            await supabase.functions.invoke("export-to-drive", {
              body: {
                action: "upload",
                access_token: driveToken,
                content,
                file_name: `HufiAi-Export-${new Date().toISOString().slice(0, 10)}.pdf`,
                folder_id: driveFolder || undefined,
              },
            });
            toast.success("PDF auch in Google Drive hochgeladen!");
          } else {
            toast.info("Google Drive nicht verbunden – PDF nur lokal gespeichert");
          }
        } catch {
          toast.error("Google Drive Upload fehlgeschlagen");
        }
      }

      toast.success(`${selectedIds.length} Chat(s) erfolgreich exportiert!`);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.message || "Export fehlgeschlagen");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Export-Format</Label>
          <Select value={format} onValueChange={v => setFormat(v as typeof format)}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="separate_pdfs">Einzelne PDFs</SelectItem>
              <SelectItem value="combined_pdf">Kombiniertes PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Vorlage</Label>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="report">📋 Report</SelectItem>
              <SelectItem value="proposal">💼 Proposal</SelectItem>
              <SelectItem value="guide">📖 Guide</SelectItem>
              <SelectItem value="meeting">📝 Meeting Notes</SelectItem>
              <SelectItem value="private">🐴 Privat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Google Drive */}
      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <div>
              <Label className="text-sm">Auto-Upload Google Drive</Label>
              <p className="text-[10px] text-muted-foreground">PDFs direkt in Drive speichern</p>
            </div>
          </div>
          <Switch checked={autoDrive} onCheckedChange={setAutoDrive} />
        </div>
        {autoDrive && (
          <Input
            value={driveFolder}
            onChange={e => setDriveFolder(e.target.value)}
            placeholder="Ordner-ID (optional)"
            className="h-7 text-xs"
          />
        )}
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Chats durchsuchen…"
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Selection header */}
      <div className="flex items-center justify-between">
        <button onClick={toggleAll} className="text-xs text-primary hover:underline">
          {selectedIds.length === filtered.length ? "Keine auswählen" : "Alle auswählen"}
        </button>
        <Badge variant="secondary" className="text-[10px]">
          {selectedIds.length} / {filtered.length} ausgewählt
        </Badge>
      </div>

      {/* Conversation list */}
      <Card className="overflow-hidden">
        <ScrollArea className="h-[280px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Keine Chats gefunden</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(c => (
                <label
                  key={c.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors",
                    selectedIds.includes(c.id) && "bg-accent"
                  )}
                >
                  <Checkbox
                    checked={selectedIds.includes(c.id)}
                    onCheckedChange={() => toggle(c.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{c.title || "Unbenannter Chat"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.updated_at ? new Date(c.updated_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }) : "–"}
                      {c.folder && <span className="ml-2">📁 {c.folder}</span>}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Export button */}
      <Button onClick={startExport} disabled={generating || selectedIds.length === 0} className="w-full">
        {generating ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Export läuft…</>
        ) : (
          <><FileDown className="w-4 h-4 mr-2" /> {selectedIds.length} Chat(s) exportieren</>
        )}
      </Button>
    </div>
  );
}
