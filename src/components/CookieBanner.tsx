import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_KEY = "hufiai_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_KEY);
    if (!saved) setVisible(true);
  }, []);

  const save = (preferences: CookiePreferences) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(preferences));
    setVisible(false);
  };

  const acceptAll = () => save({ necessary: true, analytics: true, marketing: true });
  const acceptSelected = () => save(prefs);
  const declineOptional = () => save({ necessary: true, analytics: false, marketing: false });

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 animate-fade-in">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Cookie-Einstellungen</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Wir verwenden Cookies, um dir die bestmögliche Erfahrung zu bieten. Du kannst deine Präferenzen jederzeit anpassen. Alle Daten werden DSGVO-konform in Deutschland verarbeitet.
            </p>
          </div>
        </div>

        {/* Expandable categories */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-primary mb-3 hover:underline"
        >
          Einstellungen anpassen {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {expanded && (
          <div className="space-y-3 mb-4 p-4 rounded-xl bg-muted/50 border border-border">
            {[
              { key: "necessary" as const, label: "Notwendig", desc: "Erforderlich für grundlegende Funktionen.", locked: true },
              { key: "analytics" as const, label: "Analytik", desc: "Hilft uns, die Nutzung zu verstehen und zu verbessern." },
              { key: "marketing" as const, label: "Marketing", desc: "Ermöglicht personalisierte Inhalte und Werbung." },
            ].map((cat) => (
              <label key={cat.key} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs[cat.key]}
                  disabled={cat.locked}
                  onChange={(e) => setPrefs((p) => ({ ...p, [cat.key]: e.target.checked }))}
                  className="w-4 h-4 rounded accent-primary"
                />
              </label>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={acceptAll} size="sm" className="text-xs">
            Alle akzeptieren
          </Button>
          {expanded && (
            <Button onClick={acceptSelected} variant="outline" size="sm" className="text-xs">
              Auswahl speichern
            </Button>
          )}
          <Button onClick={declineOptional} variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Nur notwendige
          </Button>
        </div>
      </div>
    </div>
  );
}
