import ReactMarkdown from "react-markdown";
import { FileText, Image as ImageIcon } from "lucide-react";

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
}

export default function MessageBubble({ role, content, attachments }: MessageBubbleProps) {
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-3.5 h-3.5" />;
    return <FileText className="w-3.5 h-3.5" />;
  };

  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        role === "user"
          ? "bg-primary text-primary-foreground rounded-br-md"
          : "bg-card border border-border rounded-bl-md"
      }`}>
        {role === "assistant" ? (
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
    </div>
  );
}
