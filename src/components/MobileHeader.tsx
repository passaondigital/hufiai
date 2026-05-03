import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ScanLine, ChevronLeft } from "lucide-react";
import hufiaiLogo from "@/assets/hufiai-logo.svg";

export default function MobileHeader() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const displayId = profile?.user_id
    ? `#kid-${profile.user_id.substring(0, 5).toUpperCase()}`
    : null;

  const showBack = location.pathname !== "/" && location.pathname !== "/archiv";

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-card border-b border-border md:hidden">
      <div className="grid grid-cols-3 items-center px-4 h-14">
        <div className="flex items-center">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-foreground hover:bg-muted transition-colors"
              aria-label="Zurück"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>

        <div className="flex justify-center">
          <img
            src={hufiaiLogo}
            alt="HufiAi"
            className="h-8 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          {displayId && (
            <span className="text-xs font-bold text-foreground bg-muted px-2 py-1 rounded-md">
              {displayId}
            </span>
          )}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 min-h-[36px] rounded-lg text-xs font-semibold"
          >
            <ScanLine className="w-4 h-4" />
            Scan
          </button>
        </div>
      </div>
    </header>
  );
}
