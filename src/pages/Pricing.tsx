import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const privatePlans = [
  { name: "Kostenlos", price: "0€", features: ["5 Chats/Tag", "Basis-KI", "DSGVO-konform"], cta: "Aktiv" },
  { name: "Plus", price: "9,99€/Monat", features: ["Unbegrenzte Chats", "Premium-KI-Modelle", "Wissensdatenbank", "Prioritäts-Support"], cta: "Upgraden", highlight: true },
];

const gewerbePlans = [
  { name: "Starter", price: "29€/Monat", features: ["10 Nutzer", "Projekte", "Basis-KI", "DSGVO-konform"], cta: "Starten" },
  { name: "Pro", price: "79€/Monat", features: ["50 Nutzer", "Alle KI-Modelle", "API-Zugang", "Prioritäts-Support", "Wissensdatenbank"], cta: "Upgraden", highlight: true },
  { name: "Enterprise", price: "Auf Anfrage", features: ["Unbegrenzte Nutzer", "Dedizierte KI", "SLA", "On-Premise Option", "Individuelle Anpassung"], cta: "Kontakt" },
];

export default function Pricing() {
  const { profile } = useAuth();
  const plans = profile?.user_type === "gewerbe" ? gewerbePlans : privatePlans;

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Preise</h1>
          <p className="text-muted-foreground">
            {profile?.user_type === "gewerbe" ? "Pläne für gewerbliche Nutzer" : "Pläne für private Nutzer"}
          </p>
        </div>
        <div className={`grid gap-6 ${plans.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 max-w-2xl mx-auto"}`}>
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-card rounded-2xl border-2 p-8 flex flex-col ${plan.highlight ? "border-primary shadow-lg relative" : "border-border"}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />Empfohlen
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
              <Button variant={plan.highlight ? "default" : "outline"} className="w-full">{plan.cta}</Button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
