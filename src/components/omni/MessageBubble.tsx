import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { 
  FileText, Image as ImageIcon, Copy, Check, Edit3, RotateCcw, 
  Wand2, Minimize2, ListChecks, Lightbulb, FileDown, ChevronDown,
  History, ArrowLeft, ArrowRight, Scissors, MessageSquarePlus
} from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface Attachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  extractedText?: string;
}

export interface MessageVersion {
  content: string;
  timestamp: number;
  type: "original" | "edit" | "improve" | "simplify" | "regenerate";
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  messageId?: string;
  versions?: MessageVersion[];
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  onImprove?: (id: string) => void;
  onSimplify?: (id: string) => void;
  onExtractActions?: (content: string) => void;
  onExtractInsights?: (content: string) => void;
  onCreateSummary?: (content: string) => void;
  onExtractAsChat?: (content: string) => void;
  onExportMessage?: (content: string, format: "md" | "txt") => void;
}

export default function MessageBubble({ 
  role, content, attachments, messageId, versions,
  onEdit, onRegenerate, onImprove, onSimplify,
  onExtractActions, onExtractInsights, onCreateSummary,
  onExtractAsChat, onExportMessage
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showActions, setShowActions] = useState(false);
  const [currentVersionIdx, setCurrentVersionIdx] = useState<number | null>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-3.5 h-3.5" />;
    return <FileText className="w-3.5 h-3.5" />;
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (messageId && onEdit && editContent.trim()) {
      onEdit(messageId, editContent.trim());
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setEditing(false);
  };

  const handleExportMd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExportMessage) onExportMessage(content, "md");
    else {
      const blob = new Blob([`## ${role === "user" ? "Du" : "HufiAi"}\n\n${content}`], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `nachricht-${Date.now()}.md`;
      a.click(); URL.revokeObjectURL(url);
      toast.success("Als Markdown exportiert");
    }
  };

  const handleExportTxt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExportMessage) onExportMessage(content, "txt");
    else {
      const blob = new Blob([`${role === "user" ? "Du" : "HufiAi"}:\n\n${content}`], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `nachricht-${Date.now()}.txt`;
      a.click(); URL.revokeObjectURL(url);
      toast.success("Als Text exportiert");
    }
  };

  const hasVersions = versions && versions.length > 1;
  const displayedVersion = currentVersionIdx !== null && versions ? versions[currentVersionIdx] : null;
  const displayContent = displayedVersion ? displayedVersion.content : content;

  const navigateVersion = (dir: "prev" | "next") => {
    if (!versions || versions.length <= 1) return;
    if (currentVersionIdx === null) {
      setCurrentVersionIdx(dir === "prev" ? versions.length - 2 : versions.length - 1);
    } else {
      const next = dir === "prev" ? currentVersionIdx - 1 : currentVersionIdx + 1;
      if (next < 0 || next >= versions.length) {
        setCurrentVersionIdx(null);
      } else {
        setCurrentVersionIdx(next);
      }
    }
  };

  return (
    <div
      className={`group flex ${role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="relative max-w-[80%]">
        {/* Message bubble */}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          role === "user"
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border rounded-bl-md"
        }`}>
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full min-h-[60px] bg-background/50 text-foreground rounded-lg p-2 text-sm border border-border outline-none resize-none"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button onClick={handleCancelEdit} className="px-2 py-1 text-xs rounded-lg hover:bg-muted transition-colors">
                  Abbrechen
                </button>
                <button onClick={handleSaveEdit} className="px-2 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  Speichern & Neu generieren
                </button>
              </div>
            </div>
          ) : role === "assistant" ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{displayContent}</ReactMarkdown>
            </div>
          ) : (
            displayContent
          )}
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-primary-foreground/20">
              {attachments.map((att, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-foreground/10 text-xs">
                  {getFileIcon(att.fileType)}
                  {att.fileName}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Version navigation */}
        {hasVersions && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
            <History className="w-3 h-3" />
            <button onClick={() => navigateVersion("prev")} className="p-0.5 rounded hover:bg-muted"><ArrowLeft className="w-3 h-3" /></button>
            <span>
              {currentVersionIdx !== null ? `Version ${currentVersionIdx + 1}/${versions!.length}` : `Aktuell (${versions!.length} Versionen)`}
            </span>
            <button onClick={() => navigateVersion("next")} className="p-0.5 rounded hover:bg-muted"><ArrowRight className="w-3 h-3" /></button>
          </div>
        )}

        {/* Action buttons */}
        {!editing && (
          <div className={`absolute ${role === "user" ? "right-0" : "left-0"} -bottom-8 flex items-center gap-0.5 transition-opacity z-10 ${
            showActions ? "opacity-100" : "opacity-0"
          }`}>
            {/* Copy */}
            <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Kopieren">
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* User message actions */}
            {role === "user" && onEdit && messageId && (
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Bearbeiten">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Assistant message actions */}
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

                {/* More actions dropdown */}
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
                    <DropdownMenuItem onClick={handleExportMd} className="gap-2 text-xs">
                      <FileDown className="w-3.5 h-3.5" /> Als Markdown exportieren
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportTxt} className="gap-2 text-xs">
                      <FileDown className="w-3.5 h-3.5" /> Als Text exportieren
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
