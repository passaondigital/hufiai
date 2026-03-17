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
  Database, Bell, Activity, Send, AlertTriangle, Info, CheckCircle2, Map, TrafficCone,
  Crown, Calendar as CalendarIcon, FileText, RotateCcw, Gift, Paperclip, Download, Sparkles,
  Cpu, Video, Mic, ImageIcon, DollarSign
} from "lucide-react";
import ContentEngine from "@/components/admin/ContentEngine";
import ModelSwitcher from "@/components/admin/ModelSwitcher";
import VideoAnalysisLab from "@/components/admin/VideoAnalysisLab";
import VoiceEngine from "@/components/admin/VoiceEngine";
import ImageLab from "@/components/admin/ImageLab";
import VideoTrainingTab from "@/components/admin/VideoTrainingTab";
import ApiCostTracker from "@/components/admin/ApiCostTracker";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

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
  { name: "training_data_logs", desc: "KI-Trainingsdaten (Opt-in)", cols: "user_id, conversation_id, user_input, ai_output, file_context, model_used, source, tone, category" },
  { name: "upload_usage", desc: "Datei-Upload-Zähler", cols: "user_id, month_year, upload_count" },
  { name: "user_subscriptions", desc: "Abos & Zugänge", cols: "user_id, plan, social_media_addon, founder_flow_active" },
];

const FEATURE_AMPEL = {
  green: [
    "Login & Registrierung", "Onboarding (Privat/Gewerbe)", "KI-Chat (Streaming)", "Landing Page",
    "Admin Dashboard", "Blog CMS", "Firmenlogo-Upload", "Business Vault", "Roadmap / Dev-Journal",
    "Impressum, AGB, Datenschutz", "Nutzerverwaltung", "Global Broadcast", "System-Übersicht",
    "Cookie-Banner (DSGVO)", "Content Hub (Social Media)", "Horse Memory / Pferde-Verwaltung",
    "Mission Control (Admin)", "Danger Zone (Self-Service)", "Personalisierte Begrüßung",
    "Pro-PDF-Export", "Modulares Pricing (DB)", "Content Brain (Datei-Upload)",
    "Upload-Limits (Tier-basiert)", "Training Data Pipeline", "KI-Disclaimer (Legal)",
    "Experten-Profil & Dashboard", "Experten-Suche", "Ethic Guardrail CTA",
    "Content Engine (AI Blog)", "Dynamische Dokumentation", "Trust-Branding Seiten",
  ],
  yellow: [
    "Stripe-Integration",
    "Strukturierte Eingabe-Modi", "Chat-Tagging & Export", "Document Vault (Datei-Manager)",
    "Smart Reminders (Content Hub)", "Self-Learning Mode",
  ],
  red: [
    "Automatische Video-Analyse", "Context Retention über Sessions", "One-Click AVV",
    "Hufgesundheits-Tracking mit Timeline", "Team-Verwaltung / Multi-User", "Mobile App (PWA)",
    "Hufmanager-API Anbindung", "Eigenes HufiAi-Modell Training",
  ],
};

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
  const [selectedModel, setSelectedModel] = useState("google/gemini-3-flash-preview");

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState("info");
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Table counts for system overview
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});

  // Mission Control state
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [mcUserId, setMcUserId] = useState("");
  const [mcPlan, setMcPlan] = useState("starter");
  const [mcAddon, setMcAddon] = useState(false);
  const [mcReason, setMcReason] = useState("");
  const [mcExpires, setMcExpires] = useState("");
  const [mcSaving, setMcSaving] = useState(false);

  // Files & Usage state
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [filesUserId, setFilesUserId] = useState("");
  const [filesData, setFilesData] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploadUsage, setUploadUsage] = useState<any[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<any[]>([]);
  const [trainingStats, setTrainingStats] = useState({ total: 0, contributors: 0, thisMonth: 0 });

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setProfiles((data as AdminProfile[]) || []);
    setLoading(false);
  };

  const fetchTableCounts = async () => {
    const tables = ["profiles", "conversations", "messages", "documents", "projects", "blog_posts", "notifications", "roadmap_entries", "training_data_logs", "upload_usage", "user_subscriptions"];
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

  const fetchSubscriptions = async () => {
    const { data } = await supabase.from("user_subscriptions").select("*").order("updated_at", { ascending: false });
    if (data) setSubscriptions(data);
  };

  const fetchUploadUsage = async () => {
    const { data } = await supabase.from("upload_usage").select("*").order("month_year", { ascending: false });
    if (data) setUploadUsage(data);
  };

  const fetchTrainingData = async () => {
    const { data } = await supabase
      .from("training_data_logs")
      .select("id, user_id, model_used, source, tone, category, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      setTrainingLogs(data);
      const monthYear = new Date().toISOString().slice(0, 7);
      const uniqueUsers = new Set(data.map((d: any) => d.user_id));
      const thisMonth = data.filter((d: any) => d.created_at?.startsWith(monthYear));
      setTrainingStats({ total: data.length, contributors: uniqueUsers.size, thisMonth: thisMonth.length });
    }
  };

  const exportTrainingLogs = async (format: "json" | "csv") => {
    toast.info("Exportiere alle Training-Logs…");
    const { data, error } = await supabase
      .from("training_data_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) { toast.error("Export fehlgeschlagen"); return; }
    if (data.length === 0) { toast.error("Keine Daten vorhanden"); return; }

    let blob: Blob;
    let filename: string;

    if (format === "json") {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      filename = `hufiai-training-logs-${new Date().toISOString().slice(0, 10)}.json`;
    } else {
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map((row: any) =>
          headers.map((h) => {
            const val = row[h];
            const str = val == null ? "" : String(val).replace(/"/g, '""');
            return `"${str}"`;
          }).join(",")
        ),
      ];
      blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      filename = `hufiai-training-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${data.length} Logs als ${format.toUpperCase()} exportiert`);
  };

  const viewUserFiles = async (userId: string) => {
    setFilesUserId(userId);
    setFilesLoading(true);
    setFilesDialogOpen(true);
    const { data } = await supabase
      .from("chat_attachments")
      .select("id, file_name, file_type, file_size, extraction_status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setFilesData(data || []);
    setFilesLoading(false);
  };

  const resetUserLimits = async (userId: string) => {
    const monthYear = new Date().toISOString().slice(0, 7);
    const { error } = await supabase
      .from("upload_usage")
      .update({ upload_count: 0 })
      .eq("user_id", userId)
      .eq("month_year", monthYear);
    if (error) toast.error(error.message);
    else { toast.success("Upload-Limit zurückgesetzt"); fetchUploadUsage(); }
  };

  const giftFounderFlow = async (userId: string) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { data: existing } = await supabase.from("user_subscriptions").select("*").eq("user_id", userId).maybeSingle();
    const payload = {
      user_id: userId,
      plan: "gewerbe_pro",
      founder_flow_active: true,
      founder_flow_started_at: now.toISOString(),
      founder_flow_expires_at: expires.toISOString(),
      granted_by: user!.id,
      grant_reason: "Admin Gift – Founder Flow",
    };
    if (existing) {
      await supabase.from("user_subscriptions").update(payload).eq("user_id", userId);
    } else {
      await supabase.from("user_subscriptions").insert(payload);
    }
    toast.success("Founder Flow aktiviert!");
    fetchSubscriptions();
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      fetchTableCounts();
      fetchNotifications();
      fetchSubscriptions();
      fetchUploadUsage();
      fetchTrainingData();
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
          <TabsList className="flex-wrap">
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Nutzer</TabsTrigger>
            <TabsTrigger value="mission"><Crown className="w-4 h-4 mr-2" />Mission Control</TabsTrigger>
            <TabsTrigger value="founder"><Loader2 className="w-4 h-4 mr-2" />Founder Flow</TabsTrigger>
            <TabsTrigger value="system"><Database className="w-4 h-4 mr-2" />System</TabsTrigger>
            <TabsTrigger value="broadcast"><Bell className="w-4 h-4 mr-2" />Broadcast</TabsTrigger>
            <TabsTrigger value="health"><Activity className="w-4 h-4 mr-2" />Health</TabsTrigger>
            <TabsTrigger value="training"><Database className="w-4 h-4 mr-2" />KI-Daten</TabsTrigger>
            <TabsTrigger value="content"><Sparkles className="w-4 h-4 mr-2" />Content Engine</TabsTrigger>
            <TabsTrigger value="models"><Cpu className="w-4 h-4 mr-2" />Models</TabsTrigger>
            <TabsTrigger value="video"><Video className="w-4 h-4 mr-2" />Video Lab</TabsTrigger>
            <TabsTrigger value="voice"><Mic className="w-4 h-4 mr-2" />Voice</TabsTrigger>
            <TabsTrigger value="image"><ImageIcon className="w-4 h-4 mr-2" />Image Lab</TabsTrigger>
            <TabsTrigger value="video-training"><Video className="w-4 h-4 mr-2" />Video Training</TabsTrigger>
            <TabsTrigger value="ampel"><TrafficCone className="w-4 h-4 mr-2" />Feature-Ampel</TabsTrigger>
            <TabsTrigger value="costs"><DollarSign className="w-4 h-4 mr-2" />API-Kosten</TabsTrigger>
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground mr-2">{new Date(p.created_at).toLocaleDateString("de-DE")}</span>
                        {p.onboarding_completed ? <CheckCircle className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                        <Button variant="ghost" size="sm" onClick={() => viewUserFiles(p.user_id)} title="Dateien anzeigen">
                          <Paperclip className="w-3.5 h-3.5 mr-1" />Dateien
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => resetUserLimits(p.user_id)} title="Upload-Limit zurücksetzen">
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />Reset
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => giftFounderFlow(p.user_id)} title="Founder Flow schenken">
                          <Gift className="w-3.5 h-3.5 mr-1" />Founder
                        </Button>
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

          {/* MISSION CONTROL TAB */}
          <TabsContent value="mission" className="space-y-6">
            {/* Existing subscriptions */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" /> Aktive Abos & Zugänge
              </h2>
              {subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine manuellen Zugänge vergeben.</p>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((sub) => {
                    const p = profiles.find((pr) => pr.user_id === sub.user_id);
                    const expired = sub.expires_at && new Date(sub.expires_at) < new Date();
                    return (
                      <div key={sub.id} className={`p-4 rounded-xl border ${expired ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/50"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{p?.display_name || sub.user_id.slice(0, 8)}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.plan !== "free" && sub.plan !== "starter" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                {sub.plan === "gewerbe_team" ? "Gewerbe Team" : sub.plan === "gewerbe_pro" ? "Gewerbe Pro" : sub.plan === "privat_plus" ? "Privat Plus" : sub.plan === "pro" ? "Pro Business" : "Free"}
                              </span>
                              {sub.social_media_addon && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">+ Social Media</span>
                              )}
                              {expired && <span className="text-xs text-destructive font-medium">Abgelaufen</span>}
                            </div>
                            {sub.grant_reason && <p className="text-xs text-muted-foreground mt-1">Grund: {sub.grant_reason}</p>}
                            {sub.expires_at && <p className="text-xs text-muted-foreground">Ablauf: {new Date(sub.expires_at).toLocaleDateString("de-DE")}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Grant access manually */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold mb-4">Zugang manuell vergeben</h2>
              <div className="space-y-4">
                <div>
                  <Label>Nutzer auswählen</Label>
                  <Select value={mcUserId} onValueChange={setMcUserId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Nutzer wählen..." /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.display_name || p.user_id.slice(0, 8)} ({p.user_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Plan</Label>
                    <Select value={mcPlan} onValueChange={setMcPlan}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="privat_plus">Privat Plus (9,99€)</SelectItem>
                        <SelectItem value="gewerbe_pro">Gewerbe Pro (24,99€)</SelectItem>
                        <SelectItem value="gewerbe_team">Gewerbe Team (49€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ablaufdatum (optional)</Label>
                    <Input className="mt-1" type="date" value={mcExpires} onChange={(e) => setMcExpires(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={mcAddon}
                    onChange={(e) => setMcAddon(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <Label>Social Media Unlimited Add-on (9,99€/Monat)</Label>
                </div>
                <div>
                  <Label>Grund (z.B. Gewinnspiel, Offline-Zahlung)</Label>
                  <Input className="mt-1" value={mcReason} onChange={(e) => setMcReason(e.target.value)} placeholder="Grund für die manuelle Vergabe..." />
                </div>
                <Button
                  disabled={!mcUserId || mcSaving}
                  onClick={async () => {
                    setMcSaving(true);
                    try {
                      const { data: existing } = await supabase.from("user_subscriptions").select("*").eq("user_id", mcUserId).maybeSingle();
                      const payload = {
                        user_id: mcUserId,
                        plan: mcPlan,
                        social_media_addon: mcAddon,
                        granted_by: user!.id,
                        grant_reason: mcReason || null,
                        expires_at: mcExpires ? new Date(mcExpires).toISOString() : null,
                      };
                      if (existing) {
                        await supabase.from("user_subscriptions").update(payload).eq("user_id", mcUserId);
                      } else {
                        await supabase.from("user_subscriptions").insert(payload);
                      }
                      toast.success("Zugang vergeben!");
                      setMcUserId(""); setMcReason(""); setMcExpires(""); setMcAddon(false); setMcPlan("starter");
                      fetchSubscriptions();
                    } catch (err: any) { toast.error(err.message); }
                    finally { setMcSaving(false); }
                  }}
                >
                  {mcSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Crown className="w-4 h-4 mr-2" />}
                  Zugang speichern
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* FOUNDER FLOW TAB */}
          <TabsContent value="founder" className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" /> Aktive Founder Flows
              </h2>
              {subscriptions.filter(s => s.founder_flow_active).length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine aktiven Founder Flows.</p>
              ) : (
                <div className="space-y-3">
                  {subscriptions.filter(s => s.founder_flow_active).map((sub) => {
                    const p = profiles.find((pr) => pr.user_id === sub.user_id);
                    const daysLeft = sub.founder_flow_expires_at
                      ? Math.max(0, Math.ceil((new Date(sub.founder_flow_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                      : 0;
                    const expired = daysLeft === 0;
                    return (
                      <div key={sub.id} className={`p-4 rounded-xl border ${expired ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{p?.display_name || sub.user_id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Gestartet: {sub.founder_flow_started_at ? new Date(sub.founder_flow_started_at).toLocaleDateString("de-DE") : "–"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-bold ${expired ? "text-destructive" : "text-primary"}`}>
                              {expired ? "Abgelaufen" : `${daysLeft} Tage übrig`}
                            </span>
                            {sub.founder_flow_expires_at && (
                              <p className="text-xs text-muted-foreground">
                                Endet: {new Date(sub.founder_flow_expires_at).toLocaleDateString("de-DE")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
          {/* TRAINING DATA TAB */}
          <TabsContent value="training" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Gesamt-Logs", value: trainingStats.total, icon: Database },
                { label: "Contributors", value: trainingStats.contributors, icon: Users },
                { label: "Diesen Monat", value: trainingStats.thisMonth, icon: Activity },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" /> Letzte KI-Interaktionen (Opt-in)
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Nur von Nutzern mit aktivem Daten-Beitrag. Inhalte werden anonymisiert für zukünftiges HufiAi-Modelltraining gesammelt.
              </p>
              {trainingLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Trainingsdaten vorhanden.</p>
              ) : (
                <div className="space-y-2">
                  {trainingLogs.map((log: any) => {
                    const p = profiles.find((pr) => pr.user_id === log.user_id);
                    return (
                      <div key={log.id} className="p-3 rounded-lg border border-border bg-muted/50 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{p?.display_name || log.user_id.slice(0, 8)}</span>
                          <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("de-DE")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {log.model_used && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{log.model_used}</span>
                          )}
                          {log.source && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">📡 {log.source}</span>
                          )}
                          {log.tone && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">🎭 {log.tone}</span>
                          )}
                          {log.category && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">📂 {log.category}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button variant="outline" onClick={fetchTrainingData}>
                  <Loader2 className="w-4 h-4 mr-2" /> Aktualisieren
                </Button>
                <Button variant="outline" onClick={() => exportTrainingLogs("json")}>
                  <Download className="w-4 h-4 mr-2" /> JSON Export
                </Button>
                <Button variant="outline" onClick={() => exportTrainingLogs("csv")}>
                  <Download className="w-4 h-4 mr-2" /> CSV Export
                </Button>
              </div>
            </div>

            {/* Upload Usage Overview */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-primary" /> Upload-Nutzung (aktueller Monat)
              </h2>
              {uploadUsage.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Upload-Nutzung vorhanden.</p>
              ) : (
                <div className="space-y-2">
                  {uploadUsage.slice(0, 20).map((u: any) => {
                    const p = profiles.find((pr) => pr.user_id === u.user_id);
                    return (
                      <div key={u.id} className="p-3 rounded-lg border border-border bg-muted/50 text-sm flex items-center justify-between">
                        <span className="font-medium">{p?.display_name || u.user_id.slice(0, 8)}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{u.month_year}</span>
                          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">{u.upload_count} Uploads</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* CONTENT ENGINE TAB */}
          <TabsContent value="content">
            <ContentEngine />
          </TabsContent>

          {/* FEATURE-AMPEL TAB */}
          <TabsContent value="ampel" className="space-y-6">
            {[
              { label: "🟢 Live", items: FEATURE_AMPEL.green, color: "bg-success/10 border-success/30 text-success" },
              { label: "🟡 In Arbeit", items: FEATURE_AMPEL.yellow, color: "bg-warning/10 border-warning/30 text-warning" },
              { label: "🔴 Vision", items: FEATURE_AMPEL.red, color: "bg-destructive/10 border-destructive/30 text-destructive" },
            ].map((group) => (
              <div key={group.label} className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-semibold mb-4 text-lg">{group.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${group.color}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* MODEL SWITCHER TAB */}
          <TabsContent value="models">
            <ModelSwitcher selectedModel={selectedModel} onModelChange={setSelectedModel} />
          </TabsContent>

          {/* VIDEO LAB TAB */}
          <TabsContent value="video">
            <VideoAnalysisLab selectedModel={selectedModel} />
          </TabsContent>

          {/* VIDEO TRAINING TAB */}
          <TabsContent value="video-training">
            <VideoTrainingTab />
          </TabsContent>

          {/* VOICE ENGINE TAB */}
          <TabsContent value="voice">
            <VoiceEngine selectedModel={selectedModel} />
          </TabsContent>

          {/* IMAGE LAB TAB */}
          <TabsContent value="image">
            <ImageLab />
          </TabsContent>

        </Tabs>
      </div>

      {/* Files Dialog */}
      <Dialog open={filesDialogOpen} onOpenChange={setFilesDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-primary" />
              Dateien von {profiles.find(p => p.user_id === filesUserId)?.display_name || "Nutzer"}
            </DialogTitle>
          </DialogHeader>
          {filesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filesData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Keine Dateien hochgeladen.</p>
          ) : (
            <div className="space-y-2">
              {filesData.map((f) => (
                <div key={f.id} className="p-3 rounded-lg border border-border bg-muted/50 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium truncate max-w-[200px]">{f.file_name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      f.extraction_status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {f.extraction_status === "completed" ? "Analysiert" : f.extraction_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{f.file_type}</span>
                    <span>{f.file_size ? `${(f.file_size / 1024).toFixed(0)} KB` : "–"}</span>
                    <span>{new Date(f.created_at).toLocaleDateString("de-DE")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
