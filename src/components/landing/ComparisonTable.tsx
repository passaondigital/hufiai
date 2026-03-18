import { X as XIcon, CheckCircle2 } from "lucide-react";

const generic = [
  "Generic AI für alle",
  "Complex, einschüchternd",
  "Ohne Kontext für deine Welt",
  "Kaum Learning-Support",
];

const hufiai = [
  "Gebaut für Hufpfleger & Pferdebranche",
  "Einfach, Gamification, niedrige Einstiegshürde",
  "Versteht deine Pferde-Welt",
  "Gamification + Learning Paths = du wirst selbstbewusst",
];

export default function ComparisonTable() {
  return (
    <section className="max-w-5xl mx-auto py-20 px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Warum HufiAi anders ist als ChatGPT
        </h2>
        <p className="text-muted-foreground">Spezialisiert schlägt generisch. Immer.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Generic */}
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex items-center gap-2 mb-5">
            <XIcon className="w-5 h-5 text-destructive" />
            <h3 className="font-bold text-lg">ChatGPT / Claude</h3>
            <span className="text-xs text-muted-foreground">(Generic)</span>
          </div>
          <ul className="space-y-3">
            {generic.map((g) => (
              <li key={g} className="flex items-start gap-3 text-sm text-muted-foreground">
                <XIcon className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* HufiAi */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">HufiAi</h3>
            <span className="text-xs text-primary">(Spezialisiert)</span>
          </div>
          <ul className="space-y-3">
            {hufiai.map((h) => (
              <li key={h} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
