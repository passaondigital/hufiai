import { Star, StarOff, Copy, Edit3, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface PromptItem {
  id: string;
  title: string;
  content: string;
  category: string;
  description: string | null;
  use_cases: string[];
  difficulty: string;
  is_system: boolean;
  created_by: string | null;
  is_favorite?: boolean;
  favorite_id?: string | null;
  custom_name?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  business: "Business",
  content: "Content",
  analyse: "Analyse",
  coaching: "Coaching",
  kreativ: "Kreativ",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Einfach",
  intermediate: "Mittel",
  advanced: "Fortgeschritten",
};

interface PromptCardProps {
  prompt: PromptItem;
  userId?: string;
  onUse: (prompt: PromptItem) => void;
  onToggleFavorite: (prompt: PromptItem) => void;
  onEdit: (prompt: PromptItem) => void;
  onDelete: (id: string) => void;
}

export default function PromptCard({ prompt, userId, onUse, onToggleFavorite, onEdit, onDelete }: PromptCardProps) {
  const copyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.content);
    toast.success("Prompt kopiert!");
  };

  return (
    <Card className="p-4 hover:border-primary/30 transition-all group cursor-pointer" onClick={() => onUse(prompt)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm leading-tight">{prompt.custom_name || prompt.title}</h3>
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(prompt); }}
          className="p-1 rounded-lg hover:bg-accent transition-colors shrink-0"
        >
          {prompt.is_favorite
            ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            : <StarOff className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
        </button>
      </div>

      {prompt.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{prompt.description}</p>
      )}

      <p className="text-xs text-foreground/70 line-clamp-3 mb-3 font-mono bg-muted/50 rounded-lg p-2">
        {prompt.content}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {CATEGORY_LABELS[prompt.category] || prompt.category}
          </Badge>
          {prompt.difficulty && prompt.difficulty !== "beginner" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {DIFFICULTY_LABELS[prompt.difficulty] || prompt.difficulty}
            </Badge>
          )}
          {prompt.is_system && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">System</Badge>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={copyPrompt} className="p-1.5 rounded-lg hover:bg-accent" title="Kopieren">
            <Copy className="w-3.5 h-3.5" />
          </button>
          {prompt.created_by === userId && !prompt.is_system && (
            <>
              <button onClick={e => { e.stopPropagation(); onEdit(prompt); }} className="p-1.5 rounded-lg hover:bg-accent" title="Bearbeiten">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(prompt.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive" title="Löschen">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {prompt.use_cases && prompt.use_cases.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {prompt.use_cases.slice(0, 3).map((uc, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground">{uc}</span>
          ))}
        </div>
      )}
    </Card>
  );
}
