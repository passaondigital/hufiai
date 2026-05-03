import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Building2, Sparkles, ArrowRight, ArrowLeft, Heart, Shield } from "lucide-react";

const PRIVATE_ROLES = [
  { value: "reiter", label: "Reiter/in", desc: "Aktiver Reitsport" },
  { value: "pferdebesitzer", label: "Pferdebesitzer/in", desc: "Eigene Pferde" },
  { value: "reitbeteiligung", label: "Reitbeteiligung", desc: "Beteiligung an einem Pferd" },
] as const;

const BUSINESS_ROLES = [
  { value: "hufbearbeiter", label: "Hufbearbeiter/in", desc: "Hufschmied, Hufpfleger" },
  { value: "tierarzt", label: "Tierarzt/Tierärztin", desc: "Veterinärmedizin" },
  { value: "stallbetreiber", label: "Stallbetreiber/in", desc: "Reitstall, Pensionsbetrieb" },
] as const;

type SubRole = typeof PRIVATE_ROLES[number]["value"] | typeof BUSINESS_ROLES[number]["value"];

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<"privat" | "gewerbe" | null>(null);
  const [subRole, setSubRole] = useState<SubRole | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [dataConsent, setDataConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = userType === "privat" ? PRIVATE_ROLES : userType === "gewerbe" ? BUSINESS_ROLES : [];

  const handleComplete = async () => {
    if (!user || !userType) return;
    setLoading(true);
    try {
      const updates: any = {
        user_type: userType,
        sub_role: subRole,
        onboarding_completed: true,
        is_data_contribution_active: dataConsent,
      };
      if (userType === "gewerbe") updates.company_name = companyName;

      const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profil eingerichtet!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">Hufi</span>
          </div>
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-2.5 h-2.5 rounded-full transition-colors ${s === step ? "bg-primary" : s < step ? "bg-primary/50" : "bg-border"}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Privat / Gewerbe */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center">Wer bist du?</h1>
            <p className="text-muted-foreground text-center mb-6">Wähle deinen Kontotyp – du kannst jederzeit wechseln.</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button onClick={() => setUserType("privat")} className={`p-6 rounded-2xl border-2 transition-all text-left ${userType === "privat" ? "border-primary bg-accent shadow-md" : "border-border bg-card hover:border-primary/50"}`}>
                <User className="w-8 h-8 mb-3 text-primary" />
                <h3 className="font-semibold text-lg">Privat</h3>
                <p className="text-sm text-muted-foreground mt-1">Reiter, Pferdebesitzer, Reitbeteiligung</p>
              </button>
              <button onClick={() => setUserType("gewerbe")} className={`p-6 rounded-2xl border-2 transition-all text-left ${userType === "gewerbe" ? "border-primary bg-accent shadow-md" : "border-border bg-card hover:border-primary/50"}`}>
                <Building2 className="w-8 h-8 mb-3 text-primary" />
                <h3 className="font-semibold text-lg">Gewerbe</h3>
                <p className="text-sm text-muted-foreground mt-1">Hufbearbeiter, Tierarzt, Stallbetreiber</p>
              </button>
            </div>
            <Button onClick={() => setStep(2)} disabled={!userType} className="w-full" size="lg">
              Weiter <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}

        {/* Step 2: Sub-role + Company */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center">Was beschreibt dich am besten?</h1>
            <p className="text-muted-foreground text-center mb-6">Wähle deine Rolle für personalisierte Funktionen.</p>
            <div className="space-y-3 mb-6">
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSubRole(r.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${subRole === r.value ? "border-primary bg-accent shadow-sm" : "border-border bg-card hover:border-primary/50"}`}
                >
                  <div>
                    <h3 className="font-semibold">{r.label}</h3>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {userType === "gewerbe" && (
              <div className="mb-6">
                <Label htmlFor="company">Firmenname</Label>
                <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="z.B. Reiterhof Musterstadt" className="mt-2" />
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
              </Button>
              <Button onClick={() => setStep(3)} disabled={!subRole} className="flex-1" size="lg">
                Weiter <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Data Privacy Consent */}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center">Hilf mit, Hufi besser zu machen</h1>
            <div className="bg-card rounded-2xl border border-border p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <Heart className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Hufi Datenqualität</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Anonymisierte Praxisdaten helfen dabei, die Assistenzfunktionen für alle Pferdebetriebe zu verbessern. Unser Credo: <strong>Pferdeschutz & Datenschutz zuerst.</strong>
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Wenn du zustimmst, nutzen wir deine Pferdedaten und Fachlogik für Trainingszwecke. Dieser Prozess ist <strong>100% anonymisiert</strong>. Personenbezogene Kundendaten (PII) werden strikt ausgeschlossen. Du trägst zu einer globalen Wissensbasis für Pferdegesundheit bei.
              </p>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Anonymisierte Daten beisteuern</span>
                </div>
                <Switch checked={dataConsent} onCheckedChange={setDataConsent} />
              </div>
              <p className="text-xs text-muted-foreground mt-3">Du kannst diese Einstellung jederzeit unter Einstellungen → Datenschutz ändern.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
              </Button>
              <Button onClick={handleComplete} disabled={loading} className="flex-1" size="lg">
                {loading ? "Wird eingerichtet..." : "Los geht's!"} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
