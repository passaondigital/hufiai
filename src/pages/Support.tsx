import AppLayout from "@/components/AppLayout";
import { Heart, Phone, ExternalLink, Shield, Users, HandHeart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const resources = [
  {
    icon: Heart,
    title: "Tierschutz & Notfälle",
    desc: "Bei akuten Tierschutzfällen oder Notlagen wende dich sofort an die zuständigen Behörden oder Tierschutzorganisationen.",
    links: [
      { label: "Deutscher Tierschutzbund", url: "https://www.tierschutzbund.de" },
      { label: "Tierschutz-Notfallnummer", url: "tel:+4930260430" },
    ],
  },
  {
    icon: HandHeart,
    title: "Finanzielle Unterstützung",
    desc: "Pferdebesitz bringt Kosten mit sich. Bei finanziellen Engpässen gibt es Anlaufstellen, die helfen können.",
    links: [
      { label: "Pferde in Not e.V.", url: "https://www.pferde-in-not.org" },
      { label: "Gnadenhof-Verzeichnis", url: "https://www.tierschutzbund.de/tiere-themen/tierheime" },
    ],
  },
  {
    icon: Phone,
    title: "Fachliche Beratung vor Ort",
    desc: "Hufi ersetzt keine fachliche Beratung. Bei gesundheitlichen Fragen wende dich immer an qualifizierte Experten.",
    links: [
      { label: "Tierärzte-Suche (Bundestierärztekammer)", url: "https://www.bundestieraerztekammer.de" },
      { label: "Hufbearbeiter finden (DHG)", url: "https://www.dhgev.de" },
    ],
  },
];

export default function Support() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Support & Ressourcen</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Hufi ist Teil einer Lösung – nicht nur ein Produkt. Hier findest du Hilfe für schwierige Situationen und wichtige Anlaufstellen.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {resources.map((r) => (
            <Card key={r.title} className="border-border hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <r.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base">{r.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                <div className="space-y-2">
                  {r.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Expert Verification Section */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Kollaboratives Expertenwissen</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Hufi soll ein kollektives Gehirn der Branche werden – kein Einzelkämpfer. 
                  Wir arbeiten daran, dass Fachleute (Tierärzte, Hufbearbeiter, Stallbetreiber) 
                  ihr Wissen einbringen und KI-generierte Inhalte verifizieren können.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    🔬 Expert Verification – Coming Soon
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                    Peer-Review für KI-Antworten
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                    Fachbeiträge von Profis
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          ⚖️ Hufi ist eine KI-Assistenz zur Unterstützung. Informationen ersetzen keine fachliche Beratung durch Tierärzte, Huf-Experten oder Juristen. Nutzung auf eigenes Risiko.
        </p>
      </div>
    </AppLayout>
  );
}
