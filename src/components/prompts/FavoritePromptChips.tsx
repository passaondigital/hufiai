import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen } from "lucide-react";

interface FavoritePrompt {
  id: string;
  title: string;
  content: string;
}

interface FavoritePromptChipsProps {
  userId: string;
  onPromptClick: (content: string) => void;
  visible?: boolean;
}

export default function FavoritePromptChips({ userId, onPromptClick, visible = true }: FavoritePromptChipsProps) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoritePrompt[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_favorite_prompts" as any)
      .select("id, custom_name, prompt_id, prompt_library:prompt_id(id, title, content)")
      .eq("user_id", userId)
      .order("position", { ascending: true })
      .limit(8)
      .then(({ data }) => {
        if (data) {
          setFavorites((data as any[]).map((f: any) => ({
            id: f.prompt_library?.id || f.prompt_id,
            title: f.custom_name || f.prompt_library?.title || "Prompt",
            content: f.prompt_library?.content || "",
          })).filter((f: any) => f.content));
        }
      });
  }, [userId]);

  if (!visible || favorites.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1">
      {favorites.slice(0, 8).map(fp => (
        <button
          key={fp.id}
          onClick={() => onPromptClick(fp.content)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-all"
          title={fp.content.slice(0, 100)}
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
  );
}
