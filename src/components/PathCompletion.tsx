import { CheckCircle2, Share2, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  pathTitle: string;
  pathEmoji: string;
  badgeTitle?: string;
  badgeEmoji?: string;
  xpEarned: number;
  onShare?: () => void;
  onNextPath?: () => void;
  nextPathTitle?: string;
  className?: string;
}

export default function PathCompletion({
  pathTitle,
  pathEmoji,
  badgeTitle,
  badgeEmoji,
  xpEarned,
  onShare,
  onNextPath,
  nextPathTitle,
  className,
}: Props) {
  return (
    <div className={cn("bg-card border border-primary/20 rounded-2xl p-8 text-center", className)}>
      <div className="mb-4">
        <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-extrabold">Lernpfad abgeschlossen! 🎉</h2>
        <p className="text-muted-foreground mt-1">{pathEmoji} {pathTitle}</p>
      </div>

      {badgeTitle && (
        <div className="bg-primary/5 rounded-xl p-4 mb-4 inline-block mx-auto">
          <span className="text-5xl block mb-2">{badgeEmoji || "🏆"}</span>
          <p className="text-sm font-bold">{badgeTitle}</p>
          <p className="text-[10px] text-muted-foreground">Badge freigeschaltet!</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-1 text-primary font-bold mb-6">
        <Sparkles className="w-4 h-4" />
        +{xpEarned} XP verdient
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onShare && (
          <Button variant="outline" onClick={onShare} className="gap-2">
            <Share2 className="w-4 h-4" />
            Teilen
          </Button>
        )}
        {onNextPath && nextPathTitle && (
          <Button onClick={onNextPath} className="gap-2">
            {nextPathTitle}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
