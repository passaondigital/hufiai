import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Heart, User, AlertTriangle, Loader2, Fingerprint, Handshake, Brain, Sparkles } from "lucide-react";
import HorseManager from "@/components/HorseManager";
import EcosystemRoleCard from "@/components/EcosystemRoleCard";
import SystemPromptEditor from "@/components/SystemPromptEditor";
import MemoryDashboard from "@/components/memory/MemoryDashboard";
import PartnerAccessMatrix from "@/components/PartnerAccessMatrix";
import PartnerSharedDataView from "@/components/PartnerSharedDataView";
import EcosystemHealthDashboard from "@/components/EcosystemHealthDashboard";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [dataConsent, setDataConsent] = useState(profile?.is_data_contribution_active ?? false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

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

  const toggleDataConsent = async (value: boolean) => {
    if (!user) return;
    setDataConsent(value);
    try {
      const { error } = await supabase.from("profiles").update({ is_data_contribution_active: value }).eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(value ? "Datenbeitrag aktiviert" : "Datenbeitrag deaktiviert");
    } catch (err: any) {
      setDataConsent(!value);
      toast.error(err.message);
    }
  };

  const downgradeToFree = async () => {
    if (!user) return;
    try {
      const { data: existing } = await supabase.from("user_subscriptions").select("*").eq("user_id", user.id).maybeSingle();
      if (existing) {
        await supabase.from("user_subscriptions").update({ plan: "starter", social_media_addon: false }).eq("user_id", user.id);
      }
      toast.success("Auf Starter zurückgesetzt");
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "LÖSCHEN") { toast.error("Bitte 'LÖSCHEN' eingeben"); return; }
    setDeleting(true);
    try {
      // Delete user data in order
      if (user) {
        await supabase.from("content_items").delete().eq("user_id", user.id);
        await supabase.from("user_horses").delete().eq("user_id", user.id);
        await supabase.from("documents").delete().eq("user_id", user.id);
        // Delete messages via conversations
        const { data: convs } = await supabase.from("conversations").select("id").eq("user_id", user.id);
        if (convs) {
          for (const c of convs) {
            await supabase.from("messages").delete().eq("conversation_id", c.id);
          }
        }
        await supabase.from("conversations").delete().eq("user_id", user.id);
        await supabase.from("projects").delete().eq("user_id", user.id);
        await supabase.from("user_subscriptions").delete().eq("user_id", user.id);
        await supabase.from("content_usage").delete().eq("user_id", user.id);
        await supabase.from("notification_reads").delete().eq("user_id", user.id);
        await supabase.from("profiles").delete().eq("user_id", user.id);
      }
      await signOut();
      toast.success("Account gelöscht. Auf Wiedersehen.");
    } catch (err: any) {
      toast.error(err.message);
    } finally { setDeleting(false); }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-2xl mx-auto overflow-y-auto h-full">
        <h1 className="text-2xl font-bold mb-8">Einstellungen</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profil</TabsTrigger>
            <TabsTrigger value="ecosystem"><Fingerprint className="w-4 h-4 mr-2" />Ecosystem</TabsTrigger>
            <TabsTrigger value="horses">🐴 Pferde</TabsTrigger>
            <TabsTrigger value="ai-prompt"><Brain className="w-4 h-4 mr-2" />AI Prompt</TabsTrigger>
            <TabsTrigger value="memory"><Sparkles className="w-4 h-4 mr-2" />Memory</TabsTrigger>
            <TabsTrigger value="privacy"><Shield className="w-4 h-4 mr-2" />Datenschutz</TabsTrigger>
            <TabsTrigger value="danger"><AlertTriangle className="w-4 h-4 mr-2" />Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
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

            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold mb-4">Passwort ändern</h2>
              <div className="space-y-4">
                <div><Label>Neues Passwort</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" placeholder="Mindestens 6 Zeichen" /></div>
                <Button onClick={changePassword} disabled={!newPassword}>Passwort ändern</Button>
              </div>
            </div>
          </TabsContent>

          {/* Ecosystem Tab */}
          <TabsContent value="ecosystem" className="space-y-6">
            <EcosystemRoleCard />
            <EcosystemHealthDashboard />
            <PartnerAccessMatrix />
            <PartnerSharedDataView />
          </TabsContent>

          {/* Horses Tab */}
          <TabsContent value="horses">
            <HorseManager />
          </TabsContent>

          {/* AI Prompt Tab */}
          <TabsContent value="ai-prompt">
            <SystemPromptEditor />
          </TabsContent>

          {/* Memory Tab */}
          <TabsContent value="memory">
            <MemoryDashboard />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Datenschutz (DSGVO)</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Alle Daten werden DSGVO-konform in der EU gespeichert. Deine Chats und Dokumente gehören dir.
                Du kannst jederzeit die Löschung deiner Daten beantragen.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-start gap-3 mb-4">
                <Heart className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-semibold mb-1">Hufi Horse-LLM Initiative</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Hilf uns, Hufi smarter zu machen für jedes Pferd. Wir trainieren ein spezialisiertes KI-Modell für die Pferdebranche.
                    Unser Credo: <strong>Pferdeschutz & Datenschutz zuerst.</strong>
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Wenn du zustimmst, nutzen wir deine Pferdedaten und Fachlogik für Trainingszwecke. 
                Dieser Prozess ist <strong>100% anonymisiert</strong>. Personenbezogene Kundendaten (PII) werden strikt ausgeschlossen.
              </p>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Anonymisierte Daten beisteuern</span>
                </div>
                <Switch checked={dataConsent} onCheckedChange={toggleDataConsent} />
              </div>
            </div>
          </TabsContent>

          {/* Danger Zone */}
          <TabsContent value="danger" className="space-y-6">
            <div className="bg-card rounded-2xl border-2 border-destructive/30 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h2 className="font-semibold text-destructive">Danger Zone</h2>
              </div>

              {/* Downgrade */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Plan downgraden</p>
                    <p className="text-xs text-muted-foreground">Zurück zum kostenlosen Starter-Plan. Pro-Features werden deaktiviert.</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">Downgrade</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Plan downgraden?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Du verlierst den Zugang zu Pro-Features wie PDF-Export mit Branding und dem Social Media Add-on.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={downgradeToFree}>Bestätigen</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Delete Account */}
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="font-medium text-sm text-destructive mb-1">Account unwiderruflich löschen</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Alle deine Daten (Chats, Pferde, Dokumente, Content) werden sofort und unwiderruflich gelöscht. DSGVO-konform.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="LÖSCHEN eingeben zum Bestätigen"
                    className="max-w-xs text-sm"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteConfirm !== "LÖSCHEN" || deleting}
                    onClick={deleteAccount}
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Account löschen
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
