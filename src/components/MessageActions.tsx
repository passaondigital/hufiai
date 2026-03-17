import { useState } from "react";
import { Copy, Check, Edit3, RotateCcw, Wand2, Minimize2, ChevronDown, ListChecks, Lightbulb, FileText, FileDown, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface MessageActionsProps {
  role: "user" | "assistant";
  content: string;
  messageId?: string;
  visible: boolean;
  onEdit?: () => void;
  onRegenerate?: (id: string) => void;
  onImprove?: (id: string) => void;
  onSimplify?: (id: string) => void;
  onExtractActions?: (content: string) => void;
  onExtractInsights?: (content: string) => void;
  onCreateSummary?: (content: string) => void;
  onExtractAsChat?: (content: string) => void;
  onExportMd?: () => void;
  onExportTxt?: () => void;
}

export default function MessageActions({
  role, content, messageId, visible,
  onEdit, onRegenerate, onImprove, onSimplify,
  onExtractActions, onExtractInsights, onCreateSummary,
  onExtractAsChat, onExportMd, onExportTxt
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`absolute ${role === "user" ? "right-0" : "left-0"} -bottom-8 flex items-center gap-0.5 transition-opacity z-10 ${
      visible ? "opacity-100" : "opacity-0"
    }`}>
      {/* Copy */}
      <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Kopieren">
        {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {/* User: Edit */}
      {role === "user" && onEdit && messageId && (
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Bearbeiten">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Assistant actions */}
      {role === "assistant" && (
        <>
          {onRegenerate && messageId && (
            <button onClick={() => onRegenerate(messageId)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Neu generieren">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {onImprove && messageId && (
            <button onClick={() => onImprove(messageId)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Verbessern">
              <Wand2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onSimplify && messageId && (
            <button onClick={() => onSimplify(messageId)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Vereinfachen">
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {onExtractActions && (
                <DropdownMenuItem onClick={() => onExtractActions(content)} className="gap-2 text-xs">
                  <ListChecks className="w-3.5 h-3.5" /> Action Items extrahieren
                </DropdownMenuItem>
              )}
              {onExtractInsights && (
                <DropdownMenuItem onClick={() => onExtractInsights(content)} className="gap-2 text-xs">
                  <Lightbulb className="w-3.5 h-3.5" /> Key Insights extrahieren
                </DropdownMenuItem>
              )}
              {onCreateSummary && (
                <DropdownMenuItem onClick={() => onCreateSummary(content)} className="gap-2 text-xs">
                  <FileText className="w-3.5 h-3.5" /> Zusammenfassung / TL;DR
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onExtractAsChat && (
                <DropdownMenuItem onClick={() => onExtractAsChat(content)} className="gap-2 text-xs">
                  <MessageSquarePlus className="w-3.5 h-3.5" /> Als neuen Chat extrahieren
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onExportMd && (
                <DropdownMenuItem onClick={onExportMd} className="gap-2 text-xs">
                  <FileDown className="w-3.5 h-3.5" /> Als Markdown exportieren
                </DropdownMenuItem>
              )}
              {onExportTxt && (
                <DropdownMenuItem onClick={onExportTxt} className="gap-2 text-xs">
                  <FileDown className="w-3.5 h-3.5" /> Als Text exportieren
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
