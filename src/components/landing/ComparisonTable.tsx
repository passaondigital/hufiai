import { X as XIcon, CheckCircle2, Target, Wrench, Gamepad2, Shield } from "lucide-react";

const rows = [
  { aspect: "Entwickler", generic: "Tech Company (keine Branchenexpertise)", hufiai: "Hufpfleger + Gr\u00fcnder (15 Jahre Erfahrung)" },
  { aspect: "F\u00fcr wen", generic: "Alle (Generic)", hufiai: "F\u00fcr Pferdeprofis (Spezialisiert)" },
  { aspect: "User Experience", generic: "Komplex, einsch\u00fcchternd", hufiai: "Einfach, Gamification, Spa\u00df" },
  { aspect: "Context", generic: "Kein Kontext f\u00fcr deine Welt", hufiai: "Versteht Hufpflege, Pferdebesitzer, Profis" },
  { aspect: "Learning Support", generic: "Keine", hufiai: "6 Learning Paths, Education Mode" },
  { aspect: "Community", generic: "Millionen anonyme User", hufiai: "Echte Pferdeprofis Gemeinschaft" },
  { aspect: "Ethics & Daten", generic: "Datenschutz unklar", hufiai: "DSGVO-konform, 100% Transparenz" },
  { aspect: "Built For", generic: "Making Money", hufiai: "Empowerment & Trust" },
];

const differentiators = [
  { emoji: "🎯", title: "Du fragst mich nicht \u2013 ich WEISS", desc: "Ich kenne deine Herausforderungen nicht von Theorie. Ich kenne sie von 15 Jahren Praxis." },
  { emoji: "🛠\ufe0f", title: "Gebaut f\u00fcr Handwerker, nicht gegen sie", desc: "Hufi macht dich besser bei dem, was du liebst \u2013 nicht versucht, dich zu ersetzen." },
  { emoji: "🎮", title: "Gamification von Anfang an", desc: "Lernen mit KI soll Spa\u00df machen. Level 1 zu 5 in 4 Wochen." },
  { emoji: "🛡\ufe0f", title: "DSGVO + Ethik sind nicht optional", desc: "Deine Daten geh\u00f6ren DIR. Deine Pferdefotos geh\u00f6ren DIR. Punkt." },
];

export default function ComparisonTable() {
  return (
    <section className="max-w-5xl mx-auto py-20 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Warum Hufi anders ist
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ich baue Hufi nicht als Tech-Gr\u00fcnder, der zuf\u00e4llig Pferde googelt. Ich baue Hufi als Hufpfleger, der KI revolutioniert hat.
        </p>
      </div>

      {/* Comparison cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-14">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex items-center gap-2 mb-5">
            <XIcon className="w-5 h-5 text-destructive" />
            <h3 className="font-bold text-lg">ChatGPT / Claude</h3>
            <span className="text-xs text-muted-foreground">(Generic)</span>
          </div>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.aspect} className="flex items-start gap-3 text-sm text-muted-foreground">
                <XIcon className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <span>{r.generic}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Hufi</h3>
            <span className="text-xs text-primary">(Spezialisiert)</span>
          </div>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.aspect} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{r.hufiai}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Differentiators */}
      <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {differentiators.map((d) => (
          <div
            key={d.title}
            className="flex items-start gap-3 bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-colors"
          >
            <span className="text-2xl shrink-0">{d.emoji}</span>
            <div>
              <p className="font-bold text-sm mb-1">{d.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
