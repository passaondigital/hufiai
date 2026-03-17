import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Loader2, X, FileText, Image as ImageIcon, Mic, MicOff, Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export type AiMode = "scout" | "canvas" | "analyst" | "agent" | "auto";

interface SmartChip {
  label: string;
  prompt: string;
  mode?: AiMode;
  icon?: React.ReactNode;
}

interface PendingFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  status: "uploading" | "extracting" | "ready" | "error";
  id?: string;
  extractedText?: string;
}

interface FavoritePrompt {
  id: string;
  title: string;
  prompt: string;
}

interface OmniBoxProps {
  input: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pendingFiles: PendingFile[];
  onRemoveFile: (name: string) => void;
  loading: boolean;
  uploading: boolean;
  disabled?: boolean;
  selectedHorseName?: string;
  smartChips: SmartChip[];
  onChipClick: (chip: SmartChip) => void;
  activeMode: AiMode;
  onModeChange: (mode: AiMode) => void;
  showChips?: boolean;
  favoritePrompts?: FavoritePrompt[];
  onFavoritePromptClick?: (prompt: FavoritePrompt) => void;
}

const MODE_CONFIG: Record<AiMode, { label: string; labelEn: string; color: string; icon: string }> = {
  auto: { label: "Auto", labelEn: "Auto", color: "bg-muted text-foreground", icon: "✨" },
  scout: { label: "Recherche", labelEn: "Research", color: "bg-blue-500/10 text-blue-600", icon: "🔍" },
  canvas: { label: "Erstellen", labelEn: "Create", color: "bg-primary/10 text-primary", icon: "🎨" },
  analyst: { label: "Analyse", labelEn: "Analysis", color: "bg-emerald-500/10 text-emerald-600", icon: "📊" },
  agent: { label: "Aktion", labelEn: "Action", color: "bg-purple-500/10 text-purple-600", icon: "⚡" },
};

export default function OmniBox({
  input, onInputChange, onSend, onFileSelect, pendingFiles, onRemoveFile,
  loading, uploading, disabled, selectedHorseName, smartChips, onChipClick,
  activeMode, onModeChange, showChips = true, favoritePrompts = [], onFavoritePromptClick,
}: OmniBoxProps) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-3.5 h-3.5" />;
    return <FileText className="w-3.5 h-3.5" />;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* Smart Chips */}
      {showChips && smartChips.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {smartChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => onChipClick(chip)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-foreground hover:border-primary/50 hover:bg-accent transition-all"
            >
              {chip.icon && <span className="text-sm">{chip.icon}</span>}
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Favorite Prompts Quick Access */}
      {showChips && favoritePrompts.length > 0 && !input.trim() && (
        <div className="flex flex-wrap gap-2 px-1">
          {favoritePrompts.slice(0, 5).map(fp => (
            <button
              key={fp.id}
              onClick={() => onFavoritePromptClick?.(fp)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-all"
            >
              <BookOpen className="w-3 h-3" />
              {fp.title.length > 25 ? fp.title.slice(0, 25) + "…" : fp.title}
            </button>
          ))}
          <button
            onClick={() => navigate("/prompts")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            Alle Prompts →
          </button>
        </div>
      )}

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {pendingFiles.map((file, i) => (
            <div
              key={`${file.fileName}-${i}`}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                file.status === "error"
                  ? "border-destructive/50 bg-destructive/5 text-destructive"
                  : file.status === "ready"
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {file.status === "uploading" || file.status === "extracting" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                getFileIcon(file.fileType)
              )}
              <span className="max-w-[120px] truncate">{file.fileName}</span>
              {file.status === "extracting" && <span className="text-[10px] opacity-70">{lang === "de" ? "Analysiere…" : "Analyzing…"}</span>}
              {file.status === "ready" && file.extractedText && (
                <span className="text-[10px] text-primary">✓</span>
              )}
              <button onClick={() => onRemoveFile(file.fileName)} className="ml-0.5 hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input */}
      <div className="relative bg-card rounded-2xl border border-border shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
        {/* Mode selector row */}
        <div className="flex items-center gap-1 px-3 pt-2.5 pb-0">
          {(Object.entries(MODE_CONFIG) as [AiMode, typeof MODE_CONFIG["auto"]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => onModeChange(key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                activeMode === key ? cfg.color + " ring-1 ring-current/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{lang === "de" ? cfg.label : cfg.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedHorseName
            ? (lang === "de" ? `Frage zu ${selectedHorseName}...` : `Question about ${selectedHorseName}...`)
            : (lang === "de" ? "Frag HufiAi alles rund ums Pferd..." : "Ask HufiAi anything about horses...")}
          className="w-full bg-transparent text-sm outline-none px-4 py-3 resize-none placeholder:text-muted-foreground min-h-[44px] max-h-[160px]"
          rows={1}
          disabled={disabled}
        />

        {/* Action buttons row */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title={lang === "de" ? "Datei anhängen" : "Attach file"}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-8 w-8"
              title={lang === "de" ? "Foto aufnehmen" : "Take photo"}
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={onSend}
            size="icon"
            disabled={(!input.trim() && pendingFiles.filter(f => f.status === "ready").length === 0) || loading || disabled}
            className="rounded-xl h-9 w-9"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.txt,.md,.csv,.json,.docx"
          onChange={onFileSelect}
        />
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        ⚖️ {lang === "de"
          ? "HufiAi ist eine KI-Assistenz. Informationen ersetzen keine fachliche Beratung."
          : "HufiAi is an AI assistant. Information does not replace professional advice."}
      </p>
    </div>
  );
}
