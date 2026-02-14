import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { useEcosystemRealtime } from "@/hooks/useEcosystemRealtime";

export default function AppLayout({ children }: { children: ReactNode }) {
  useEcosystemRealtime();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
