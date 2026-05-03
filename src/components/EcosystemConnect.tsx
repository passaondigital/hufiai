import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Scissors, Bot, Smartphone, Users,
  CheckCircle2, XCircle, AlertTriangle, Loader2, Link2, RefreshCw
} from "lucide-react";

interface EcosystemApp {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  idLabel: string;
  registerUrl: string;
}

const APPS: EcosystemApp[] = [
  {
    key: "hufmanager",
    name: "HufManager",
    description: "Professionelle Hufbearbeitungs-Verwaltung",
    icon: Scissors,
    idLabel: "#pid",
    registerUrl: "https://hufmanager.de/register",
  },
  {
    key: "hufiai",
    name: "Hufi",
    description: "Digitale Hufakte & Beratungsassistenz",
    icon: Bot,
    idLabel: "#kid",
    registerUrl: "/auth",
  },
  {
    key: "hufiapp",
    name: "HufiApp",
    description: "Mobile Begleiter-App für Pferdebesitzer",
    icon: Smartphone,
    idLabel: "#eqid",
    registerUrl: "https://hufiapp.de/register",
  },
  {
    key: "memberhorse",
    name: "MemberHorse",
    description: "Community- & Mitgliederverwaltung",
    icon: Users,
    idLabel: "#mid",
    registerUrl: "https://memberhorse.de/register",
  },
];

interface LinkRow {
  app_key: string;
  external_id: string | null;
  status: string;
  data_sharing_enabled: boolean;
  message?: string;
}

export default function EcosystemConnect() {
  const { user, session } = useAuth();
  const [links, setLinks] = useState<Record<string, LinkRow>>({});
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!session?.access_token) return;
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-ecosystem", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      const map: Record<string, LinkRow> = {};
      ((data as any)?.apps ?? []).forEach((r: any) => { map[r.app_key] = r; });
      setLinks(map);
    } catch (err) {
      console.error("Ecosystem check failed:", err);
      // Fallback to direct DB read
      const { data } = await supabase
        .from("ecosystem_links")
        .select("app_key, external_id, status, data_sharing_enabled")
        .eq("user_id", user!.id);
      const map: Record<string, LinkRow> = {};
      (data ?? []).forEach((r: any) => { map[r.app_key] = r; });
      setLinks(map);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!user || !session) { setLoading(false); return; }
    fetchStatus();
  }, [user, session]);

  const handleConnect = async (app: EcosystemApp) => {
    if (!user) return;
    setConnecting(app.key);

    const existing = links[app.key];
    if (existing && existing.status === "connected") {
      toast.info(`${app.name} ist bereits verbunden.`);
      setConnecting(null);
      return;
    }

    // For Hufi (current app), auto-connect
    if (app.key === "hufiai") {
      const { error } = await supabase.from("ecosystem_links").upsert({
        user_id: user.id,
        app_key: app.key,
        external_id: user.id,
        status: "connected",
        connected_at: new Date().toISOString(),
      }, { onConflict: "user_id,app_key" });

      if (!error) {
        setLinks(prev => ({
          ...prev,
          [app.key]: { app_key: app.key, external_id: user.id, status: "connected", data_sharing_enabled: false },
        }));
        toast.success(`${app.name} verbunden!`);
      } else {
        toast.error("Verbindung fehlgeschlagen.");
      }
      setConnecting(null);
      return;
    }

    // For external apps, redirect to registration
    window.open(app.registerUrl, "_blank");
    setConnecting(null);
  };

  const toggleSharing = async (appKey: string, enabled: boolean) => {
    if (!user) return;
    const { error } = await supabase
      .from("ecosystem_links")
      .update({ data_sharing_enabled: enabled })
      .eq("user_id", user.id)
      .eq("app_key", appKey);

    if (!error) {
      setLinks(prev => ({
        ...prev,
        [appKey]: { ...prev[appKey], data_sharing_enabled: enabled },
      }));
      toast.success(enabled ? "Datenaustausch aktiviert" : "Datenaustausch deaktiviert");
    }
  };

  const getStatus = (appKey: string) => {
    const link = links[appKey];
    if (!link) return "not_connected";
    return link.status;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Verbunden
          </Badge>
        );
      case "update_required":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">
            <AlertTriangle className="w-3 h-3 mr-1" /> Update nötig
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <XCircle className="w-3 h-3 mr-1" /> Nicht verbunden
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Link2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Ecosystem Connect</h2>
            <p className="text-sm text-muted-foreground">Verknüpfe deine Pascal Schmid Anwendungen</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchStatus} disabled={checking} title="Status prüfen">
          <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {APPS.map((app) => {
          const status = getStatus(app.key);
          const link = links[app.key];
          const isConnected = status === "connected";
          const Icon = app.icon;

          return (
            <Card key={app.key} className="relative overflow-hidden">
              {isConnected && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isConnected ? "bg-emerald-500/10" : "bg-muted"}`}>
                      <Icon className={`w-5 h-5 ${isConnected ? "text-emerald-600" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{app.name}</h3>
                      <p className="text-xs text-muted-foreground">{app.description}</p>
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {link?.external_id && (
                  <div className="text-xs font-mono bg-muted/50 rounded-md px-3 py-1.5 text-muted-foreground">
                    {app.idLabel}: {link.external_id.slice(0, 8)}…
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  {isConnected ? (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <Switch
                        checked={link?.data_sharing_enabled ?? false}
                        onCheckedChange={(v) => toggleSharing(app.key, v)}
                        className="scale-90"
                      />
                      {app.idLabel}-Daten teilen
                    </label>
                  ) : (
                    <span />
                  )}
                  {!isConnected && (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(app)}
                      disabled={connecting === app.key}
                    >
                      {connecting === app.key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verbinden"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Der Datenaustausch zwischen Apps erfolgt nur mit deiner ausdrücklichen Genehmigung.
      </p>
    </div>
  );
}
