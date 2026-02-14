import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import horseHero from "@/assets/horse-hero.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const getGermanError = (msg: string): string => {
    if (msg.includes("Invalid login credentials")) return "Ungültige Anmeldedaten. Bitte prüfe E-Mail und Passwort. Falls du dich gerade registriert hast, bestätige bitte zuerst deine E-Mail.";
    if (msg.includes("User already registered")) return "Diese E-Mail ist bereits registriert. Bitte melde dich an oder prüfe dein Postfach für die Bestätigungs-E-Mail.";
    if (msg.includes("Email not confirmed")) return "Bitte bestätige zuerst deine E-Mail-Adresse. Prüfe dein Postfach.";
    if (msg.includes("signup_disabled")) return "Registrierung ist derzeit deaktiviert.";
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Willkommen zurück!");
        navigate("/");
      } else {
        await signUp(email, password, displayName);
        toast.success("Konto erstellt! Bitte prüfe dein E-Mail-Postfach und bestätige deine Adresse, bevor du dich anmeldest.", { duration: 8000 });
        setIsLogin(true);
      }
    } catch (err: any) {
      toast.error(getGermanError(err.message || "Fehler bei der Anmeldung"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error("Google-Anmeldung fehlgeschlagen: " + (error.message || "Unbekannter Fehler"));
      }
    } catch (err: any) {
      toast.error("Google-Anmeldung fehlgeschlagen");
    } finally {
      setGoogleLoading(false);
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
            {/* Google Sign-In */}
            <Button
              variant="outline"
              className="w-full mb-4 gap-2"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Mit Google anmelden
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">oder</span>
              </div>
            </div>

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
