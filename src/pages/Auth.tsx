import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import horseHero from "@/assets/horse-hero.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Willkommen zurück!");
      } else {
        await signUp(email, password, displayName);
        toast.success("Konto erstellt!");
      }
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Fehler bei der Anmeldung");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side – Horse image */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-secondary relative overflow-hidden">
        <img
          src={horseHero}
          alt="HufiAi Pferd"
          className="w-3/4 max-w-lg object-contain drop-shadow-2xl"
        />
        <div className="absolute bottom-8 left-8 right-8 text-center">
          <p className="text-secondary-foreground/80 text-sm font-medium">
            KI-gestützte Lösungen für die gesamte Pferdebranche
          </p>
        </div>
      </div>

      {/* Right side – Auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold tracking-tight">HufiAi</span>
            </div>
            <p className="text-muted-foreground">
              {isLogin ? "Melde dich bei deinem Konto an" : "Erstelle ein neues Konto"}
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Dein Name" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@beispiel.de" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mindestens 6 Zeichen" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLogin ? "Anmelden" : "Registrieren"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary hover:underline">
                {isLogin ? "Noch kein Konto? Registrieren" : "Bereits registriert? Anmelden"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
