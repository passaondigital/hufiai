import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users, ShieldCheck, Ban, UserPlus, Search,
  Loader2, CheckCircle, XCircle, Key
} from "lucide-react";

interface AdminProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  user_type: string;
  company_name: string | null;
  is_blocked: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Password change for admin
  const [adminNewPassword, setAdminNewPassword] = useState("");

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); }
    else setProfiles((data as AdminProfile[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchProfiles(); }, [isAdmin]);

  const toggleBlock = async (profile: AdminProfile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_blocked: !profile.is_blocked })
      .eq("id", profile.id);
    if (error) toast.error(error.message);
    else {
      toast.success(profile.is_blocked ? "Nutzer entsperrt" : "Nutzer gesperrt");
      fetchProfiles();
    }
  };

  const createUser = async () => {
    if (!newEmail || !newPassword) return;
    setCreating(true);
    try {
      // Use edge function for admin user creation
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { email: newEmail, password: newPassword, display_name: newName },
      });
      if (error) throw error;
      toast.success("Nutzer erstellt: " + newEmail);
      setNewEmail(""); setNewPassword(""); setNewName(""); setShowCreateUser(false);
      fetchProfiles();
    } catch (err: any) {
      toast.error(err.message || "Nutzer konnte nicht erstellt werden");
    } finally { setCreating(false); }
  };

  const changeAdminPassword = async () => {
    if (adminNewPassword.length < 6) { toast.error("Mindestens 6 Zeichen"); return; }
    try {
      const { error } = await supabase.auth.updateUser({ password: adminNewPassword });
      if (error) throw error;
      toast.success("Admin-Passwort geändert!");
      setAdminNewPassword("");
    } catch (err: any) { toast.error(err.message); }
  };

  const filtered = profiles.filter((p) =>
    (p.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    p.user_type.includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center animate-fade-in">
            <ShieldCheck className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold">Kein Zugriff</h2>
            <p className="text-muted-foreground">Du hast keine Admin-Berechtigung.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Plattform verwalten und Nutzer administrieren.</p>
          </div>
          <Button onClick={() => setShowCreateUser(true)}>
            <UserPlus className="w-4 h-4 mr-2" />Nutzer anlegen
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Gesamt Nutzer", value: profiles.length, icon: Users },
            { label: "Privat", value: profiles.filter((p) => p.user_type === "privat").length, icon: Users },
            { label: "Gewerbe", value: profiles.filter((p) => p.user_type === "gewerbe").length, icon: Users },
            { label: "Gesperrt", value: profiles.filter((p) => p.is_blocked).length, icon: Ban },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Password Change */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />Admin-Passwort ändern
          </h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>Neues Passwort</Label>
              <Input type="password" value={adminNewPassword} onChange={(e) => setAdminNewPassword(e.target.value)} className="mt-1" placeholder="Mindestens 6 Zeichen" />
            </div>
            <Button onClick={changeAdminPassword} disabled={!adminNewPassword}>Ändern</Button>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-6 animate-fade-in">
            <h2 className="font-semibold mb-4">Neuen Nutzer anlegen</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div><Label>Name</Label><Input className="mt-1" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" /></div>
              <div><Label>E-Mail</Label><Input className="mt-1" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nutzer@beispiel.de" /></div>
              <div><Label>Passwort</Label><Input className="mt-1" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Passwort" /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createUser} disabled={creating || !newEmail || !newPassword}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Erstellen
              </Button>
              <Button variant="outline" onClick={() => setShowCreateUser(false)}>Abbrechen</Button>
            </div>
          </div>
        )}

        {/* User List */}
        <div className="bg-card rounded-2xl border border-border">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nutzer suchen..." className="pl-10" />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {(p.display_name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{p.display_name || "Unbenannt"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.user_type === "gewerbe" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {p.user_type === "gewerbe" ? "Gewerbe" : "Privat"}
                        </span>
                        {p.company_name && <span className="text-xs text-muted-foreground">{p.company_name}</span>}
                        {p.is_blocked && <span className="text-xs text-destructive font-medium">Gesperrt</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-3">
                      {new Date(p.created_at).toLocaleDateString("de-DE")}
                    </span>
                    {p.onboarding_completed ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Button
                      variant={p.is_blocked ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => toggleBlock(p)}
                    >
                      {p.is_blocked ? "Entsperren" : "Sperren"}
                    </Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">Keine Nutzer gefunden.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
