import AppLayout from "@/components/AppLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { Crown, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  { title: "Firmenprofil anlegen", desc: "Logo, Adresse und Steuernummer hinterlegen.", path: "/company" },
  { title: "Erstes Projekt erstellen", desc: "Lege einen Kundenfall oder ein Projekt an.", path: "/projects" },
  { title: "Pferdeprofil hinzufügen", desc: "Erfasse dein erstes Kundenpferd mit allen Details.", path: "/horses" },
  { title: "Wissensdatenbank füllen", desc: "Lade Fachdokumente hoch, die deine KI nutzen kann.", path: "/knowledge" },
  { title: "Social Media Post erstellen", desc: "Generiere deinen ersten Content für Social Media.", path: "/content" },
  { title: "PDF-Bericht exportieren", desc: "Erstelle einen professionellen Kundenbericht als PDF.", path: "/" },
];

export default function FounderCoach() {
  const { isFounderFlowActive, founderFlowDaysLeft } = useSubscription();
  const navigate = useNavigate();

  if (!isFounderFlowActive) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Founder Flow nicht aktiv</h2>
            <p className="text-muted-foreground text-sm">Starte den Founder Flow über die Preise-Seite oder das Dashboard.</p>
            <Button className="mt-4" onClick={() => navigate("/pricing")}>Zu den Preisen</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-2xl mx-auto overflow-y-auto h-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Founder Coach</h1>
            <p className="text-sm text-muted-foreground">
              Dein 30-Tage-Plan zum Business-Start · noch <strong>{founderFlowDaysLeft} Tage</strong>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <button
              key={step.title}
              onClick={() => navigate(step.path)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-sm text-muted-foreground">
            Nach Ablauf der 30 Tage kannst du jederzeit auf <strong>Gewerbe Pro</strong> upgraden, um alle Features zu behalten.
          </p>
          <Button variant="outline" className="mt-3" onClick={() => navigate("/pricing")}>
            Pläne vergleichen
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
