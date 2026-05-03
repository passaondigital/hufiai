import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CookiePreferences {
  necessary: boolean;
  operation: boolean;
  innovation: boolean;
}

const COOKIE_KEY = "hufiai_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    operation: false,
    innovation: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_KEY);
    if (!saved) setVisible(true);
  }, []);

  const applyPreferences = async (preferences: CookiePreferences) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(preferences));
    setVisible(false);

    // If innovation (training data) is accepted, update the user profile if logged in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ is_data_contribution_active: preferences.innovation })
          .eq("user_id", user.id);
      }
    } catch {
      // Not logged in or error – silently ignore
    }
  };

  const acceptAll = () =>
    applyPreferences({ necessary: true, operation: true, innovation: true });

  const acceptEssentialOnly = () =>
    applyPreferences({ necessary: true, operation: false, innovation: false });

  const acceptSelected = () => applyPreferences(prefs);

  if (!visible) return null;

  const categories = [
    {
      key: "necessary" as const,
      label: "Experience",
      emoji: "🛡️",
      desc: "Session-Cookies für Login, Sicherheit & Grundfunktionen. Immer aktiv.",
      locked: true,
    },
    {
      key: "operation" as const,
      label: "Operation",
      emoji: "⚙️",
      desc: "Stripe-Zahlungen, Google-Authentifizierung & Analyse zur Verbesserung der Plattform.",
    },
    {
      key: "innovation" as const,
      label: "Innovation",
      emoji: "🚀",
      desc: "Anonymisiertes KI-Training (Hufi Core). Deine Daten helfen, das Modell stetig zu verbessern.",
    },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 animate-fade-in">
      <div className="max-w-2xl mx-auto rounded-2xl shadow-2xl border border-[#F47B20]/20 bg-card/95 backdrop-blur-lg overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#F47B20] via-[#F9A825] to-[#F47B20]" />

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#F47B20]/10 flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5 text-[#F47B20]" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Mission Control – Cookie-Einstellungen
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Wähle, welche Systeme du aktivieren möchtest. Alle Daten werden DSGVO-konform in
                Deutschland verarbeitet.{" "}
                <Link
                  to="/datenschutz"
                  className="underline text-[#F47B20] hover:text-[#F47B20]/80 transition-colors"
                >
                  Datenschutzerklärung
                </Link>
              </p>
            </div>
          </div>

          {/* Expandable toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-[#F47B20] mb-3 hover:underline"
          >
            Systeme konfigurieren{" "}
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {expanded && (
            <div className="space-y-3 mb-4 p-4 rounded-xl bg-muted/50 border border-border">
              {categories.map((cat) => (
                <label
                  key={cat.key}
                  className="flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{cat.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.desc}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs[cat.key]}
                    disabled={cat.locked}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, [cat.key]: e.target.checked }))
                    }
                    className="w-4 h-4 rounded accent-[#F47B20] shrink-0"
                  />
                </label>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={acceptAll}
              size="sm"
              className="text-xs bg-[#F47B20] hover:bg-[#F47B20]/90 text-white"
            >
              Alles erlauben
            </Button>
            {expanded && (
              <Button
                onClick={acceptSelected}
                variant="outline"
                size="sm"
                className="text-xs border-[#F47B20]/30 text-[#F47B20] hover:bg-[#F47B20]/10"
              >
                Auswahl speichern
              </Button>
            )}
            <Button
              onClick={acceptEssentialOnly}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
            >
              Nur das Nötigste
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
