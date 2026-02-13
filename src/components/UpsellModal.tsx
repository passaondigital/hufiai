import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export default function UpsellModal({ open, onOpenChange, featureName }: UpsellModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const startFounderFlow = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const { data: existing } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const payload = {
        user_id: user.id,
        plan: "gewerbe_pro",
        founder_flow_active: true,
        founder_flow_started_at: now.toISOString(),
        founder_flow_expires_at: expires.toISOString(),
        grant_reason: "Founder Flow – 30 Tage Trial",
      };

      if (existing) {
        await supabase.from("user_subscriptions").update(payload).eq("user_id", user.id);
      } else {
        await supabase.from("user_subscriptions").insert(payload);
      }

      toast.success("Founder Flow gestartet! 30 Tage Gewerbe Pro freigeschaltet.");
      onOpenChange(false);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Starten des Founder Flows");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Business-Feature freischalten
          </DialogTitle>
          <DialogDescription>
            {featureName
              ? `„${featureName}" ist ein Gewerbe-Feature.`
              : "Diese Funktion ist Teil des Gewerbe-Plans."}
            {" "}Wähle eine Option:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <button
            onClick={startFounderFlow}
            className="w-full p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Founder Flow starten</p>
                <p className="text-xs text-muted-foreground">30 Tage Gewerbe Pro kostenlos – inkl. KI-Coach</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { onOpenChange(false); navigate("/pricing"); }}
            className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">Direkt upgraden</p>
                <p className="text-xs text-muted-foreground">Alle Pläne vergleichen und sofort upgraden</p>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
