import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import hufiaiLogo from "@/assets/hufiai-logo.svg";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }
    if (password.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Passwort erfolgreich geändert!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Zurücksetzen");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center animate-fade-in">
          <img src={hufiaiLogo} alt="HufiAi" className="h-16 mx-auto mb-4" />
          <p className="text-muted-foreground">Kein gültiger Passwort-Reset-Link erkannt.</p>
          <Button onClick={() => navigate("/auth")} className="mt-4">Zur Anmeldung</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img src={hufiaiLogo} alt="HufiAi" className="h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Neues Passwort setzen</h1>
          <p className="text-muted-foreground text-sm">Gib dein neues Passwort ein</p>
        </div>
        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Neues Passwort</Label>
              <Input id="password" type="password" required minLength={6} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Mindestens 6 Zeichen" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Passwort bestätigen</Label>
              <Input id="confirm" type="password" required minLength={6} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} placeholder="Nochmal eingeben" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Passwort ändern
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
