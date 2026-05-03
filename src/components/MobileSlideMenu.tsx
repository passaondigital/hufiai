import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useSubscription } from "@/hooks/useSubscription";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MessageSquare, FolderKanban, FileText, CreditCard, UserCog, LogOut,
  Shield, Link2, Heart, Video, Database, Megaphone, Building2, Crown,
  Award, Users, Map, Globe, Bell, Sparkles, ArrowLeftRight, Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface MobileSlideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileSlideMenu({ open, onOpenChange }: MobileSlideMenuProps) {
  const { user, profile, signOut, isAdmin, switchUserType, refreshProfile } = useAuth();
  const { lang, setLang } = useI18n();
  const { isFounderFlowActive, founderFlowDaysLeft, hasGewerbeAccess } = useSubscription();
  const unreadCount = useUnreadNotifications();
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleSwitchType = async () => {
    const newType = profile?.user_type === "privat" ? "gewerbe" : "privat";
    try {
      await switchUserType(newType as "privat" | "gewerbe");
      toast.success(`${lang === "de" ? "Gewechselt zu" : "Switched to"} ${newType === "privat" ? "Privat" : "Gewerbe"}`);
    } catch { toast.error(lang === "de" ? "Wechsel fehlgeschlagen" : "Switch failed"); }
  };

  const isActive = (path: string) => location.pathname === path;

  const menuLinkClass = (path: string) =>
    `flex items-center gap-3 w-full min-h-[48px] px-4 rounded-lg text-sm font-medium transition-colors ${
      isActive(path) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
    }`;

  // Build nav sections
  const mainNav = [
    { icon: MessageSquare, label: "Chat", path: "/" },
    { icon: Sparkles, label: lang === "de" ? "Meine Pferde" : "My Horses", path: "/horses" },
    { icon: FileText, label: lang === "de" ? "Wissensdatenbank" : "Knowledge", path: "/knowledge" },
    { icon: Video, label: "Video Engine", path: "/video-engine" },
    { icon: Database, label: "HufManager", path: "/hufmanager", badge: unreadCount },
    { icon: Link2, label: "Ecosystem", path: "/ecosystem" },
    { icon: Users, label: lang === "de" ? "Experten-Dashboard" : "Expert Dashboard", path: "/expert-dashboard" },
  ];

  const businessNav = (profile?.user_type === "gewerbe" || hasGewerbeAccess) ? [
    { icon: FolderKanban, label: lang === "de" ? "Projekte" : "Projects", path: "/projects" },
    { icon: Building2, label: lang === "de" ? "Firmenprofil" : "Company", path: "/company" },
    { icon: Megaphone, label: "Content Hub", path: "/content" },
  ] : [];

  const expertNav = (profile?.sub_role && ["hufbearbeiter", "tierarzt", "stallbetreiber"].includes(profile.sub_role)) ? [
    { icon: Award, label: lang === "de" ? "Experten-Profil" : "Expert Profile", path: "/pro-profile" },
  ] : [];

  const founderNav = isFounderFlowActive ? [
    { icon: Crown, label: `Founder Coach (${founderFlowDaysLeft}d)`, path: "/founder-coach" },
  ] : [];

  const adminNav = isAdmin ? [
    { icon: Shield, label: "Admin", path: "/admin" },
    { icon: Map, label: "Roadmap", path: "/roadmap" },
  ] : [];

  const renderNavItem = (item: { icon: any; label: string; path: string; badge?: number }) => (
    <button key={item.path + item.label} onClick={() => navTo(item.path)} className={menuLinkClass(item.path)}>
      <item.icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && item.badge > 0 && (
        <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </button>
  );

  const SectionTitle = ({ children }: { children: string }) => (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
      {children}
    </p>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[85vw] max-w-sm p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-5 pb-4 border-b border-border">
          <SheetTitle className="text-left">
            <span className="block text-lg font-bold text-foreground">{displayName}</span>
            <span className="block text-sm font-bold text-primary mt-0.5">{displayId}</span>
            {profile?.user_type && (
              <span className="inline-block text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1.5">
                {profile.user_type === "privat" ? "Privat" : "Gewerbe"}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Main features */}
          <div className="p-4">
            <SectionTitle>{lang === "de" ? "Funktionen" : "Features"}</SectionTitle>
            <div className="space-y-0.5">
              {mainNav.map(renderNavItem)}
            </div>
          </div>

          {/* Business section */}
          {businessNav.length > 0 && (
            <div className="p-4 pt-0">
              <SectionTitle>{lang === "de" ? "Gewerbe" : "Business"}</SectionTitle>
              <div className="space-y-0.5">
                {businessNav.map(renderNavItem)}
              </div>
            </div>
          )}

          {/* Expert section */}
          {expertNav.length > 0 && (
            <div className="p-4 pt-0">
              <SectionTitle>{lang === "de" ? "Experte" : "Expert"}</SectionTitle>
              <div className="space-y-0.5">
                {expertNav.map(renderNavItem)}
              </div>
            </div>
          )}

          {/* Founder */}
          {founderNav.length > 0 && (
            <div className="p-4 pt-0">
              <div className="space-y-0.5">
                {founderNav.map(renderNavItem)}
              </div>
            </div>
          )}

          {/* KI-Training */}
          <div className="p-4 pt-0">
            <SectionTitle>KI-Training</SectionTitle>
            <div className="flex items-center justify-between min-h-[48px] px-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <span className="text-sm font-medium">Hufi Training</span>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {lang === "de" ? "Anonymisierte Daten für das Hufi-Modell" : "Anonymous data for the Hufi model"}
                  </p>
                </div>
              </div>
              <Switch checked={trainingConsent} onCheckedChange={toggleTrainingConsent} />
            </div>
          </div>

          {/* Verwaltung */}
          <div className="p-4 pt-0">
            <SectionTitle>{lang === "de" ? "Verwaltung" : "Management"}</SectionTitle>
            <div className="space-y-0.5">
              <button onClick={() => navTo("/pricing")} className={menuLinkClass("/pricing")}>
                <CreditCard className="w-5 h-5 text-primary shrink-0" />
                {lang === "de" ? "Abos & Pläne" : "Plans & Pricing"}
              </button>
              <button onClick={() => navTo("/support")} className={menuLinkClass("/support")}>
                <Heart className="w-5 h-5 text-primary shrink-0" />
                {lang === "de" ? "Support & Hilfe" : "Support & Help"}
              </button>
              <button onClick={() => navTo("/settings")} className={menuLinkClass("/settings")}>
                <UserCog className="w-5 h-5 text-primary shrink-0" />
                {lang === "de" ? "Profileinstellungen" : "Profile Settings"}
              </button>
              <button onClick={() => navTo("/einstellungen")} className={menuLinkClass("/einstellungen")}>
                <Settings2 className="w-5 h-5 text-primary shrink-0" />
                {lang === "de" ? "Hufi Einstellungen" : "Hufi Settings"}
              </button>
            </div>
          </div>

          {/* Admin */}
          {adminNav.length > 0 && (
            <div className="p-4 pt-0">
              <SectionTitle>Admin</SectionTitle>
              <div className="space-y-0.5">
                {adminNav.map(renderNavItem)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-2">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className="flex items-center gap-3 w-full min-h-[44px] px-4 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Globe className="w-5 h-5 shrink-0" />
            {lang === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
          </button>

          {/* Type switcher */}
          {profile && (
            <button
              onClick={handleSwitchType}
              className="flex items-center justify-between w-full min-h-[44px] px-4 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-3">
                <ArrowLeftRight className="w-5 h-5 shrink-0" />
                {profile.user_type === "privat" ? "Privat" : "Gewerbe"}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                {lang === "de" ? "Wechseln" : "Switch"}
              </span>
            </button>
          )}

          {/* Logout */}
          <button onClick={handleLogout} className="flex items-center gap-3 w-full min-h-[48px] px-4 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-5 h-5 shrink-0" />
            {lang === "de" ? "Abmelden" : "Sign out"}
          </button>
          <p className="text-[10px] text-muted-foreground text-center">Hufi v1.0.0</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
