import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { hufmanagerClient } from "@/lib/hufmanager-client";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Handshake, Eye, Stethoscope, CalendarCheck, Shield, Bell, CheckCircle2, XCircle } from "lucide-react";

interface AccessGrant {
  id: string;
  partner_email?: string;
  partner_name?: string;
  can_view_basic: boolean;
  can_view_medical: boolean;
  can_create_appointments: boolean;
  is_active: boolean;
  status: string;
  granted_at?: string;
}

interface PartnerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

interface ActivePartnersOverviewProps {
  refreshKey?: number;
}

export default function ActivePartnersOverview({ refreshKey }: ActivePartnersOverviewProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);

  const fetchGrants = useCallback(async () => {
    if (!profile?.ecosystem_id) return;
    setLoading(true);
    try {
      const data = await hufmanagerClient.select("access_grants", {
        select: "id, partner_email, partner_name, can_view_basic, can_view_medical, can_create_appointments, is_active, status, granted_at",
        order: { column: "granted_at", ascending: false },
        limit: 50,
      });
      setGrants(data || []);
    } catch (err: any) {
      console.error("Error fetching partner grants:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.ecosystem_id]);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.ecosystem_id) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, type, created_at")
      .or("title.ilike.%Einladung angenommen%,title.ilike.%Einladung abgelehnt%")
      .order("created_at", { ascending: false })
      .limit(5);
    setNotifications(data || []);
  }, [profile?.ecosystem_id]);

  useEffect(() => {
    fetchGrants();
    fetchNotifications();
  }, [fetchGrants, fetchNotifications, refreshKey]);

  // Realtime: listen for new partner notifications
  useEffect(() => {
    if (!profile?.ecosystem_id) return;

    const channel = supabase
      .channel("partner-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const row = payload.new as any;
          if (
            row.title?.includes("Einladung angenommen") ||
            row.title?.includes("Einladung abgelehnt")
          ) {
            fetchNotifications();
            fetchGrants();
            toast(row.title, { description: row.message });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.ecosystem_id, fetchNotifications, fetchGrants]);

  const toggleActive = async (grantId: string, isActive: boolean) => {
    setToggling(grantId);
    try {
      await hufmanagerClient.update("access_grants", grantId, {
        is_active: isActive,
        status: isActive ? "active" : "rejected",
      });
      setGrants((prev) =>
        prev.map((g) =>
          g.id === grantId ? { ...g, is_active: isActive, status: isActive ? "active" : "rejected" } : g
        )
      );
      toast.success(isActive ? "Partner-Zugriff aktiviert" : "Partner-Zugriff deaktiviert");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setToggling(null);
    }
  };

  if (!profile?.ecosystem_id) return null;

  const activeGrants = grants.filter((g) => g.is_active);
  const inactiveGrants = grants.filter((g) => !g.is_active);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Handshake className="w-4 h-4 text-primary" />
          Partner-Zugriffe
          {!loading && (
            <Badge variant="secondary" className="text-xs ml-auto">
              {activeGrants.length} aktiv
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Partner notifications */}
        {notifications.length > 0 && (
          <div className="space-y-2 mb-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-2 rounded-lg p-3 border text-xs ${
                  notif.type === "success"
                    ? "bg-primary/5 border-primary/20"
                    : "bg-destructive/5 border-destructive/20"
                }`}
              >
                {notif.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="font-medium">{notif.title}</p>
                  <p className="text-muted-foreground mt-0.5">{notif.message}</p>
                  <p className="text-muted-foreground/60 mt-1">
                    {new Date(notif.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : grants.length === 0 ? (
          <div className="text-center py-6">
            <Shield className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Keine Partner-Zugriffe vorhanden.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {grants.map((grant) => (
              <div
                key={grant.id}
                className={`flex items-center justify-between rounded-lg p-3 border transition-colors ${
                  grant.is_active ? "border-border bg-background" : "border-border/50 bg-muted/30 opacity-60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {grant.partner_name || grant.partner_email || "Partner"}
                    </span>
                    <Badge
                      variant={grant.status === "active" ? "default" : grant.status === "pending" ? "secondary" : "outline"}
                      className="text-[10px] shrink-0"
                    >
                      {grant.status === "active" ? "Aktiv" : grant.status === "pending" ? "Ausstehend" : "Deaktiviert"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {grant.can_view_basic && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> Basis
                      </span>
                    )}
                    {grant.can_view_medical && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Stethoscope className="w-3 h-3" /> Medizin
                      </span>
                    )}
                    {grant.can_create_appointments && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <CalendarCheck className="w-3 h-3" /> Termine
                      </span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={grant.is_active}
                  onCheckedChange={(v) => toggleActive(grant.id, v)}
                  disabled={toggling === grant.id}
                  className="shrink-0 ml-3"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
