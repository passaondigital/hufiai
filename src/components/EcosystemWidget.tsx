import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Link2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LinkRow {
  app_key: string;
  status: string;
}

const APP_NAMES: Record<string, string> = {
  hufmanager: "HufManager",
  hufiai: "Hufi",
  hufiapp: "HufiApp",
  memberhorse: "MemberHorse",
};

export default function EcosystemWidget() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("ecosystem_links")
      .select("app_key, status")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setLinks(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const connected = links.filter((l) => l.status === "connected").length;
  const total = Object.keys(APP_NAMES).length;

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate("/ecosystem")}
      className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-all text-left w-full group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Link2 className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold">Ecosystem</span>
        <span className="ml-auto text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
          {connected}/{total} verbunden
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {Object.entries(APP_NAMES).map(([key, name]) => {
          const isConnected = links.some((l) => l.app_key === key && l.status === "connected");
          return (
            <div
              key={key}
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${
                isConnected
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                  : "border-border bg-muted/50 text-muted-foreground"
              }`}
            >
              {isConnected ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {name}
            </div>
          );
        })}
      </div>
    </button>
  );
}
