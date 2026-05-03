import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

const APP_NAMES: Record<string, string> = {
  hufmanager: "HufManager",
  hufiai: "Hufi",
  hufiapp: "HufiApp",
  memberhorse: "MemberHorse",
};

export function useEcosystemRealtime() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("ecosystem-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ecosystem_links",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          const appName = APP_NAMES[newRow.app_key] || newRow.app_key;

          if (oldRow.status !== newRow.status) {
            if (newRow.status === "connected") {
              toast.success(`${appName} verbunden`, {
                description: "Die App wurde erfolgreich mit deinem Ecosystem verknüpft.",
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
              });
            } else if (newRow.status === "not_connected") {
              toast.warning(`${appName} getrennt`, {
                description: "Die Verbindung zur App wurde getrennt.",
                icon: <XCircle className="w-4 h-4 text-destructive" />,
              });
            } else if (newRow.status === "update_required") {
              toast.info(`${appName} – Update nötig`, {
                description: "Die App benötigt ein Update für die Ecosystem-Verbindung.",
                icon: <RefreshCw className="w-4 h-4 text-amber-500" />,
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ecosystem_links",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          const appName = APP_NAMES[newRow.app_key] || newRow.app_key;

          if (newRow.status === "connected") {
            toast.success(`${appName} verbunden`, {
              description: "Neue Ecosystem-Verbindung hergestellt.",
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
