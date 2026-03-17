import { useState } from "react";
import { Download, Copy, FileText, FileDown, Code, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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

  const exportAsText = () => {
    const text = messages
      .map(m => `${m.role === "user" ? "👤 Du" : "🤖 HufiAi"}:\n${m.content}`)
      .join("\n\n---\n\n");
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `HufiAi-Chat-${Date.now()}.txt`);
    toast.success("Chat als Text exportiert");
  };

  const exportAsMarkdown = () => {
    const md = `# HufiAi Chat Export\n_${new Date().toLocaleDateString("de-DE")}_\n\n` +
      messages
        .map(m => `## ${m.role === "user" ? "👤 Du" : "🤖 HufiAi"}\n\n${m.content}`)
        .join("\n\n---\n\n");
    downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), `HufiAi-Chat-${Date.now()}.md`);
    toast.success("Chat als Markdown exportiert");
  };

  const exportAsHtml = () => {
    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HufiAi Chat Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; background: #fafafa; color: #1a1a1a; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #e5e5e5; margin-bottom: 30px; }
    .header h1 { font-size: 24px; margin: 0; }
    .header p { color: #666; margin: 8px 0 0; font-size: 14px; }
    .watermark { text-align: center; color: #999; font-size: 11px; padding: 20px 0; border-top: 1px solid #e5e5e5; margin-top: 30px; }
    .msg { margin: 16px 0; display: flex; }
    .msg-user { justify-content: flex-end; }
    .msg-ai { justify-content: flex-start; }
    .bubble { max-width: 75%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.6; }
    .msg-user .bubble { background: #2563eb; color: white; border-bottom-right-radius: 4px; }
    .msg-ai .bubble { background: white; border: 1px solid #e5e5e5; border-bottom-left-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐴 HufiAi Chat</h1>
    <p>${new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
  </div>
  ${messages.map(m => `
  <div class="msg msg-${m.role === "user" ? "user" : "ai"}">
    <div class="bubble">${m.content.replace(/\n/g, "<br>")}</div>
  </div>`).join("")}
  <div class="watermark">Exportiert von HufiAi · hufiai.lovable.app</div>
</body>
</html>`;
    downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `HufiAi-Chat-${Date.now()}.html`);
    toast.success("Chat als HTML exportiert");
  };

  const copyAll = () => {
    const text = messages
      .map(m => `${m.role === "user" ? "Du" : "HufiAi"}:\n${m.content}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Gesamter Chat kopiert!");
  };

  if (messages.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" title="Chat exportieren">
          <Download className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={copyAll} className="gap-2">
          <Copy className="w-4 h-4" /> Alles kopieren
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAsText} className="gap-2">
          <FileText className="w-4 h-4" /> Als Text (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsMarkdown} className="gap-2">
          <FileText className="w-4 h-4" /> Als Markdown (.md)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsHtml} className="gap-2">
          <Code className="w-4 h-4" /> Als HTML (mit Branding)
        </DropdownMenuItem>
        {onExportPdf && (
          <DropdownMenuItem onClick={onExportPdf} className="gap-2">
            <FileDown className="w-4 h-4" /> Als PDF-Bericht
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
