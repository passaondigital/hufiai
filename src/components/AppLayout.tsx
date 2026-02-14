import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";
import MobileHeader from "./MobileHeader";
import { useEcosystemRealtime } from "@/hooks/useEcosystemRealtime";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AppLayout({ children }: { children: ReactNode }) {
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

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
