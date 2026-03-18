import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, CheckCircle2, XCircle, Clock, RefreshCw,
  TrendingUp, AlertTriangle, Loader2, BarChart3
} from "lucide-react";

interface SyncStats {
  total: number;
  success: number;
  failed: number;
  avgDurationMs: number;
}

interface RecentError {
  id: string;
  error_type: string;
  error_message: string;
  created_at: string;
  resolved_at: string | null;
}

interface RecentSync {
  id: string;
  sync_type: string;
  direction: string;
  status: string;
  duration_ms: number | null;
  record_count: number | null;
  error_message: string | null;
  created_at: string;
}

export default function EcosystemHealthDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SyncStats>({ total: 0, success: 0, failed: 0, avgDurationMs: 0 });
  const [recentSyncs, setRecentSyncs] = useState<RecentSync[]>([]);
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch recent syncs (last 50)
      const { data: syncs } = await supabase
        .from("ecosystem_sync_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      const syncList = (syncs ?? []) as RecentSync[];
      setRecentSyncs(syncList.slice(0, 10));

      // Calculate stats
      const success = syncList.filter((s) => s.status === "success").length;
      const failed = syncList.filter((s) => s.status === "failed").length;
      const durations = syncList.filter((s) => s.duration_ms).map((s) => s.duration_ms!);
      const avgDurationMs = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      setStats({ total: syncList.length, success, failed, avgDurationMs });

      // Fetch recent errors (unresolved first)
      const { data: errors } = await supabase
        .from("ecosystem_errors")
        .select("id, error_type, error_message, created_at, resolved_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentErrors((errors ?? []) as RecentError[]);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription for live updates
    if (!user) return;
    const channel = supabase
      .channel("ecosystem-dashboard")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ecosystem_sync_log",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchData())
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ecosystem_errors",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const successRate = stats.total > 0
    ? Math.round((stats.success / stats.total) * 100)
    : 0;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Ecosystem Health</h2>
            <p className="text-sm text-muted-foreground">Sync-Status & Fehlerübersicht</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchData} title="Aktualisieren">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Syncs gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold">{successRate}%</p>
            <p className="text-xs text-muted-foreground">Erfolgsrate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{stats.avgDurationMs}</p>
            <p className="text-xs text-muted-foreground">Ø ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Fehler</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Syncs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Letzte Sync-Operationen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentSyncs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Noch keine Syncs durchgeführt</p>
          ) : (
            <div className="divide-y divide-border">
              {recentSyncs.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {sync.status === "success" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    )}
                    <span className="font-mono text-xs truncate">{sync.sync_type}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {sync.direction === "download" ? "↓" : "↑"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    {sync.duration_ms && <span>{sync.duration_ms}ms</span>}
                    <span>{formatTime(sync.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {recentErrors.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Offene Fehler ({recentErrors.filter((e) => !e.resolved_at).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentErrors.map((err) => (
                <div key={err.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <Badge variant={err.resolved_at ? "outline" : "destructive"} className="text-[10px]">
                      {err.error_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{formatTime(err.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{err.error_message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
