import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instagram, Loader2, Unplug, CheckCircle } from "lucide-react";

const REDIRECT_URI = `${window.location.origin}/video-engine`;

interface Connection {
  instagram_username: string;
  instagram_user_id: string;
  connected_at: string;
  expires_at: string;
}

export default function InstagramConnect() {
  const { session } = useAuth();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Check for OAuth callback code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && session) {
      handleCodeExchange(code);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [session]);

  useEffect(() => {
    if (session) fetchConnection();
  }, [session]);

  const fetchConnection = async () => {
    try {
      const { data } = await supabase.functions.invoke("instagram-oauth", {
        body: { action: "get_connection" },
      });
      setConnection(data?.connection || null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("instagram-oauth", {
        body: { action: "get_auth_url", redirect_uri: REDIRECT_URI },
      });
      if (error) throw error;
      window.location.href = data.auth_url;
    } catch (err: any) {
      toast.error("Fehler: " + (err.message || "Unbekannt"));
      setConnecting(false);
    }
  };

  const handleCodeExchange = async (code: string) => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("instagram-oauth", {
        body: { action: "exchange_code", code, redirect_uri: REDIRECT_URI },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(`Instagram verbunden: @${data.username}`);
        await fetchConnection();
      }
    } catch (err: any) {
      toast.error("Verbindung fehlgeschlagen: " + (err.message || "Unbekannt"));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await supabase.functions.invoke("instagram-oauth", {
        body: { action: "disconnect" },
      });
      setConnection(null);
      toast.success("Instagram-Verbindung getrennt");
    } catch {
      toast.error("Fehler beim Trennen");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Lade Verbindung…
      </div>
    );
  }

  if (connection) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">@{connection.instagram_username}</p>
          <p className="text-xs text-muted-foreground">
            Verbunden seit {new Date(connection.connected_at).toLocaleDateString("de-DE")}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDisconnect}>
          <Unplug className="w-4 h-4 mr-1" /> Trennen
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={connecting} className="gap-2">
      {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Instagram className="w-4 h-4" />}
      Instagram verbinden
    </Button>
  );
}
