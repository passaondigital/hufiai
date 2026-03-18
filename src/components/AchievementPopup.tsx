import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Achievement {
  icon_emoji: string;
  title: string;
  description: string;
  xp_reward: number;
}

interface Props {
  achievement: Achievement;
  onDismiss: () => void;
}

export default function AchievementPopup({ achievement, onDismiss }: Props) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-[100] max-w-sm w-full transition-all duration-300",
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      )}
    >
      <div className="bg-card border border-primary/30 rounded-2xl shadow-lg shadow-primary/10 p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
            {achievement.icon_emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Achievement Unlocked!</span>
            </div>
            <h4 className="font-bold text-sm">{achievement.title}</h4>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs font-medium text-primary">+{achievement.xp_reward} XP</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => { navigate("/knowledge"); onDismiss(); }}
              >
                Profil ansehen
              </Button>
            </div>
          </div>
          <button
            onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
