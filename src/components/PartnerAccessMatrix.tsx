import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { hufmanagerClient } from "@/lib/hufmanager-client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2, Handshake, Eye, EyeOff, CalendarCheck, Stethoscope,
  Shield, UserPlus, Trash2, Search, Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AccessGrant {
  id: string;
  client_id: string;
  provider_id: string;
  can_view_basic: boolean;
  can_view_medical: boolean;
  can_create_appointments: boolean;
  is_active: boolean;
  status: string;
  granted_at: string;
}

interface PartnerProfile {
  id: string;
  full_name: string;
  email: string;
  readable_id: string;
  role: string;
}

export default function PartnerAccessMatrix() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState<(AccessGrant & { partnerName?: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const isProvider = profile?.user_type === "gewerbe";

  const fetchGrants = useCallback(async () => {
    if (!profile?.ecosystem_id) return;
    setLoading(true);
    try {
      const data = await hufmanagerClient.select("access_grants", {
        select: "id, client_id, provider_id, can_view_basic, can_view_medical, can_create_appointments, is_active, status, granted_at",
      });

      // Enrich with partner names
      const enriched = await Promise.all(
        (data || []).map(async (grant: AccessGrant) => {
          const partnerId = isProvider ? grant.provider_id : grant.client_id;
          // The "partner" in this context is the other party
          // For a provider: the partner is listed as provider_id in access_grants
          // For a client: the partner is listed as client_id
          try {
            const profiles = await hufmanagerClient.select("profiles", {
              filters: {},
              select: "full_name, readable_id",
              limit: 1,
            });
            return {
              ...grant,
              partnerName: profiles?.[0]?.full_name || "Unbekannt",
            };
          } catch {
            return { ...grant, partnerName: "Unbekannt" };
          }
        })
      );

      setGrants(enriched);
    } catch (err: any) {
      console.error("Error fetching access grants:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.ecosystem_id, isProvider]);

  useEffect(() => {
    fetchGrants();
  }, [fetchGrants]);

  const togglePermission = async (grantId: string, field: string, value: boolean) => {
    setSaving(grantId);
    try {
      await hufmanagerClient.update("access_grants", grantId, { [field]: value });
      setGrants((prev) =>
        prev.map((g) => (g.id === grantId ? { ...g, [field]: value } : g))
      );
      toast.success("Berechtigung aktualisiert");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  const toggleActive = async (grantId: string, isActive: boolean) => {
    setSaving(grantId);
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
      toast.success(isActive ? "Zugriff aktiviert" : "Zugriff deaktiviert");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  };

  const revokeGrant = async (grantId: string) => {
    try {
      await hufmanagerClient.delete("access_grants", grantId);
      setGrants((prev) => prev.filter((g) => g.id !== grantId));
      toast.success("Zugriff widerrufen");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredGrants = grants.filter(
    (g) =>
      !searchQuery ||
      g.partnerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.includes(searchQuery)
  );

  if (!profile?.ecosystem_id) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-2 mb-2">
        <Handshake className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Partner-Berechtigungen (#prid)</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {isProvider
          ? "Steuere, welche externen Partner (Tierärzte, Therapeuten) auf deine Kundendaten zugreifen dürfen."
          : "Steuere, welche Dienstleister und Partner auf deine Pferdedaten zugreifen dürfen."}
      </p>

      {/* Info banner */}
      <div className="flex items-start gap-2 bg-muted/50 rounded-xl p-3 mb-4 border border-border">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Partner mit Rolle <Badge variant="outline" className="text-xs mx-1">#prid</Badge> haben standardmäßig keinen Schreibzugriff.
          Du kannst einzelne Berechtigungen pro Partner aktivieren oder deaktivieren.
        </p>
      </div>

      {/* Search */}
      {grants.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Partner suchen…"
            className="pl-9"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredGrants.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Keine Partner-Verknüpfungen vorhanden.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Partner-Zugriffe werden über den HufManager erstellt.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGrants.map((grant) => (
            <div
              key={grant.id}
              className={`rounded-xl border p-4 transition-colors ${
                grant.is_active ? "border-border bg-background" : "border-border/50 bg-muted/30 opacity-70"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{grant.partnerName || "Partner"}</span>
                  <Badge
                    variant={grant.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {grant.status === "active" ? "Aktiv" : grant.status === "pending" ? "Ausstehend" : "Deaktiviert"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {/* Master toggle */}
                  <Switch
                    checked={grant.is_active}
                    onCheckedChange={(v) => toggleActive(grant.id, v)}
                    disabled={saving === grant.id}
                  />

                  {/* Revoke */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/60 hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Zugriff widerrufen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Der Partner verliert sofort den Zugriff auf alle freigegebenen Daten. Dies kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={() => revokeGrant(grant.id)}>Widerrufen</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Permission toggles */}
              {grant.is_active && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <PermissionToggle
                    icon={<Eye className="w-4 h-4" />}
                    label="Basisdaten"
                    description="Name, Rasse, Standort"
                    checked={grant.can_view_basic}
                    disabled={saving === grant.id}
                    onChange={(v) => togglePermission(grant.id, "can_view_basic", v)}
                  />
                  <PermissionToggle
                    icon={<Stethoscope className="w-4 h-4" />}
                    label="Medizinische Daten"
                    description="Hufanalysen, Gesundheit"
                    checked={grant.can_view_medical}
                    disabled={saving === grant.id}
                    onChange={(v) => togglePermission(grant.id, "can_view_medical", v)}
                  />
                  <PermissionToggle
                    icon={<CalendarCheck className="w-4 h-4" />}
                    label="Termine erstellen"
                    description="Kann Termine anlegen"
                    checked={grant.can_create_appointments}
                    disabled={saving === grant.id}
                    onChange={(v) => togglePermission(grant.id, "can_create_appointments", v)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PermissionToggle({
  icon,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-lg p-3 border transition-colors ${
      checked ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent"
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={checked ? "text-primary" : "text-muted-foreground"}>{icon}</span>
          <span className="text-xs font-medium truncate">{label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="shrink-0" />
    </div>
  );
}
