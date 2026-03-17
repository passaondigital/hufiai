import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FileText, Image as ImageIcon, Copy, Check, Edit3, Trash2, RotateCcw, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface Attachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  extractedText?: string;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  messageId?: string;
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
  onRegenerate?: (id: string) => void;
}

export default function MessageBubble({ role, content, attachments, messageId, onEdit, onDelete, onRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showActions, setShowActions] = useState(false);

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
                  Speichern
                </button>
              </div>
            </div>
          ) : role === "assistant" ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            content
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

        {/* Action buttons */}
        {!editing && (
          <div className={`absolute ${role === "user" ? "right-0" : "left-0"} -bottom-7 flex items-center gap-0.5 transition-opacity ${
            showActions ? "opacity-100" : "opacity-0"
          }`}>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              title="Kopieren"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {role === "user" && onEdit && messageId && (
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                title="Bearbeiten"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {role === "assistant" && onRegenerate && messageId && (
              <button
                onClick={() => onRegenerate(messageId)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                title="Neu generieren"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
