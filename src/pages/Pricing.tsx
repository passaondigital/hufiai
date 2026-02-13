import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Users, Crown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const plans = [
  {
    name: "Free",
    price: "0€",
    period: "",
    features: ["Basis-Chat (5/Tag)", "1 Pferdeprofil", "3 Datei-Analysen/Monat", "DSGVO-konform", "EU-Server"],
    cta: "Kostenlos starten",
    planKey: "free",
  },
  {
    name: "Privat Plus",
    price: "9,99€",
    period: "/Monat",
    features: [
      "Unbegrenzte Chats",
      "Unbegrenzte Pferdeprofile",
      "PDF-Export",
      "Wissensdatenbank",
      "Hufgesundheits-Tracking",
      "Prioritäts-Support",
    ],
    cta: "Jetzt upgraden",
    planKey: "privat_plus",
  },
  {
    name: "Gewerbe Pro",
    price: "24,99€",
    period: "/Monat",
    features: [
      "Alles aus Privat Plus",
      "Projekte & Fallverwaltung",
      "PDF-Export mit Firmenlogo",
      "Firmenprofil & Branding",
      "10 Social Media Posts/Monat",
      "CRM-Grundfunktionen",
    ],
    cta: "Jetzt upgraden",
    highlight: true,
    planKey: "gewerbe_pro",
  },
  {
    name: "Gewerbe Team",
    price: "49,00€",
    period: "/Monat",
    features: [
      "Alles aus Gewerbe Pro",
      "5 Team-Sitze",
      "Shared Workspace",
      "Team-Verwaltung",
      "Unbegrenzte Social Media Posts",
      "Dedizierter Support",
    ],
    cta: "Team starten",
    planKey: "gewerbe_team",
  },
];

export default function Pricing() {
  const [socialAddon, setSocialAddon] = useState(false);

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto overflow-y-auto h-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Preise</h1>
          <p className="text-muted-foreground">
            Starte kostenlos – upgrade, wenn du mehr brauchst.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-card rounded-2xl border-2 p-6 flex flex-col ${
                plan.highlight
                  ? "border-primary shadow-lg relative"
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
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="text-2xl font-bold mt-2 mb-1">
                {plan.price}
                {plan.period && <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>}
              </p>
              <ul className="space-y-2.5 flex-1 mb-6 mt-4">
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

        {/* Social Media Add-on */}
        <div className="max-w-md mx-auto mt-10 bg-card rounded-2xl border-2 border-accent p-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" />Add-on
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Social Media Unlimited</h3>
              <p className="text-sm text-muted-foreground mt-1">Unbegrenzte Posts, Content-Kalender, Multi-Plattform</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">+9,99€<span className="text-sm font-normal text-muted-foreground">/Monat</span></p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 p-3 rounded-xl bg-muted/50">
            <span className="text-sm font-medium">Add-on aktivieren</span>
            <Switch checked={socialAddon} onCheckedChange={setSocialAddon} />
          </div>
        </div>

        {/* Founder Flow CTA */}
        <div className="max-w-md mx-auto mt-8 text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <Crown className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1">HufiAi Founder Flow</h3>
            <p className="text-sm text-muted-foreground mb-4">
              30 Tage Gewerbe Pro kostenlos testen. Inklusive KI-gestütztem Business-Coach.
            </p>
            <Button className="w-full">
              Founder Flow starten – kostenlos
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
