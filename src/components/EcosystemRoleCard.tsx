import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { hufmanagerClient } from "@/lib/hufmanager-client";
import { Badge } from "@/components/ui/badge";
import { Loader2, Fingerprint, Building2, User, Briefcase, Users, Handshake } from "lucide-react";

interface ExternalProfile {
  id: string;
  role: string;
  readable_id: string;
  organization_id?: string;
  full_name?: string;
}

const ROLE_CONFIG: Record<string, { label: string; prefix: string; color: string; icon: any; description: string }> = {
  provider: {
    label: "Provider",
    prefix: "#pid",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: Briefcase,
    description: "Hufbearbeiter / Dienstleister – verwaltet Kunden und Pferde",
  },
  client: {
    label: "Client",
    prefix: "#kid",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: User,
    description: "Pferdebesitzer – Zugriff auf eigene Pferde und Termine",
  },
  employee: {
    label: "Mitarbeiter",
    prefix: "#mid",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Users,
    description: "Mitarbeiter eines Providers – eingeschränkte Berechtigungen",
  },
  partner: {
    label: "Partner",
    prefix: "#prid",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: Handshake,
    description: "Externer Experte – Lesezugriff auf freigegebene Daten",
  },
  business: {
    label: "Business",
    prefix: "#bid",
    color: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    icon: Building2,
    description: "Organisation / Reitstall – verwaltet mehrere Nutzer",
  },
};

export default function EcosystemRoleCard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [extProfile, setExtProfile] = useState<ExternalProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.ecosystem_id) {
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const data = await hufmanagerClient.select("profiles", {
          filters: {},
          select: "id, role, readable_id, organization_id, full_name",
          limit: 1,
        });
        if (data && data.length > 0) {
          setExtProfile(data[0]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [profile?.ecosystem_id]);

  if (!profile?.ecosystem_id) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Fingerprint className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">Ecosystem-Rolle</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Keine Ecosystem-ID hinterlegt. Verknüpfe dein Profil mit dem HufManager-Ökosystem, um deine Rolle zu sehen.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Rolle wird geladen…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Fingerprint className="w-5 h-5 text-destructive" />
          <h2 className="font-semibold">Ecosystem-Rolle</h2>
        </div>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const roleName = (extProfile?.role || "client").toLowerCase();
  const config = ROLE_CONFIG[roleName] || ROLE_CONFIG.client;
  const RoleIcon = config.icon;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Fingerprint className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Ecosystem-Rolle & ID</h2>
      </div>

      <div className="space-y-4">
        {/* Role badge */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.color}`}>
            <RoleIcon className="w-4 h-4" />
            <span className="font-semibold text-sm">{config.label}</span>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        {/* IDs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Deine ID</p>
            <p className="font-mono font-bold text-sm">
              {extProfile?.readable_id || `${config.prefix}-${profile.ecosystem_id?.substring(0, 8)}`}
            </p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Ecosystem UUID</p>
            <p className="font-mono text-xs text-muted-foreground truncate">{profile.ecosystem_id}</p>
          </div>
        </div>

        {/* Organization info for business/employee */}
        {extProfile?.organization_id && (roleName === "business" || roleName === "employee") && (
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {roleName === "business" ? "Betriebs-ID (#bid)" : "Zugehöriger Betrieb"}
            </p>
            <p className="font-mono font-bold text-sm">
              #bid-{extProfile.organization_id.substring(0, 8)}
            </p>
          </div>
        )}

        {/* Account type mapping */}
        <div className="text-xs text-muted-foreground border-t border-border pt-3 mt-3">
          <p>
            <strong>Hufi Account-Typ:</strong>{" "}
            <Badge variant="outline" className="text-xs ml-1">
              {profile.user_type === "gewerbe" ? "Gewerbe" : "Privat"}
            </Badge>
          </p>
        </div>
      </div>
    </div>
  );
}
