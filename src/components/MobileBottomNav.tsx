import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ScanLine, MessageSquare, CalendarDays, Menu } from "lucide-react";
import MobileSlideMenu from "./MobileSlideMenu";

const navItems = [
  { icon: Home, label: "Übersicht", path: "/" },
  { icon: CalendarDays, label: "Termine", path: "/hufmanager" },
  { icon: ScanLine, label: "Pferde", path: "/horses" },
  { icon: MessageSquare, label: "Hufi", path: "/chat" },
];

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border md:hidden">
        <div className="flex items-stretch">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] transition-colors ${
              menuOpen ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[11px] font-medium">Menü</span>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      <MobileSlideMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
