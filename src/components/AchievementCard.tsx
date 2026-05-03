import { Share2, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon_emoji: string;
  xp_reward: number;
}

interface Props {
  achievement: Achievement;
  unlockedAt?: string;
  onShare?: (id: string) => void;
  className?: string;
}

export default function AchievementCard({ achievement, unlockedAt, onShare, className }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${achievement.icon_emoji} ${achievement.title} – ${achievement.description}\n\nVerdient bei Hufi! 🎉`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("In Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all group",
      className
    )}>
      <div className="text-center mb-3">
        <span className="text-4xl block mb-2">{achievement.icon_emoji}</span>
        <h4 className="text-sm font-bold">{achievement.title}</h4>
        <p className="text-[11px] text-muted-foreground mt-1">{achievement.description}</p>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        {unlockedAt && (
          <span>🔓 {new Date(unlockedAt).toLocaleDateString("de-DE")}</span>
        )}
        <span className="text-primary font-medium">+{achievement.xp_reward} XP</span>
      </div>

      <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1 text-[10px] px-2 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Kopiert" : "Kopieren"}
        </button>
        {onShare && (
          <button
            onClick={() => onShare(achievement.id)}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] px-2 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Share2 className="w-3 h-3" />
            Teilen
          </button>
        )}
      </div>
    </div>
  );
}
