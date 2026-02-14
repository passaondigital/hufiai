import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ScanLine } from "lucide-react";
import hufiaiLogo from "@/assets/hufiai-logo.svg";

export default function MobileHeader() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Derive a short display ID from the profile
  const displayId = profile?.user_id
    ? `#kid-${profile.user_id.substring(0, 5).toUpperCase()}`
    : null;

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-card border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <img
          src={hufiaiLogo}
          alt="HufiAi"
          className="h-8 cursor-pointer"
          onClick={() => navigate("/")}
        />

        {/* Right side: ID + Scan button */}
        <div className="flex items-center gap-2">
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
