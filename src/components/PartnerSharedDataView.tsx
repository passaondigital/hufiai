import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { hufmanagerClient } from "@/lib/hufmanager-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2, Handshake, Eye, Stethoscope, CalendarCheck, Shield, User,
} from "lucide-react";

interface SharedGrant {
  id: string;
  provider_id?: string;
  client_id?: string;
  grantor_name?: string;
  grantor_role?: string;
  can_view_basic: boolean;
  can_view_medical: boolean;
  can_create_appointments: boolean;
  is_active: boolean;
  status: string;
  granted_at?: string;
}

export default function PartnerSharedDataView() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState<SharedGrant[]>([]);

  const fetchSharedData = useCallback(async () => {
    if (!profile?.ecosystem_id) return;
    setLoading(true);
    try {
      // Fetch grants where this user is the partner (recipient)
      const data = await hufmanagerClient.select("access_grants", {
        select:
          "id, provider_id, client_id, can_view_basic, can_view_medical, can_create_appointments, is_active, status, granted_at",
        limit: 100,
      });

      // Enrich with grantor info
      const enriched = await Promise.all(
        (data || []).map(async (grant: any) => {
          // The grantor is whoever created this grant (provider_id or client_id)
          const grantorId = grant.provider_id || grant.client_id;
          let grantorName = "Unbekannt";
          let grantorRole = "provider";
          if (grantorId) {
            try {
              const profiles = await hufmanagerClient.select("profiles", {
                filters: {},
                select: "full_name, role, readable_id",
                limit: 1,
              });
              if (profiles?.[0]) {
                grantorName = profiles[0].full_name || profiles[0].readable_id || "Unbekannt";
                grantorRole = profiles[0].role || "provider";
              }
            } catch {
              // ignore
            }
          }
          return { ...grant, grantor_name: grantorName, grantor_role: grantorRole };
        })
      );

      setGrants(enriched);
    } catch (err: any) {
      console.error("Error fetching shared data:", err);
      toast.error("Fehler beim Laden der Freigaben");
    } finally {
      setLoading(false);
    }
  }, [profile?.ecosystem_id]);

  useEffect(() => {
    fetchSharedData();
  }, [fetchSharedData]);

  if (!profile?.ecosystem_id) return null;

  const activeGrants = grants.filter((g) => g.is_active);
  const pendingGrants = grants.filter((g) => g.status === "pending");

  const roleLabels: Record<string, string> = {
    provider: "Hufbearbeiter (#pid)",
    client: "Pferdebesitzer (#kid)",
    business: "Betrieb (#bid)",
    employee: "Mitarbeiter (#mid)",
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Handshake className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Freigegebene Daten für dich (#prid)</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Hier siehst du, welche Daten dir von Providern und Pferdebesitzern freigegeben wurden.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{activeGrants.length}</p>
            <p className="text-xs text-muted-foreground">Aktive Freigaben</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-warning">{pendingGrants.length}</p>
            <p className="text-xs text-muted-foreground">Ausstehend</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : grants.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Du hast noch keine Datenfreigaben erhalten.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sobald ein Provider oder Pferdebesitzer dir Zugriff gewährt, erscheinen die Freigaben hier.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {grants.map((grant) => (
              <Card
                key={grant.id}
                className={`transition-colors ${
                  !grant.is_active ? "opacity-50" : ""
                }`}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{grant.grantor_name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {roleLabels[grant.grantor_role || "provider"] || grant.grantor_role}
                      </Badge>
                    </div>
                    <Badge
                      variant={
                        grant.status === "active"
                          ? "default"
                          : grant.status === "pending"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {grant.status === "active"
                        ? "Aktiv"
                        : grant.status === "pending"
                        ? "Ausstehend"
                        : "Deaktiviert"}
                    </Badge>
                  </div>

                  {/* Granted date */}
                  {grant.granted_at && (
                    <p className="text-[10px] text-muted-foreground mb-2">
                      Freigegeben am{" "}
                      {new Date(grant.granted_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}

                  {/* Permissions */}
                  <div className="flex flex-wrap gap-2">
                    <PermBadge
                      icon={<Eye className="w-3 h-3" />}
                      label="Basisdaten"
                      granted={grant.can_view_basic}
                    />
                    <PermBadge
                      icon={<Stethoscope className="w-3 h-3" />}
                      label="Medizin"
                      granted={grant.can_view_medical}
                    />
                    <PermBadge
                      icon={<CalendarCheck className="w-3 h-3" />}
                      label="Termine"
                      granted={grant.can_create_appointments}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PermBadge({
  icon,
  label,
  granted,
}: {
  icon: React.ReactNode;
  label: string;
  granted: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border ${
        granted
          ? "bg-primary/5 text-primary border-primary/20"
          : "bg-muted/30 text-muted-foreground border-border line-through"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}
