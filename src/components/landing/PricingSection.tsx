import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    emoji: "🆓",
    name: "Kostenlos",
    price: "0€",
    period: "Für immer",
    features: ["Unbegrenzte Chats", "Basic Prompts", "Learning Paths", "100% AI-powered"],
    cta: "Kostenlos Starten",
    highlighted: false,
  },
  {
    emoji: "💳",
    name: "Privat Plus",
    price: "€9,99",
    period: "/Monat",
    features: ["Alles aus Kostenlos +", "Custom Prompts", "Advanced Models", "Priority Support"],
    cta: "Upgrade",
    highlighted: false,
  },
  {
    emoji: "💼",
    name: "Gewerbe Pro",
    price: "€24,99",
    period: "/Monat",
    features: ["Alles aus Privat Plus +", "Content Creator (Full)", "Team Features", "Analytics"],
    cta: "For Business",
    highlighted: true,
  },
  {
    emoji: "👥",
    name: "Team",
    price: "€49+",
    period: "/Monat",
    features: ["Alles aus Gewerbe Pro +", "3–10 Team Members", "Admin Controls", "Dedicated Support"],
    cta: "Talk to Us",
    highlighted: false,
  },
];

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="max-w-6xl mx-auto py-20 px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Einfache Preise. Massiver Wert.</h2>
        <p className="text-muted-foreground">Starte kostenlos. Upgrade, wenn du bereit bist.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {plans.map((p) => (
          <div
            key={p.name}
            className={cn(
              "rounded-2xl border p-6 flex flex-col transition-all hover:shadow-lg",
              p.highlighted
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-card"
            )}
          >
            <div className="mb-4">
              <span className="text-2xl">{p.emoji}</span>
              <h3 className="font-bold text-lg mt-2">{p.name}</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant={p.highlighted ? "default" : "outline"}
              className="w-full"
              onClick={() => navigate(p.name === "Team" ? "/support" : "/auth")}
            >
              {p.cta} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ))}
      </div>

      {/* Guarantee */}
      <div className="flex items-center justify-center gap-3 bg-success/10 border border-success/20 rounded-2xl p-5 max-w-lg mx-auto">
        <Shield className="w-8 h-8 text-success shrink-0" />
        <div>
          <p className="font-bold text-sm">30-Tage Geld-zurück-Garantie</p>
          <p className="text-xs text-muted-foreground">
            Wenn Hufi nicht dein Ding ist, 100% Rückerstattung.
          </p>
        </div>
      </div>
    </section>
  );
}
