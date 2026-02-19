import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadNotifications() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      // Get all notification IDs the user has read
      const { data: reads } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id);

      const readIds = new Set((reads || []).map((r) => r.notification_id));

      // Get recent notifications
      const { data: notifs } = await supabase
        .from("notifications")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(50);

      const unread = (notifs || []).filter((n) => !readIds.has(n.id)).length;
      setCount(unread);
    };

    fetchCount();

    // Realtime: new notifications
    const channel = supabase
      .channel("sidebar-notif-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => fetchCount()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification_reads", filter: `user_id=eq.${user.id}` },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
}
