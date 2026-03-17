import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, RotateCcw } from "lucide-react";

interface EditPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalContent: string;
  onSave: (newContent: string) => void;
}

export default function EditPrompt({ open, onOpenChange, originalContent, onSave }: EditPromptProps) {
  const [newContent, setNewContent] = useState(originalContent);

  const handleSave = () => {
    if (newContent.trim() && newContent.trim() !== originalContent.trim()) {
      onSave(newContent.trim());
      onOpenChange(false);
    }
  };

  const hasChanges = newContent.trim() !== originalContent.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <RotateCcw className="w-4 h-4 text-primary" />
            Nachricht bearbeiten & neu generieren
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Original */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Original</p>
            <div className="p-3 rounded-xl bg-muted/50 text-sm text-muted-foreground leading-relaxed max-h-32 overflow-y-auto">
              {originalContent}
            </div>
          </div>

          {/* New */}
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Neue Version</p>
            <Textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="min-h-[80px] text-sm"
              autoFocus
            />
          </div>

          {/* Diff indicator */}
          {hasChanges && (
            <p className="text-xs text-primary flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Änderungen erkannt – KI generiert neue Antwort
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || !newContent.trim()}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Speichern & Neu generieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
