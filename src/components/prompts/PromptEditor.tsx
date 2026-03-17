import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CATEGORIES = [
  { key: "business", label: "Business" },
  { key: "content", label: "Content" },
  { key: "analyse", label: "Analyse" },
  { key: "coaching", label: "Coaching" },
  { key: "kreativ", label: "Kreativ" },
];

interface PromptEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle?: string;
  initialContent?: string;
  initialCategory?: string;
  initialDescription?: string;
  initialDifficulty?: string;
  isEditing?: boolean;
  onSave: (data: { title: string; content: string; category: string; description: string; difficulty: string }) => void;
}

export default function PromptEditor({
  open, onOpenChange, initialTitle = "", initialContent = "", initialCategory = "business",
  initialDescription = "", initialDifficulty = "beginner", isEditing = false, onSave,
}: PromptEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [category, setCategory] = useState(initialCategory);
  const [description, setDescription] = useState(initialDescription);
  const [difficulty, setDifficulty] = useState(initialDifficulty);

  // Sync when props change (e.g. editing different prompt)
  const reset = () => {
    setTitle(initialTitle); setContent(initialContent); setCategory(initialCategory);
    setDescription(initialDescription); setDifficulty(initialDifficulty);
  };

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Prompt bearbeiten" : "Neuen Prompt erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Titel</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. Huf-Befund analysieren" className="mt-1" />
          </div>
          <div>
            <Label>Prompt</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Dein Prompt-Text..." className="mt-1 min-h-[120px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kategorie</Label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Schwierigkeit</Label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="beginner">Einfach</option>
                <option value="intermediate">Mittel</option>
                <option value="advanced">Fortgeschritten</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Beschreibung (optional)</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Kurze Beschreibung" className="mt-1" />
          </div>
          <Button onClick={() => { onSave({ title, content, category, description, difficulty }); onOpenChange(false); }}
            disabled={!title.trim() || !content.trim()} className="w-full">
            {isEditing ? "Speichern" : "Prompt erstellen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
