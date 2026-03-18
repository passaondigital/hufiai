import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export type ActionType =
  | "chat_complete"
  | "use_mode"
  | "use_custom_prompt"
  | "generate_image"
  | "generate_video"
  | "export_chat"
  | "share_achievement"
  | "collaborate_friend"
  | "watch_tutorial"
  | "complete_module"
  | "complete_learning_path"
  | "quiz_correct"
  | "share_learning"
  | "first_share";

interface UserLevel {
  current_level: number;
  current_xp: number;
  xp_for_next_level: number;
  total_xp: number;
  level_up_count: number;
}

interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon_emoji: string;
  xp_reward: number;
}

interface AwardResult {
  xp_earned: number;
  total_xp: number;
  current_level: number;
  xp_for_next_level: number;
  leveled_up: boolean;
  new_level: number | null;
  unlocked_achievements: Achievement[];
}

const LEVEL_EMOJIS: Record<number, string> = {
  1: "🥚", 2: "🐣", 3: "🐥", 4: "🦅", 5: "🦉",
  6: "🚀", 7: "👑", 8: "🔮", 9: "🌟", 10: "💎",
};

const LEVEL_NAMES: Record<number, string> = {
  1: "Newbie", 2: "Curious", 3: "Explorer", 4: "Practitioner", 5: "Master",
  6: "Innovator", 7: "Legend", 8: "Expert", 9: "Oracle", 10: "Sage",
};

export function useGamification() {
  const { user } = useAuth();
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user level
  const fetchUserLevel = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_levels")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserLevel(data as unknown as UserLevel);
    }
    setLoading(false);
  }, [user]);

  // Fetch unlocked achievements
  const fetchAchievements = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_achievements")
      .select("achievement_id, achievements(*)")
      .eq("user_id", user.id);

    if (data) {
      setAchievements(
        data
          .map((d: any) => d.achievements)
          .filter(Boolean) as Achievement[]
      );
    }
  }, [user]);

  useEffect(() => {
    fetchUserLevel();
    fetchAchievements();
  }, [fetchUserLevel, fetchAchievements]);

  // Award XP
  const awardXP = useCallback(
    async (
      actionType: ActionType,
      sourceId?: string,
      meta?: Record<string, any>
    ): Promise<AwardResult | null> => {
      if (!user) return null;

      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        if (!token) return null;

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const resp = await fetch(
          `https://${projectId}.supabase.co/functions/v1/award-xp`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ action_type: actionType, source_id: sourceId, meta }),
          }
        );

        const result: AwardResult = await resp.json();

        if (result.xp_earned) {
          // Update local state
          setUserLevel((prev) =>
            prev
              ? {
                  ...prev,
                  total_xp: result.total_xp,
                  current_level: result.current_level,
                  xp_for_next_level: result.xp_for_next_level,
                }
              : prev
          );

          // Show XP toast
          toast(`+${result.xp_earned} XP`, {
            description: result.leveled_up
              ? `🎉 Level Up! ${LEVEL_EMOJIS[result.current_level]} ${LEVEL_NAMES[result.current_level]}`
              : undefined,
            duration: result.leveled_up ? 5000 : 2000,
          });

          // Show achievement toasts
          for (const ach of result.unlocked_achievements) {
            toast(`${ach.icon_emoji} Achievement: ${ach.title}`, {
              description: ach.description,
              duration: 5000,
            });
          }

          // Refresh achievements if new ones unlocked
          if (result.unlocked_achievements.length > 0) {
            fetchAchievements();
          }
        }

        return result;
      } catch (err) {
        console.error("XP award failed:", err);
        return null;
      }
    },
    [user, fetchAchievements]
  );

  return {
    userLevel,
    achievements,
    loading,
    awardXP,
    refreshLevel: fetchUserLevel,
    refreshAchievements: fetchAchievements,
    levelEmoji: LEVEL_EMOJIS[userLevel?.current_level ?? 1] ?? "🥚",
    levelName: LEVEL_NAMES[userLevel?.current_level ?? 1] ?? "Newbie",
    LEVEL_EMOJIS,
    LEVEL_NAMES,
  };
}
