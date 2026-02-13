import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Building2, Sparkles, ArrowRight } from "lucide-react";

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"privat" | "gewerbe" | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!user || !userType) return;
    setLoading(true);
    try {
      const updates: any = {
        user_type: userType,
        onboarding_completed: true,
      };
      if (userType === "gewerbe") updates.company_name = companyName;

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);
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
            <span className="text-2xl font-bold">HufiAi</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Willkommen! Wie nutzt du HufiAi?</h1>
          <p className="text-muted-foreground">Wähle deinen Kontotyp – du kannst jederzeit wechseln.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setUserType("privat")}
            className={`p-6 rounded-2xl border-2 transition-all text-left ${
              userType === "privat"
                ? "border-primary bg-accent shadow-md"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <User className="w-8 h-8 mb-3 text-primary" />
            <h3 className="font-semibold text-lg">Privat</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Für private Pferdebesitzer und Reiter
            </p>
          </button>
          <button
            onClick={() => setUserType("gewerbe")}
            className={`p-6 rounded-2xl border-2 transition-all text-left ${
              userType === "gewerbe"
                ? "border-primary bg-accent shadow-md"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <Building2 className="w-8 h-8 mb-3 text-primary" />
            <h3 className="font-semibold text-lg">Gewerbe</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Für Betriebe, Kliniken und Dienstleister
            </p>
          </button>
        </div>

        {userType === "gewerbe" && (
          <div className="mb-6 animate-fade-in">
            <Label htmlFor="company">Firmenname</Label>
            <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="z.B. Reiterhof Musterstadt" className="mt-2" />
          </div>
        )}

        <Button onClick={handleComplete} disabled={!userType || loading} className="w-full" size="lg">
          Weiter
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
