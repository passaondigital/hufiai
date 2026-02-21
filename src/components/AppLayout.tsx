import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useSubscription } from "@/hooks/useSubscription";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useEcosystemRealtime } from "@/hooks/useEcosystemRealtime";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileBottomNav from "./MobileBottomNav";
import MobileHeader from "./MobileHeader";
import {
  MessageSquare, FolderKanban, FileText, CreditCard, Settings,
  LogOut, ChevronLeft, ChevronRight, Plus, Shield, ArrowLeftRight,
  Building2, Map, Megaphone, Crown, Heart, Award, Users, Sparkles,
  Link2, Database, Bell, Video, Globe
} from "lucide-react";
import hufiaiLogo from "@/assets/hufiai-logo.svg";
import { toast } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
  /** If true, the layout won't render sidebar (for OmniInterface which has its own panels) */
  omniMode?: boolean;
}

export default function AppLayout({ children, omniMode = false }: AppLayoutProps) {
  useEcosystemRealtime();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto pt-14 pb-[72px]">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  if (omniMode) {
    return (
      <div className="flex h-screen overflow-hidden w-full">
        <OmniNavRail />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <FullSidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

/** Narrow icon-rail for Omni mode - always visible, minimal width */
function OmniNavRail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile, isAdmin } = useAuth();
  const { lang, setLang } = useI18n();
  const { isFounderFlowActive, hasGewerbeAccess } = useSubscription();
  const unreadCount = useUnreadNotifications();

  const navItems = [
    { icon: MessageSquare, path: "/", label: "Chat" },
    { icon: Sparkles, path: "/horses", label: lang === "de" ? "Pferde" : "Horses" },
    ...(profile?.user_type === "gewerbe" || hasGewerbeAccess ? [
      { icon: FolderKanban, path: "/projects", label: lang === "de" ? "Projekte" : "Projects" },
      { icon: Megaphone, path: "/content", label: "Content" },
    ] : []),
    { icon: Video, path: "/video-engine", label: "Video" },
    { icon: FileText, path: "/knowledge", label: lang === "de" ? "Wissen" : "Knowledge" },
    { icon: Database, path: "/hufmanager", label: "HufManager" },
    { icon: Link2, path: "/ecosystem", label: "Ecosystem" },
    { icon: Users, path: "/expert-dashboard", label: lang === "de" ? "Experten" : "Experts" },
    ...(isFounderFlowActive ? [{ icon: Crown, path: "/founder-coach", label: "Coach" }] : []),
    { icon: Heart, path: "/support", label: "Support" },
    { icon: CreditCard, path: "/pricing", label: lang === "de" ? "Preise" : "Pricing" },
    { icon: Settings, path: "/settings", label: lang === "de" ? "Einstellungen" : "Settings" },
    ...(isAdmin ? [
      { icon: Shield, path: "/admin", label: "Admin" },
      { icon: Map, path: "/roadmap", label: "Roadmap" },
    ] : []),
  ];

  return (
    <div className="w-[60px] bg-sidebar flex flex-col items-center py-3 border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="mb-3 cursor-pointer" onClick={() => navigate("/")}>
        <img src={hufiaiLogo} alt="HufiAi" className="h-8 w-8 object-contain" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 w-full overflow-y-auto space-y-0.5 px-1.5">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path + item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors relative ${
                active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
              {item.path === "/hufmanager" && unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-1 w-full px-1.5 pt-2 border-t border-sidebar-border mt-2">
        <button
          onClick={() => setLang(lang === "de" ? "en" : "de")}
          className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title={lang === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
        >
          <Globe className="w-4 h-4" />
        </button>
        <button
          onClick={async () => { await signOut(); navigate("/auth"); }}
          className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-muted hover:text-destructive hover:bg-sidebar-accent transition-colors"
          title={lang === "de" ? "Abmelden" : "Sign out"}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/** Full sidebar for non-Omni pages */
function FullSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isAdmin, signOut, switchUserType } = useAuth();
  const { lang, setLang } = useI18n();
  const { isFounderFlowActive, founderFlowDaysLeft, hasGewerbeAccess } = useSubscription();
  const unreadCount = useUnreadNotifications();

  const handleSignOut = async () => { await signOut(); navigate("/auth"); };
  const handleSwitchType = async () => {
    const newType = profile?.user_type === "privat" ? "gewerbe" : "privat";
    try {
      await switchUserType(newType as "privat" | "gewerbe");
      toast.success(`${lang === "de" ? "Gewechselt zu" : "Switched to"} ${newType === "privat" ? "Privat" : "Gewerbe"}`);
    } catch { toast.error(lang === "de" ? "Wechsel fehlgeschlagen" : "Switch failed"); }
  };

  const navItems: { icon: any; label: string; path: string; badge?: number }[] = [
    { icon: MessageSquare, label: "Chat", path: "/" },
    { icon: Sparkles, label: lang === "de" ? "Meine Pferde" : "My Horses", path: "/horses" },
    ...(profile?.user_type === "gewerbe" || hasGewerbeAccess ? [
      { icon: FolderKanban, label: lang === "de" ? "Projekte" : "Projects", path: "/projects" },
      { icon: Building2, label: lang === "de" ? "Firmenprofil" : "Company", path: "/company" },
      { icon: Megaphone, label: "Content Hub", path: "/content" },
    ] : []),
    ...(profile?.sub_role && ["hufbearbeiter", "tierarzt", "stallbetreiber"].includes(profile.sub_role) ? [
      { icon: Award, label: lang === "de" ? "Experten-Profil" : "Expert Profile", path: "/pro-profile" },
    ] : []),
    { icon: Users, label: lang === "de" ? "Experten-Dashboard" : "Expert Dashboard", path: "/expert-dashboard" },
    ...(isFounderFlowActive ? [
      { icon: Crown, label: `Founder Coach (${founderFlowDaysLeft}d)`, path: "/founder-coach" },
    ] : []),
    { icon: FileText, label: lang === "de" ? "Wissensdatenbank" : "Knowledge Base", path: "/knowledge" },
    { icon: Database, label: "HufManager", path: "/hufmanager" },
    { icon: Link2, label: "Ecosystem", path: "/ecosystem" },
    { icon: Video, label: "Video Engine", path: "/video-engine" },
    { icon: Bell, label: lang === "de" ? "Benachrichtigungen" : "Notifications", path: "/hufmanager", badge: unreadCount },
    { icon: Heart, label: lang === "de" ? "Support & Hilfe" : "Support & Help", path: "/support" },
    { icon: CreditCard, label: lang === "de" ? "Preise" : "Pricing", path: "/pricing" },
    { icon: Settings, label: lang === "de" ? "Einstellungen" : "Settings", path: "/settings" },
    ...(isAdmin ? [
      { icon: Shield, label: "Admin", path: "/admin" },
      { icon: Map, label: "Roadmap", path: "/roadmap" },
    ] : []),
  ];

  return (
    <aside className={`h-screen bg-sidebar flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && <img src={hufiaiLogo} alt="HufiAi" className="h-[4.25rem]" />}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="p-3">
        <button onClick={() => navigate("/")} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          {!collapsed && (lang === "de" ? "Neuer Chat" : "New Chat")}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path + item.label}
              onClick={() => navigate(item.path)}
              className={`w-full sidebar-item ${active ? "sidebar-item-active" : "sidebar-item-inactive"} relative`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && item.label}
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none px-1">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === "de" ? "en" : "de")}
          className="w-full sidebar-item sidebar-item-inactive"
        >
          <Globe className="w-5 h-5 shrink-0" />
          {!collapsed && (lang === "de" ? "English" : "Deutsch")}
        </button>

        {!collapsed && profile && (
          <button onClick={handleSwitchType} className="w-full sidebar-item sidebar-item-inactive justify-between">
            <span className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              {profile.user_type === "privat" ? "Privat" : "Gewerbe"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sidebar-primary/20 text-sidebar-primary">
              {lang === "de" ? "Wechseln" : "Switch"}
            </span>
          </button>
        )}
        {collapsed && profile && (
          <button onClick={handleSwitchType} className="w-full sidebar-item sidebar-item-inactive justify-center" title={lang === "de" ? "Kontotyp wechseln" : "Switch account type"}>
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        )}
        <button onClick={handleSignOut} className="w-full sidebar-item sidebar-item-inactive">
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && (lang === "de" ? "Abmelden" : "Sign out")}
        </button>
      </div>
    </aside>
  );
}
