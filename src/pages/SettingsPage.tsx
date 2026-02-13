import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates: any = { display_name: displayName };
      if (profile?.user_type === "gewerbe") updates.company_name = companyName;
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profil gespeichert");
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error("Mindestens 6 Zeichen"); return; }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Passwort geändert");
      setNewPassword("");
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Einstellungen</h1>

        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="font-semibold mb-4">Profil</h2>
          <div className="space-y-4">
            <div><Label>E-Mail</Label><Input value={user?.email || ""} disabled className="mt-1 bg-muted" /></div>
            <div><Label>Anzeigename</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" /></div>
            {profile?.user_type === "gewerbe" && (
              <div><Label>Firmenname</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" /></div>
            )}
            <Button onClick={saveProfile} disabled={saving}>Speichern</Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="font-semibold mb-4">Passwort ändern</h2>
          <div className="space-y-4">
            <div><Label>Neues Passwort</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" placeholder="Mindestens 6 Zeichen" /></div>
            <Button onClick={changePassword} disabled={!newPassword}>Passwort ändern</Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Datenschutz (DSGVO)</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Alle Daten werden DSGVO-konform in der EU gespeichert. Deine Chats und Dokumente gehören dir.
            Du kannst jederzeit die Löschung deiner Daten beantragen.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
