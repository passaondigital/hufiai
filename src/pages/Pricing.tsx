import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "0€",
    features: ["Basis-Chat (5/Tag)", "1 Pferdeprofil", "DSGVO-konform", "EU-Server"],
    cta: "Kostenlos starten",
  },
  {
    name: "Business Pro",
    price: "29€/Monat",
    features: [
      "Unbegrenzte Chats",
      "Unbegrenzte Pferdeprofile",
      "Projekte & Fallverwaltung",
      "PDF-Export mit Firmenlogo",
      "Firmenprofil & Branding",
      "10 Social Media Posts/Monat",
      "Wissensdatenbank",
      "Prioritäts-Support",
    ],
    cta: "Jetzt upgraden",
    highlight: true,
  },
  {
    name: "Social Media Add-on",
    price: "14,99€/Monat",
    features: [
      "Unbegrenzte Social Media Posts",
      "Content-Kalender",
      "KI-Schreibstil-Lernung",
      "Multi-Plattform (Reels, LinkedIn, Blog)",
      "Automatische Hashtag-Optimierung",
    ],
    cta: "Add-on buchen",
    addon: true,
  },
];

export default function Pricing() {
  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Preise</h1>
          <p className="text-muted-foreground">
            Starte kostenlos – upgrade, wenn du mehr brauchst.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-card rounded-2xl border-2 p-8 flex flex-col ${
                plan.highlight
                  ? "border-primary shadow-lg relative"
                  : (plan as any).addon
                    ? "border-accent relative"
                    : "border-border"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />Empfohlen
                  </span>
                </div>
              )}
              {(plan as any).addon && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" />Add-on
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-2xl font-bold mt-2 mb-6">{plan.price}</p>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? "default" : "outline"}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
