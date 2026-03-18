import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LevelBadge from "@/components/LevelBadge";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import {
  MessageSquare, FolderKanban, FileText, CreditCard, Settings,
  LogOut, ChevronLeft, ChevronRight, Plus, Shield,
  ArrowLeftRight, Building2, Map, Megaphone, Crown, Heart, Award, Users, Sparkles, Link2, Database, Bell, Video, BookOpen, Trophy
} from "lucide-react";
import hufiaiLogo from "@/assets/hufiai-logo.svg";

import { toast } from "sonner";

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, isAdmin, signOut, switchUserType } = useAuth();
  const { isFounderFlowActive, founderFlowDaysLeft, hasGewerbeAccess } = useSubscription();
  const unreadCount = useUnreadNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSwitchType = async () => {
    const newType = profile?.user_type === "privat" ? "gewerbe" : "privat";
    try {
      await switchUserType(newType as "privat" | "gewerbe");
      toast.success(`Gewechselt zu ${newType === "privat" ? "Privat" : "Gewerbe"}`);
    } catch {
      toast.error("Wechsel fehlgeschlagen");
    }
  };

  const navItems: { icon: any; label: string; path: string; badge?: number }[] = [
    { icon: MessageSquare, label: "Chat", path: "/" },
    { icon: Trophy, label: "Gamification", path: "/gamification" },
    { icon: BookOpen, label: "Prompt-Bibliothek", path: "/prompts" },
    { icon: Sparkles, label: "Meine Pferde", path: "/horses" },
    ...(profile?.user_type === "gewerbe" || hasGewerbeAccess ? [
      { icon: FolderKanban, label: "Projekte", path: "/projects" },
      { icon: Building2, label: "Firmenprofil", path: "/company" },
      { icon: Megaphone, label: "Content Hub", path: "/content" },
    ] : []),
    ...(profile?.sub_role && ["hufbearbeiter", "tierarzt", "stallbetreiber"].includes(profile.sub_role) ? [
      { icon: Award, label: "Experten-Profil", path: "/pro-profile" },
    ] : []),
    { icon: Users, label: "Experten-Dashboard", path: "/expert-dashboard" },
    ...(isFounderFlowActive ? [
      { icon: Crown, label: `Founder Coach (${founderFlowDaysLeft}d)`, path: "/founder-coach" },
    ] : []),
    { icon: FileText, label: "Wissensdatenbank", path: "/knowledge" },
    { icon: Database, label: "HufManager", path: "/hufmanager" },
    { icon: Link2, label: "Ecosystem", path: "/ecosystem" },
    { icon: Video, label: "Video Engine", path: "/video-engine" },
    { icon: Bell, label: "Benachrichtigungen", path: "/hufmanager", badge: unreadCount },
    { icon: Heart, label: "Support & Hilfe", path: "/support" },
    { icon: CreditCard, label: "Preise", path: "/pricing" },
    { icon: Settings, label: "Einstellungen", path: "/settings" },
    ...(isAdmin ? [
      { icon: Shield, label: "Admin", path: "/admin" },
      { icon: Map, label: "Roadmap", path: "/roadmap" },
    ] : []),
  ];

  return (
    <aside className={`h-screen bg-sidebar flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={hufiaiLogo} alt="HufiAi" className="h-[4.25rem]" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {!collapsed && "Neuer Chat"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
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

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {/* Level Badge */}
        {!collapsed && <LevelBadge variant="sidebar" />}
        {collapsed && <LevelBadge variant="mini" className="justify-center" />}
        {/* User type badge + switch */}
        {!collapsed && profile && (
          <button
            onClick={handleSwitchType}
            className="w-full sidebar-item sidebar-item-inactive justify-between"
          >
            <span className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              {profile.user_type === "privat" ? "Privat" : "Gewerbe"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sidebar-primary/20 text-sidebar-primary">
              Wechseln
            </span>
          </button>
        )}
        {collapsed && profile && (
          <button onClick={handleSwitchType} className="w-full sidebar-item sidebar-item-inactive justify-center" title="Kontotyp wechseln">
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        )}
        <button onClick={handleSignOut} className="w-full sidebar-item sidebar-item-inactive">
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && "Abmelden"}
        </button>
      </div>
    </aside>
  );
}
