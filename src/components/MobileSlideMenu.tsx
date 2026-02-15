import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Link2,
  CreditCard,
  FileText,
  UserCog,
  LogOut,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface MobileSlideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileSlideMenu({ open, onOpenChange }: MobileSlideMenuProps) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [trainingConsent, setTrainingConsent] = useState(false);

  useEffect(() => {
    setTrainingConsent(profile?.is_data_contribution_active ?? false);
  }, [profile]);

  const displayId = profile?.user_id
    ? `#kid-${profile.user_id.substring(0, 5).toUpperCase()}`
    : "";

  const displayName = profile?.display_name || user?.email || "Nutzer";

  const toggleTrainingConsent = async (value: boolean) => {
    if (!user) return;
    setTrainingConsent(value);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_data_contribution_active: value })
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(value ? "KI-Training aktiviert" : "KI-Training deaktiviert");
    } catch (err: any) {
      setTrainingConsent(!value);
      toast.error(err.message);
    }
  };

  const navTo = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleLogout = async () => {
    await signOut();
    onOpenChange(false);
    navigate("/landing");
  };

  const menuLinkClass =
    "flex items-center gap-3 w-full min-h-[48px] px-4 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[85vw] max-w-sm p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-5 pb-4 border-b border-border">
          <SheetTitle className="text-left">
            <span className="block text-lg font-bold text-foreground">{displayName}</span>
            <span className="block text-sm font-bold text-primary mt-0.5">{displayId}</span>
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Mein Ökosystem */}
          <div className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Mein Ökosystem
            </p>
            <button onClick={() => navTo("/ecosystem")} className={menuLinkClass}>
              <Link2 className="w-5 h-5 text-primary shrink-0" />
              Ecosystem Connect
            </button>
          </div>

          {/* KI-Training */}
          <div className="p-4 pt-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              KI-Training
            </p>
            <div className="flex items-center justify-between min-h-[48px] px-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <span className="text-sm font-medium">HufiAi Training</span>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    Anonymisierte Daten für das HufiAi-Modell
                  </p>
                </div>
              </div>
              <Switch checked={trainingConsent} onCheckedChange={toggleTrainingConsent} />
            </div>
          </div>

          {/* Verwaltung */}
          <div className="p-4 pt-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Verwaltung
            </p>
            <div className="space-y-1">
              <button onClick={() => navTo("/pricing")} className={menuLinkClass}>
                <CreditCard className="w-5 h-5 text-primary shrink-0" />
                Abos & Pläne
              </button>
              <button onClick={() => navTo("/support")} className={menuLinkClass}>
                <FileText className="w-5 h-5 text-primary shrink-0" />
                Rechnungen & Support
              </button>
              <button onClick={() => navTo("/settings")} className={menuLinkClass}>
                <UserCog className="w-5 h-5 text-primary shrink-0" />
                Profileinstellungen
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-3">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full min-h-[48px] px-4 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-5 h-5 shrink-0" />
            Abmelden
          </button>
          <p className="text-[10px] text-muted-foreground text-center">HufiAi v1.0.0</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
