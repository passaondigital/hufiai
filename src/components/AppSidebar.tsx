import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  MessageSquare, FolderKanban, FileText, CreditCard, Settings,
  LogOut, ChevronLeft, ChevronRight, Plus, Sparkles, Shield,
  ArrowLeftRight, Building2, Map, Megaphone, Crown, Heart
} from "lucide-react";
import { toast } from "sonner";

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, isAdmin, signOut, switchUserType } = useAuth();
  const { isFounderFlowActive, founderFlowDaysLeft, hasGewerbeAccess } = useSubscription();
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

  const navItems = [
    { icon: MessageSquare, label: "Chat", path: "/" },
    { icon: Sparkles, label: "Meine Pferde", path: "/horses" },
    ...(profile?.user_type === "gewerbe" || hasGewerbeAccess ? [
      { icon: FolderKanban, label: "Projekte", path: "/projects" },
      { icon: Building2, label: "Firmenprofil", path: "/company" },
      { icon: Megaphone, label: "Content Hub", path: "/content" },
    ] : []),
    ...(isFounderFlowActive ? [
      { icon: Crown, label: `Founder Coach (${founderFlowDaysLeft}d)`, path: "/founder-coach" },
    ] : []),
    { icon: FileText, label: "Wissensdatenbank", path: "/knowledge" },
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
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-bold text-sidebar-foreground text-lg">HufiAi</span>
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
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full sidebar-item ${active ? "sidebar-item-active" : "sidebar-item-inactive"}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
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
