import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users, ShieldCheck, Ban, UserPlus, Search, Loader2, CheckCircle, XCircle, Key,
  Database, Bell, Activity, Send, AlertTriangle, Info, CheckCircle2, Map
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminProfile {
  id: string; user_id: string; display_name: string | null; user_type: string;
  company_name: string | null; is_blocked: boolean; onboarding_completed: boolean; created_at: string;
}

interface Notification {
  id: string; title: string; message: string; type: string; created_at: string;
}

const TABLE_SCHEMA = [
  { name: "profiles", desc: "Nutzerprofile mit Typ, Sub-Rolle, Firmendaten", cols: "user_id, display_name, user_type, sub_role, company_name, company_logo_url, company_address, tax_id, is_blocked, onboarding_completed, is_data_contribution_active, exclude_from_training" },
  { name: "conversations", desc: "Chat-Konversationen", cols: "user_id, title, folder, project_id" },
  { name: "messages", desc: "Chat-Nachrichten", cols: "conversation_id, role, content, model" },
  { name: "documents", desc: "Wissensdatenbank-Dokumente", cols: "user_id, name, file_path, file_type, file_size, project_id" },
  { name: "projects", desc: "Gewerbe-Projekte", cols: "user_id, name, description" },
  { name: "user_roles", desc: "Rollen (admin/user)", cols: "user_id, role" },
  { name: "blog_posts", desc: "Blog-Beiträge (CMS)", cols: "title, slug, content, excerpt, image_url, category, status, author_id, published_at" },
  { name: "notifications", desc: "Globale Benachrichtigungen", cols: "title, message, type, created_by, is_global" },
  { name: "notification_reads", desc: "Lesestatus Benachrichtigungen", cols: "notification_id, user_id, read_at" },
  { name: "roadmap_entries", desc: "Entwickler-Roadmap", cols: "title, description, type, status, priority, created_by" },
];

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [adminNewPassword, setAdminNewPassword] = useState("");

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState("info");
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Table counts for system overview
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setProfiles((data as AdminProfile[]) || []);
    setLoading(false);
  };

  const fetchTableCounts = async () => {
    const tables = ["profiles", "conversations", "messages", "documents", "projects", "blog_posts", "notifications", "roadmap_entries"];
    const counts: Record<string, number> = {};
    await Promise.all(tables.map(async (t) => {
      const { count } = await supabase.from(t as any).select("*", { count: "exact", head: true });
      counts[t] = count || 0;
    }));
    setTableCounts(counts);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
    if (data) setNotifications(data as Notification[]);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      fetchTableCounts();
      fetchNotifications();
    }
  }, [isAdmin]);

  const toggleBlock = async (profile: AdminProfile) => {
    const { error } = await supabase.from("profiles").update({ is_blocked: !profile.is_blocked }).eq("id", profile.id);
    if (error) toast.error(error.message);
    else { toast.success(profile.is_blocked ? "Nutzer entsperrt" : "Nutzer gesperrt"); fetchProfiles(); }
  };

  const createUser = async () => {
    if (!newEmail || !newPassword) return;
    setCreating(true);
    try {
      const { error } = await supabase.functions.invoke("admin-create-user", {
        body: { email: newEmail, password: newPassword, display_name: newName },
      });
      if (error) throw error;
      toast.success("Nutzer erstellt: " + newEmail);
      setNewEmail(""); setNewPassword(""); setNewName(""); setShowCreateUser(false);
      fetchProfiles();
    } catch (err: any) { toast.error(err.message || "Fehler"); }
    finally { setCreating(false); }
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

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        type: broadcastType,
        created_by: user!.id,
        is_global: true,
      });
      if (error) throw error;
      toast.success("Broadcast gesendet!");
      setBroadcastTitle(""); setBroadcastMessage("");
      fetchNotifications();
    } catch (err: any) { toast.error(err.message); }
    finally { setSending(false); }
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
      <div className="p-8 max-w-6xl mx-auto overflow-y-auto h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" /> Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Plattform verwalten und administrieren.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/roadmap")}>
              <Map className="w-4 h-4 mr-2" /> Roadmap
            </Button>
            <Button onClick={() => setShowCreateUser(true)}>
              <UserPlus className="w-4 h-4 mr-2" /> Nutzer anlegen
            </Button>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Nutzer</TabsTrigger>
            <TabsTrigger value="system"><Database className="w-4 h-4 mr-2" />System</TabsTrigger>
            <TabsTrigger value="broadcast"><Bell className="w-4 h-4 mr-2" />Broadcast</TabsTrigger>
            <TabsTrigger value="health"><Activity className="w-4 h-4 mr-2" />Health</TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Gesamt", value: profiles.length, icon: Users },
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

            {/* Admin Password */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-primary" />Admin-Passwort ändern</h2>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label>Neues Passwort</Label>
                  <Input type="password" value={adminNewPassword} onChange={(e) => setAdminNewPassword(e.target.value)} className="mt-1" placeholder="Mindestens 6 Zeichen" />
                </div>
                <Button onClick={changeAdminPassword} disabled={!adminNewPassword}>Ändern</Button>
              </div>
            </div>

            {/* Create User */}
            {showCreateUser && (
              <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in">
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
                        <span className="text-xs text-muted-foreground mr-3">{new Date(p.created_at).toLocaleDateString("de-DE")}</span>
                        {p.onboarding_completed ? <CheckCircle className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                        <Button variant={p.is_blocked ? "outline" : "destructive"} size="sm" onClick={() => toggleBlock(p)}>
                          {p.is_blocked ? "Entsperren" : "Sperren"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground">Keine Nutzer gefunden.</div>}
                </div>
              )}
            </div>
          </TabsContent>

          {/* SYSTEM OVERVIEW TAB */}
          <TabsContent value="system" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-primary" />Datenbank-Übersicht</h2>
              <div className="space-y-3">
                {TABLE_SCHEMA.map((t) => (
                  <div key={t.name} className="p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm">{t.name}</h3>
                      <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {tableCounts[t.name] ?? "–"} Einträge
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{t.desc}</p>
                    <p className="text-xs font-mono text-muted-foreground">{t.cols}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={fetchTableCounts} className="mt-4">
                <Loader2 className="w-4 h-4 mr-2" /> Aktualisieren
              </Button>
            </div>
          </TabsContent>

          {/* BROADCAST TAB */}
          <TabsContent value="broadcast" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-primary" />Globale Benachrichtigung senden</h2>
              <div className="space-y-4">
                <div>
                  <Label>Titel</Label>
                  <Input value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} className="mt-1" placeholder="z.B. Wartungsarbeiten" />
                </div>
                <div>
                  <Label>Nachricht</Label>
                  <Textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} className="mt-1" placeholder="Nachricht an alle Nutzer..." rows={3} />
                </div>
                <div>
                  <Label>Typ</Label>
                  <div className="flex gap-2 mt-2">
                    {[
                      { value: "info", icon: Info, label: "Info" },
                      { value: "warning", icon: AlertTriangle, label: "Warnung" },
                      { value: "success", icon: CheckCircle2, label: "Erfolg" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setBroadcastType(t.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${broadcastType === t.value ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}
                      >
                        <t.icon className="w-4 h-4" /> {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={sendBroadcast} disabled={sending || !broadcastTitle.trim() || !broadcastMessage.trim()}>
                  <Send className="w-4 h-4 mr-2" /> {sending ? "Sende..." : "Broadcast senden"}
                </Button>
              </div>
            </div>

            {/* Recent broadcasts */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-semibold mb-4">Letzte Broadcasts</h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Broadcasts gesendet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        {n.type === "warning" ? <AlertTriangle className="w-4 h-4 text-warning" /> : n.type === "success" ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Info className="w-4 h-4 text-primary" />}
                        <span className="font-medium text-sm">{n.title}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{new Date(n.created_at).toLocaleString("de-DE")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* HEALTH TAB */}
          <TabsContent value="health" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Datenbank", status: "Online", icon: Database, ok: true },
                { label: "Auth-Service", status: "Online", icon: ShieldCheck, ok: true },
                { label: "Storage", status: "Online", icon: Activity, ok: true },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.ok ? "bg-success/10" : "bg-destructive/10"}`}>
                      <s.icon className={`w-5 h-5 ${s.ok ? "text-success" : "text-destructive"}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{s.label}</p>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${s.ok ? "bg-success" : "bg-destructive"} animate-pulse`} />
                        <span className="text-xs text-muted-foreground">{s.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-semibold mb-4">Plattform-Statistiken</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Nutzer", value: tableCounts.profiles ?? 0 },
                  { label: "Chats", value: tableCounts.conversations ?? 0 },
                  { label: "Nachrichten", value: tableCounts.messages ?? 0 },
                  { label: "Dokumente", value: tableCounts.documents ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="text-center p-4 rounded-xl bg-muted/50">
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
