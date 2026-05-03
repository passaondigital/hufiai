import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useDevicePermissions, PermissionStatus } from "@/hooks/useDevicePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download, Smartphone, Camera, MapPin, Bell, HardDrive,
  CheckCircle2, XCircle, AlertCircle, ChevronRight, X, Share
} from "lucide-react";

const STATUS_ICON: Record<PermissionStatus, React.ReactNode> = {
  granted: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  denied: <XCircle className="w-4 h-4 text-destructive" />,
  prompt: <AlertCircle className="w-4 h-4 text-[hsl(var(--sidebar-muted))]" />,
  unsupported: <XCircle className="w-4 h-4 text-[hsl(var(--sidebar-muted))] opacity-40" />,
};

const STATUS_LABEL: Record<PermissionStatus, string> = {
  granted: "Erlaubt",
  denied: "Verweigert",
  prompt: "Ausstehend",
  unsupported: "Nicht verfügbar",
};

export default function PWAInstallPrompt({ onDismiss }: { onDismiss: () => void }) {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const { permissions, checkAll, requestCamera, requestLocation, requestNotifications, requestStorage } = useDevicePermissions();
  const [step, setStep] = useState<"install" | "permissions">(isInstalled ? "permissions" : "install");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkAll();
  }, [checkAll]);

  const handleInstall = async () => {
    const accepted = await install();
    if (accepted) setStep("permissions");
  };

  const handleSkipInstall = () => setStep("permissions");

  const handleRequestAll = async () => {
    await requestNotifications();
    await requestCamera();
    await requestLocation();
    await requestStorage();
    await checkAll();
  };

  const allGranted = permissions.camera === "granted" && permissions.location === "granted" 
    && permissions.notifications === "granted" && permissions.storage === "granted";

  const handleDone = () => {
    localStorage.setItem("hufi_pwa_prompt_dismissed", "true");
    setDismissed(true);
    onDismiss();
  };

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="bg-secondary p-6 text-center relative">
          <button onClick={handleDone} className="absolute top-3 right-3 p-1 rounded-full hover:bg-accent transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Hufi installieren</h2>
          <p className="text-sm text-muted-foreground mt-1">Nutze Hufi als App auf deinem Gerät</p>
        </div>

        <div className="p-6 space-y-5">
          {step === "install" && (
            <>
              {isInstalled ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-foreground">App bereits installiert</p>
                    <p className="text-xs text-muted-foreground">Hufi läuft als installierte App.</p>
                  </div>
                </div>
              ) : isIOS ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-accent border border-border">
                    <p className="font-semibold text-sm text-foreground mb-2">So installierst du auf iPhone/iPad:</p>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
                        Tippe auf <Share className="w-4 h-4 inline text-primary" /> (Teilen-Button)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
                        Wähle „Zum Home-Bildschirm"
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                        Tippe auf „Hinzufügen"
                      </li>
                    </ol>
                  </div>
                </div>
              ) : canInstall ? (
                <Button onClick={handleInstall} className="w-full h-14 text-base font-bold gap-3 rounded-xl">
                  <Download className="w-5 h-5" />
                  App jetzt installieren
                </Button>
              ) : (
                <div className="p-4 rounded-xl bg-accent border border-border text-center">
                  <p className="text-sm text-muted-foreground">Installation über das Browser-Menü möglich. Öffne ⋮ → „App installieren"</p>
                </div>
              )}

              <Button variant="ghost" onClick={handleSkipInstall} className="w-full text-sm text-muted-foreground">
                Überspringen – Berechtigungen einrichten <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}

          {step === "permissions" && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Für die beste Nutzung benötigt Hufi folgende Berechtigungen:
              </p>

              <div className="space-y-2">
                {[
                  { key: "notifications" as const, icon: Bell, label: "Push-Benachrichtigungen", desc: "Updates & Partner-Einladungen", request: requestNotifications },
                  { key: "camera" as const, icon: Camera, label: "Kamera", desc: "Hufi Scan & Fotoanalyse", request: requestCamera },
                  { key: "location" as const, icon: MapPin, label: "Standort", desc: "Experten in deiner Nähe", request: requestLocation },
                  { key: "storage" as const, icon: HardDrive, label: "Speicher", desc: "Offline-Daten & generierte Inhalte", request: requestStorage },
                ].map(perm => (
                  <div key={perm.key} className="flex items-center justify-between p-3 rounded-xl border border-border bg-accent/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <perm.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{perm.label}</p>
                        <p className="text-xs text-muted-foreground">{perm.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {permissions[perm.key] === "prompt" ? (
                        <Button size="sm" variant="outline" onClick={perm.request} className="text-xs h-7 px-2">
                          Erlauben
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {STATUS_ICON[permissions[perm.key]]}
                          <span className="text-xs text-muted-foreground">{STATUS_LABEL[permissions[perm.key]]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {!allGranted && (
                  <Button onClick={handleRequestAll} className="flex-1 gap-2 rounded-xl">
                    Alle erlauben
                  </Button>
                )}
                <Button variant={allGranted ? "default" : "outline"} onClick={handleDone} className="flex-1 rounded-xl">
                  {allGranted ? "Fertig – App starten" : "Später"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
