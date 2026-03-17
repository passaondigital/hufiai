import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileText, Code, FileDown, Download } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  onExportPdf?: () => void;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function ExportDialog({ open, onOpenChange, messages, onExportPdf }: ExportDialogProps) {
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);

  const exportAs = (format: "txt" | "md" | "html") => {
    const date = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

    if (format === "txt") {
      const text = (includeMetadata ? `HufiAi Chat Export – ${date}\n${"=".repeat(40)}\n\n` : "") +
        messages.map(m => `${m.role === "user" ? "👤 Du" : "🤖 HufiAi"}:\n${m.content}`).join("\n\n---\n\n") +
        (includeWatermark ? "\n\n---\nExportiert von HufiAi" : "");
      downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `HufiAi-Chat-${Date.now()}.txt`);
    } else if (format === "md") {
      const md = (includeMetadata ? `# HufiAi Chat Export\n_${date}_\n\n` : "") +
        messages.map(m => `## ${m.role === "user" ? "👤 Du" : "🤖 HufiAi"}\n\n${m.content}`).join("\n\n---\n\n") +
        (includeWatermark ? "\n\n---\n_Exportiert von HufiAi_" : "");
      downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), `HufiAi-Chat-${Date.now()}.md`);
    } else if (format === "html") {
      const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>HufiAi Chat</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:720px;margin:40px auto;padding:0 20px;background:#fafafa;color:#1a1a1a}.header{text-align:center;padding:20px 0;border-bottom:2px solid #e5e5e5;margin-bottom:30px}.msg{margin:16px 0;display:flex}.msg-user{justify-content:flex-end}.msg-ai{justify-content:flex-start}.bubble{max-width:75%;padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.6}.msg-user .bubble{background:#2563eb;color:white;border-bottom-right-radius:4px}.msg-ai .bubble{background:white;border:1px solid #e5e5e5;border-bottom-left-radius:4px}.watermark{text-align:center;color:#999;font-size:11px;padding:20px 0;border-top:1px solid #e5e5e5;margin-top:30px}</style></head><body>
${includeMetadata ? `<div class="header"><h1>🐴 HufiAi Chat</h1><p>${date}</p></div>` : ""}
${messages.map(m => `<div class="msg msg-${m.role === "user" ? "user" : "ai"}"><div class="bubble">${m.content.replace(/\n/g, "<br>")}</div></div>`).join("")}
${includeWatermark ? '<div class="watermark">Exportiert von HufiAi · hufiai.lovable.app</div>' : ""}
</body></html>`;
      downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `HufiAi-Chat-${Date.now()}.html`);
    }
    toast.success(`Als ${format.toUpperCase()} exportiert`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Chat exportieren
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="metadata" className="text-sm">Datum & Metadaten</Label>
              <Switch id="metadata" checked={includeMetadata} onCheckedChange={setIncludeMetadata} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="watermark" className="text-sm">HufiAi Watermark</Label>
              <Switch id="watermark" checked={includeWatermark} onCheckedChange={setIncludeWatermark} />
            </div>
          </div>

          {/* Format buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-2 h-auto py-3 flex-col" onClick={() => exportAs("txt")}>
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs">Text (.txt)</span>
            </Button>
            <Button variant="outline" className="gap-2 h-auto py-3 flex-col" onClick={() => exportAs("md")}>
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs">Markdown (.md)</span>
            </Button>
            <Button variant="outline" className="gap-2 h-auto py-3 flex-col" onClick={() => exportAs("html")}>
              <Code className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs">HTML</span>
            </Button>
            {onExportPdf && (
              <Button variant="outline" className="gap-2 h-auto py-3 flex-col" onClick={() => { onExportPdf(); onOpenChange(false); }}>
                <FileDown className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs">PDF-Bericht</span>
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            {messages.length} Nachrichten werden exportiert
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
