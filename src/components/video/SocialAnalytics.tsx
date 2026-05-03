import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  BarChart3, TrendingUp, Users, Eye, Heart, Plus, Trash2, Loader2,
  Instagram, Youtube, Sparkles, RefreshCw, ExternalLink, Search, Globe, Link2
} from "lucide-react";
import InstagramConnect from "@/components/InstagramConnect";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

type SocialAccount = {
  id: string;
  platform: string;
  account_name: string;
  account_url: string | null;
  followers: number;
  avg_engagement: number;
  avg_views: number;
  last_synced_at: string | null;
};

type SocialMetric = {
  id: string;
  account_id: string;
  metric_date: string;
  followers: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
  posts_count: number;
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  tiktok: BarChart3,
  youtube: Youtube,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  tiktok: "#000000",
  youtube: "#FF0000",
};

export default function SocialAnalytics({ userId }: { userId: string }) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [metrics, setMetrics] = useState<SocialMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlatform, setNewPlatform] = useState("instagram");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newFollowers, setNewFollowers] = useState("");
  const [newEngagement, setNewEngagement] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [analyticsTab, setAnalyticsTab] = useState("overview");

  // Public Link Analysis state
  const [publicLink, setPublicLink] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    const [accRes, metRes] = await Promise.all([
      supabase.from("social_accounts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("social_metrics").select("*").eq("user_id", userId).order("metric_date", { ascending: true }).limit(90),
    ]);
    if (accRes.data) setAccounts(accRes.data);
    if (metRes.data) setMetrics(metRes.data);
    setLoading(false);
  };

  const addAccount = async () => {
    if (!newName.trim()) return toast({ title: "Bitte Account-Name eingeben", variant: "destructive" });
    const { error } = await supabase.from("social_accounts").insert({
      user_id: userId,
      platform: newPlatform,
      account_name: newName.trim(),
      account_url: newUrl.trim() || null,
      followers: parseInt(newFollowers) || 0,
      avg_engagement: parseFloat(newEngagement) || 0,
    });
    if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    toast({ title: "Account verknüpft ✓" });
    setNewName(""); setNewUrl(""); setNewFollowers(""); setNewEngagement("");
    setShowAddForm(false);
    loadData();
  };

  const addMetricSnapshot = async (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    const { error } = await supabase.from("social_metrics").insert({
      user_id: userId,
      account_id: accountId,
      followers: account.followers,
      reach: account.avg_views * 3,
      impressions: account.avg_views * 5,
      engagement_rate: Number(account.avg_engagement),
      posts_count: 0,
    });
    if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    toast({ title: "KPI-Snapshot gespeichert ✓" });
    loadData();
  };

  const deleteAccount = async (id: string) => {
    await supabase.from("social_accounts").delete().eq("id", id);
    toast({ title: "Account entfernt" });
    loadData();
  };

  const analyzeWithAI = async () => {
    if (accounts.length === 0) return toast({ title: "Verknüpfe zuerst einen Account", variant: "destructive" });
    setIsAnalyzing(true);
    setAiSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          mode: "analyst",
          messages: [{
            role: "user",
            content: `Analysiere folgende Social Media Accounts eines Pferde-Profis und gib 5 konkrete, umsetzbare Content-Vorschläge für die nächste Woche. Fokus auf B2B/B2C Pferdebranche. Accounts: ${JSON.stringify(accounts.map(a => ({
              platform: a.platform, name: a.account_name, followers: a.followers,
              engagement: a.avg_engagement + "%", avgViews: a.avg_views
            })))}. Antworte auf Deutsch, nummeriert 1-5, kurz und prägnant.`
          }]
        }
      });
      if (error) throw error;
      const text = typeof data === "string" ? data : JSON.stringify(data);
      const suggestions = text.split(/\d+\.\s/).filter(Boolean).slice(0, 5);
      setAiSuggestions(suggestions.length > 0 ? suggestions : [text]);
    } catch (e: any) {
      toast({ title: "Analyse fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Public Link Analysis
  const scanPublicProfile = async () => {
    if (!publicLink.trim()) return toast({ title: "Bitte einen Link eingeben", variant: "destructive" });
    setIsScanning(true);
    setScanResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          mode: "analyst",
          messages: [{
            role: "user",
            content: `Du bist ein Social-Media-Analyst für die Pferdebranche. Analysiere dieses Profil/diesen Account: "${publicLink}".

Erstelle eine Konkurrenz-Analyse mit:
1. **Geschätzte Kennzahlen** (Follower-Range, Posting-Frequenz, Engagement-Einschätzung)
2. **Content-Strategie**: Welche Themen/Formate werden genutzt?
3. **Stärken**: Was macht dieser Account gut?
4. **Schwächen**: Wo gibt es Verbesserungspotenzial?
5. **Learnings für dich**: 3 konkrete Ideen, die du für deinen eigenen Pferde-Account übernehmen kannst.

Antworte auf Deutsch, strukturiert mit Markdown-Überschriften.`
          }]
        }
      });
      if (error) throw error;
      const text = typeof data === "string" ? data : (data?.choices?.[0]?.message?.content || JSON.stringify(data));
      setScanResult(text);
    } catch (e: any) {
      toast({ title: "Scan fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  // Aggregate metrics for charts
  const chartData = metrics.reduce<Record<string, any>>((acc, m) => {
    const key = m.metric_date;
    if (!acc[key]) acc[key] = { date: new Date(m.metric_date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" }), followers: 0, reach: 0, engagement: 0 };
    acc[key].followers += m.followers;
    acc[key].reach += m.reach;
    acc[key].engagement = Math.max(acc[key].engagement, Number(m.engagement_rate));
    return acc;
  }, {});
  const chartDataArray = Object.values(chartData);

  const totalFollowers = accounts.reduce((s, a) => s + a.followers, 0);
  const avgEngagement = accounts.length > 0 ? (accounts.reduce((s, a) => s + Number(a.avg_engagement), 0) / accounts.length).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Tabs for Analytics modes */}
      <Tabs value={analyticsTab} onValueChange={setAnalyticsTab}>
        <TabsList className="bg-[hsl(var(--sidebar-accent))] border border-[hsl(var(--sidebar-border))] h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Übersicht
          </TabsTrigger>
          <TabsTrigger value="accounts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
            <Users className="w-3.5 h-3.5" /> Accounts
          </TabsTrigger>
          <TabsTrigger value="competitor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
            <Search className="w-3.5 h-3.5" /> Konkurrenz-Scan
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> KI-Strategie
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* KPI Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Gesamt-Follower", value: totalFollowers.toLocaleString("de-DE"), icon: Users, color: "text-primary" },
              { label: "Ø Engagement", value: `${avgEngagement}%`, icon: Heart, color: "text-pink-500" },
              { label: "Accounts", value: accounts.length.toString(), icon: BarChart3, color: "text-blue-500" },
              { label: "KPI-Snapshots", value: metrics.length.toString(), icon: TrendingUp, color: "text-emerald-500" },
            ].map((kpi, i) => (
              <Card key={i} className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    <span className="text-[10px] text-[hsl(var(--sidebar-muted))] uppercase tracking-wider">{kpi.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-[hsl(var(--sidebar-foreground))]">{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          {chartDataArray.length > 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-primary" /> Follower-Entwicklung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartDataArray}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--sidebar-border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--sidebar-muted))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--sidebar-muted))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--sidebar-accent))", border: "1px solid hsl(var(--sidebar-border))", borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="followers" stroke="#F47B20" fill="#F47B20" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-primary" /> Reichweite
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartDataArray}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--sidebar-border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--sidebar-muted))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--sidebar-muted))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--sidebar-accent))", border: "1px solid hsl(var(--sidebar-border))", borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="reach" stroke="#10B981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {chartDataArray.length <= 1 && (
            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 text-[hsl(var(--sidebar-muted))] opacity-30" />
                <p className="text-xs text-[hsl(var(--sidebar-muted))]">Erstelle KPI-Snapshots für deine Accounts, um Charts zu sehen</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ACCOUNTS TAB */}
        <TabsContent value="accounts" className="mt-4 space-y-4">
          {/* Instagram OAuth Connect */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500" /> Instagram API-Verbindung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[hsl(var(--sidebar-muted))] mb-3">
                Verbinde dein Instagram Business-Konto für automatischen Import von Follower-, Reichweiten- und Engagement-Daten.
              </p>
              <InstagramConnect />
            </CardContent>
          </Card>

          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Verknüpfte Accounts
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}
                  className="text-xs border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] gap-1">
                  <Plus className="w-3 h-3" /> Account hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAddForm && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select value={newPlatform} onValueChange={setNewPlatform}>
                      <SelectTrigger className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">📸 Instagram</SelectItem>
                        <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                        <SelectItem value="youtube">📺 YouTube</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="@dein_account"
                      className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs" />
                    <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://instagram.com/..."
                      className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs" />
                    <Input value={newFollowers} onChange={e => setNewFollowers(e.target.value)} placeholder="Follower-Anzahl" type="number"
                      className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs" />
                    <Input value={newEngagement} onChange={e => setNewEngagement(e.target.value)} placeholder="Ø Engagement %" type="number" step="0.1"
                      className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addAccount} className="bg-primary hover:bg-primary/90 text-xs">Speichern</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="text-xs text-[hsl(var(--sidebar-muted))]">Abbrechen</Button>
                  </div>
                </div>
              )}

              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 text-[hsl(var(--sidebar-muted))] opacity-30" />
                  <p className="text-xs text-[hsl(var(--sidebar-muted))]">Noch keine Accounts verknüpft</p>
                  <p className="text-[10px] text-[hsl(var(--sidebar-muted))] mt-1">Füge deine Social Media Accounts hinzu für KI-gestützte Analyse</p>
                </div>
              ) : (
                accounts.map(acc => {
                  const Icon = PLATFORM_ICONS[acc.platform] || BarChart3;
                  return (
                    <div key={acc.id} className="flex items-center gap-3 p-3 rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))]">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: PLATFORM_COLORS[acc.platform] + "20" }}>
                        <Icon className="w-5 h-5" style={{ color: PLATFORM_COLORS[acc.platform] }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">{acc.account_name}</span>
                          <Badge variant="outline" className="text-[9px] border-[hsl(var(--sidebar-border))]">{acc.platform}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-[hsl(var(--sidebar-muted))]">{acc.followers.toLocaleString()} Follower</span>
                          <span className="text-[10px] text-[hsl(var(--sidebar-muted))]">{Number(acc.avg_engagement).toFixed(1)}% Engagement</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {acc.account_url && (
                          <a href={acc.account_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] transition-colors">
                            <ExternalLink className="w-3.5 h-3.5 text-[hsl(var(--sidebar-muted))]" />
                          </a>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => addMetricSnapshot(acc.id)} className="h-7 w-7 p-0" title="KPI-Snapshot">
                          <RefreshCw className="w-3.5 h-3.5 text-[hsl(var(--sidebar-muted))]" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteAccount(acc.id)} className="h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPETITOR SCAN TAB */}
        <TabsContent value="competitor" className="mt-4 space-y-4">
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Konkurrenz-Analyse (Public Link)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-[hsl(var(--sidebar-muted))]">
                Gib einen öffentlichen Social-Media-Link ein. Hufi analysiert das Profil und erstellt eine Konkurrenz-Analyse mit Content-Strategie-Empfehlungen.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--sidebar-muted))]" />
                  <Input
                    value={publicLink}
                    onChange={e => setPublicLink(e.target.value)}
                    placeholder="https://instagram.com/pferdeprofi_xy oder @accountname"
                    className="pl-10 bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))] text-xs"
                  />
                </div>
                <Button onClick={scanPublicProfile} disabled={isScanning || !publicLink.trim()}
                  className="bg-primary hover:bg-primary/90 text-xs gap-1.5 shrink-0">
                  {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Scannen
                </Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                {["instagram.com/pferdeprofis", "tiktok.com/@horsegirl", "youtube.com/@equestrian"].map(example => (
                  <button key={example} onClick={() => setPublicLink(`https://${example}`)}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))] hover:border-primary/40 hover:text-primary transition-colors">
                    {example}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {scanResult && (
            <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Analyse-Ergebnis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="text-xs text-[hsl(var(--sidebar-foreground))] whitespace-pre-wrap leading-relaxed">
                    {scanResult}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI STRATEGY TAB */}
        <TabsContent value="ai" className="mt-4 space-y-4">
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> KI-Analyse & Content-Vorschläge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-[hsl(var(--sidebar-muted))]">
                Hufi analysiert deine Account-Daten und generiert maßgeschneiderte Content-Ideen für die Pferdebranche.
              </p>
              <Button onClick={analyzeWithAI} disabled={isAnalyzing || accounts.length === 0}
                className="bg-primary hover:bg-primary/90 text-xs gap-1.5">
                {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Jetzt analysieren
              </Button>

              {accounts.length === 0 && (
                <p className="text-[10px] text-[hsl(var(--sidebar-muted))] italic">
                  Verknüpfe zuerst Accounts im "Accounts"-Tab, um die KI-Analyse zu nutzen.
                </p>
              )}

              {aiSuggestions.length > 0 && (
                <div className="space-y-2 mt-3">
                  {aiSuggestions.map((s, i) => (
                    <div key={i} className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <p className="text-xs text-[hsl(var(--sidebar-foreground))]">{s.trim()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Redaktionsplan Hint */}
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] border-dashed">
            <CardContent className="p-5 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary opacity-50" />
              <p className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">Monatlicher Redaktionsplan</p>
              <p className="text-[10px] text-[hsl(var(--sidebar-muted))] mt-1">
                Kombiniere deine Account-Daten mit der Konkurrenz-Analyse. Hufi erstellt automatisch einen monatlichen Content-Plan mit Video-Projekten.
              </p>
              <Badge variant="outline" className="mt-3 text-[10px] border-primary/40 text-primary">Coming Soon</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
