import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutDashboard, Users, Sparkles, Calendar, Receipt, BarChart2,
  Camera, Filter, Settings, BookOpen, FolderOpen, Network, StickyNote,
  Lock, Shield, MapPin, Package, Timer, CheckSquare, NotebookPen,
} from "lucide-react";

type TileConfig = {
  label: string;
  icon: React.ElementType;
  path: string;
};

const employeeTiles: TileConfig[] = [
  { label: "Cockpit", icon: LayoutDashboard, path: "/hufmanager" },
  { label: "Tour", icon: MapPin, path: "/hufmanager" },
  { label: "HufCam", icon: Camera, path: "/horses" },
  { label: "Material", icon: Package, path: "/hufmanager" },
  { label: "Timer", icon: Timer, path: "/hufmanager" },
  { label: "Aufgaben", icon: CheckSquare, path: "/projects" },
  { label: "Kalender", icon: Calendar, path: "/hufmanager" },
  { label: "Notizbuch", icon: NotebookPen, path: "/projects" },
  { label: "Einstellungen", icon: Settings, path: "/einstellungen" },
];

const providerTiles: TileConfig[] = [
  { label: "Cockpit", icon: LayoutDashboard, path: "/hufmanager" },
  { label: "Kunden", icon: Users, path: "/hufmanager" },
  { label: "Pferde", icon: Sparkles, path: "/horses" },
  { label: "Kalender", icon: Calendar, path: "/hufmanager" },
  { label: "Rechnungen", icon: Receipt, path: "/hufmanager" },
  { label: "Analyse", icon: BarChart2, path: "/hufmanager" },
  { label: "HufCam", icon: Camera, path: "/horses" },
  { label: "Trichter", icon: Filter, path: "/content" },
  { label: "Einstellungen", icon: Settings, path: "/einstellungen" },
];

const ownerTiles: TileConfig[] = [
  { label: "Pferdeakte", icon: Sparkles, path: "/horses" },
  { label: "Termine", icon: Calendar, path: "/hufmanager" },
  { label: "Wissen", icon: BookOpen, path: "/knowledge" },
  { label: "Dokumente", icon: FolderOpen, path: "/projects" },
  { label: "Netzwerk", icon: Network, path: "/ecosystem" },
  { label: "Notizen", icon: StickyNote, path: "/projects" },
  { label: "Tresor", icon: Lock, path: "/settings" },
  { label: "Datenschutz", icon: Shield, path: "/datenschutz-einstellungen" },
  { label: "Einstellungen", icon: Settings, path: "/einstellungen" },
];

const EMPLOYEE_ROLES = ["hufbearbeiter", "tierarzt", "stallbetreiber"] as const;

function resolveTiles(
  userType: string | undefined,
  subRole: string | null | undefined
): { tiles: TileConfig[]; subtitle: string } {
  if (subRole && EMPLOYEE_ROLES.includes(subRole as typeof EMPLOYEE_ROLES[number])) {
    return { tiles: employeeTiles, subtitle: "Dein Mitarbeiter-Bereich" };
  }
  if (userType === "gewerbe") {
    return { tiles: providerTiles, subtitle: "Dein Provider-Bereich" };
  }
  return { tiles: ownerTiles, subtitle: "Dein persönlicher Bereich" };
}

export default function Archiv() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { tiles, subtitle } = resolveTiles(profile?.user_type, profile?.sub_role);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Archiv</h1>
          <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Card
                key={tile.label}
                onClick={() => navigate(tile.path)}
                className="hover:bg-accent transition-colors cursor-pointer"
              >
                <CardContent className="flex flex-col items-center justify-center gap-2 p-4">
                  <Icon className="w-8 h-8 text-primary" />
                  <span className="text-sm font-medium text-center leading-tight">
                    {tile.label}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
