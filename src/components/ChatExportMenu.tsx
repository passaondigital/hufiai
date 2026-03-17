import { useState } from "react";
import { Download, Copy, FileText, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatExportMenuProps {
  messages: Message[];
  conversationId: string | null;
  onExportPdf?: () => void;
}

export default function ChatExportMenu({ messages, conversationId, onExportPdf }: ChatExportMenuProps) {
  const [exporting, setExporting] = useState(false);

  const exportAsText = () => {
    const text = messages
      .map(m => `${m.role === "user" ? "👤 Du" : "🤖 HufiAi"}:\n${m.content}`)
      .join("\n\n---\n\n");
    
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `HufiAi-Chat-${Date.now()}.txt`);
    toast.success("Chat als Text exportiert");
  };

  const exportAsMarkdown = () => {
    const md = `# HufiAi Chat Export\n_${new Date().toLocaleDateString("de-DE")}_\n\n` +
      messages
        .map(m => `## ${m.role === "user" ? "👤 Du" : "🤖 HufiAi"}\n\n${m.content}`)
        .join("\n\n---\n\n");
    
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, `HufiAi-Chat-${Date.now()}.md`);
    toast.success("Chat als Markdown exportiert");
  };

  const copyAll = () => {
    const text = messages
      .map(m => `${m.role === "user" ? "Du" : "HufiAi"}:\n${m.content}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Gesamter Chat kopiert!");
  };

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

  if (messages.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" title="Chat exportieren">
          <Download className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyAll} className="gap-2">
          <Copy className="w-4 h-4" />
          Alles kopieren
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsText} className="gap-2">
          <FileText className="w-4 h-4" />
          Als Text (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsMarkdown} className="gap-2">
          <FileText className="w-4 h-4" />
          Als Markdown (.md)
        </DropdownMenuItem>
        {onExportPdf && (
          <DropdownMenuItem onClick={onExportPdf} className="gap-2">
            <FileDown className="w-4 h-4" />
            Als PDF-Bericht
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
