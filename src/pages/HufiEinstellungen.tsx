import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, Loader2 } from "lucide-react";

type UsageMode = "persoenlich" | "pferd" | "business";

function getModeFromProfile(userType: string | undefined): UsageMode {
  if (userType === "gewerbe") return "business";
  return "persoenlich";
}

export default function HufiEinstellungen() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { lang, setLang } = useI18n();

  const [usageMode, setUsageMode] = useState<UsageMode>(
    getModeFromProfile(profile?.user_type)
  );
  const [modeLoading, setModeLoading] = useState(false);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [savingName, setSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [pushNotifications, setPushNotifications] = useState(() => {
    return localStorage.getItem("hufi_push_notifications") === "true";
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem("hufi_email_notifications") !== "false";
  });

  useEffect(() => {
    if (profile) {
      setUsageMode(getModeFromProfile(profile.user_type));
      setDisplayName(profile.display_name ?? "");
    }
  }, [profile]);

  const handleModeChange = async (mode: UsageMode) => {
    if (!user) return;
    setUsageMode(mode);
    setModeLoading(true);
    try {
      const newType = mode === "business" ? "gewerbe" : "privat";
      const { error } = await supabase
        .from("profiles")
        .update({ user_type: newType })
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(lang === "de" ? "Nutzungsmodus aktualisiert" : "Usage mode updated");
    } catch (err: any) {
      toast.error(err.message);
      setUsageMode(getModeFromProfile(profile?.user_type));
    } finally {
      setModeLoading(false);
    }
  };

  const saveDisplayName = async () => {
    if (!user) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(lang === "de" ? "Name gespeichert" : "Name saved");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      toast.error(lang === "de" ? "Mindestens 6 Zeichen" : "At least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(lang === "de" ? "Passwörter stimmen nicht überein" : "Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(lang === "de" ? "Passwort geändert" : "Password changed");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePushToggle = (value: boolean) => {
    setPushNotifications(value);
    localStorage.setItem("hufi_push_notifications", String(value));
  };

  const handleEmailToggle = (value: boolean) => {
    setEmailNotifications(value);
    localStorage.setItem("hufi_email_notifications", String(value));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/landing");
  };

  const initials = (profile?.display_name ?? user?.email ?? "?")
    .split(/[\s@]+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  const modeButtons: { key: UsageMode; label: string }[] = [
    { key: "persoenlich", label: "Persönlich 🐴" },
    { key: "pferd", label: "Pferd 🐎" },
    { key: "business", label: "Business 🏢" },
  ];

  return (
    <AppLayout>
      <div className="min-h-full">
        <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            aria-label="Zurück"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {lang === "de" ? "Einstellungen" : "Settings"}
          </h1>
        </div>

        <div className="max-w-xl mx-auto px-4 py-6 space-y-4 pb-10">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {lang === "de" ? "Nutzungsmodus" : "Usage Mode"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {modeButtons.map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={usageMode === key ? "default" : "outline"}
                    size="sm"
                    disabled={modeLoading}
                    onClick={() => handleModeChange(key)}
                    className="flex-1 min-w-[100px]"
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {lang === "de"
                  ? "Bestimmt, welche Funktionen und Ansichten für dich sichtbar sind."
                  : "Determines which features and views are visible to you."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {lang === "de" ? "Profil" : "Profile"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {profile?.display_name ?? user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.user_type === "gewerbe"
                      ? lang === "de" ? "Gewerbe-Konto" : "Business Account"
                      : lang === "de" ? "Privat-Konto" : "Personal Account"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="displayName">
                  {lang === "de" ? "Anzeigename" : "Display Name"}
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={lang === "de" ? "Dein Name" : "Your name"}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  value={user?.email ?? ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <Button
                onClick={saveDisplayName}
                disabled={savingName}
                className="w-full"
              >
                {savingName && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {lang === "de" ? "Speichern" : "Save"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {lang === "de" ? "Passwort ändern" : "Change Password"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">
                  {lang === "de" ? "Neues Passwort" : "New Password"}
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={lang === "de" ? "Mindestens 6 Zeichen" : "At least 6 characters"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">
                  {lang === "de" ? "Passwort bestätigen" : "Confirm Password"}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={lang === "de" ? "Passwort wiederholen" : "Repeat password"}
                />
              </div>
              <Button
                onClick={changePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {lang === "de" ? "Passwort ändern" : "Change Password"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {lang === "de" ? "Benachrichtigungen" : "Notifications"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between min-h-[44px]">
                <div>
                  <p className="text-sm font-medium">
                    {lang === "de" ? "Push-Benachrichtigungen" : "Push Notifications"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === "de" ? "Echtzeit-Meldungen im Browser" : "Real-time browser alerts"}
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={handlePushToggle}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between min-h-[44px]">
                <div>
                  <p className="text-sm font-medium">
                    {lang === "de" ? "E-Mail-Benachrichtigungen" : "Email Notifications"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === "de" ? "Updates per E-Mail erhalten" : "Receive updates by email"}
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={handleEmailToggle}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {lang === "de" ? "Sprache" : "Language"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={lang === "de" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setLang("de")}
                >
                  🇩🇪 Deutsch
                </Button>
                <Button
                  variant={lang === "en" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setLang("en")}
                >
                  🇬🇧 English
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
          >
            {lang === "de" ? "Abmelden" : "Sign Out"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
