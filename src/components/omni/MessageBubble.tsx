import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FileText, Image as ImageIcon, ArrowLeft, ArrowRight, History } from "lucide-react";
import { toast } from "sonner";
import MessageActions from "@/components/MessageActions";
import EditPrompt from "@/components/EditPrompt";

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
  const [showActions, setShowActions] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentVersionIdx, setCurrentVersionIdx] = useState<number | null>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-3.5 h-3.5" />;
    return <FileText className="w-3.5 h-3.5" />;
  };

  const handleExportMd = () => {
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

  const handleExportTxt = () => {
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
    <>
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
            {role === "assistant" ? (
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

          {/* Action buttons (extracted component) */}
          <MessageActions
            role={role}
            content={content}
            messageId={messageId}
            visible={showActions}
            onEdit={role === "user" && onEdit && messageId ? () => setEditDialogOpen(true) : undefined}
            onRegenerate={onRegenerate}
            onImprove={onImprove}
            onSimplify={onSimplify}
            onExtractActions={onExtractActions}
            onExtractInsights={onExtractInsights}
            onCreateSummary={onCreateSummary}
            onExtractAsChat={onExtractAsChat}
            onExportMd={handleExportMd}
            onExportTxt={handleExportTxt}
          />
        </div>
      </div>

      {/* Edit dialog for user messages */}
      {messageId && onEdit && (
        <EditPrompt
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          originalContent={content}
          onSave={(newContent) => onEdit(messageId, newContent)}
        />
      )}
    </>
  );
}
