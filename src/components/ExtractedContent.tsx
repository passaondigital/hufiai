import { useState } from "react";
import { CheckCircle2, Circle, Lightbulb, FileText, ChevronDown, ChevronUp, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExtractedContentProps {
  type: "action_items" | "insights" | "summary" | "checklist";
  content: string;
  onSaveToNotes?: (content: string) => void;
}

export default function ExtractedContent({ type, content, onSaveToNotes }: ExtractedContentProps) {
  const [expanded, setExpanded] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const lines = content.split("\n").filter(l => l.trim());

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const icon = type === "action_items" || type === "checklist"
    ? <CheckCircle2 className="w-4 h-4 text-primary" />
    : type === "insights"
    ? <Lightbulb className="w-4 h-4 text-amber-500" />
    : <FileText className="w-4 h-4 text-primary" />;

  const title = type === "action_items" ? "Action Items"
    : type === "insights" ? "Key Insights"
    : type === "summary" ? "Zusammenfassung"
    : "Checkliste";

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
          <span className="text-xs text-muted-foreground">({lines.length})</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5">
          {lines.map((line, idx) => {
            const isCheckable = type === "action_items" || type === "checklist";
            const cleanLine = line.replace(/^[-*•\d.)\]]+\s*/, "").replace(/^\[[ x]\]\s*/, "");

            return (
              <div
                key={idx}
                className={`flex items-start gap-2 text-sm py-1 ${checkedItems.has(idx) ? "line-through text-muted-foreground" : ""}`}
                onClick={isCheckable ? () => toggleCheck(idx) : undefined}
                role={isCheckable ? "button" : undefined}
              >
                {isCheckable ? (
                  checkedItems.has(idx)
                    ? <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    : <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                ) : (
                  <span className="text-muted-foreground mt-0.5">•</span>
                )}
                <span>{cleanLine}</span>
              </div>
            );
          })}

          {onSaveToNotes && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 gap-1.5 text-xs"
              onClick={() => {
                onSaveToNotes(content);
                toast.success("Gespeichert!");
              }}
            >
              <Save className="w-3.5 h-3.5" />
              In Notizen speichern
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
