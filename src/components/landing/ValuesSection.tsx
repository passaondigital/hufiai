const values = [
  {
    emoji: "🔨",
    title: "Handwerk First",
    text: "Ich bin Hufpfleger. Das ist meine Identit\u00e4t. Alles, was ich baue, muss Handwerk respektieren und enhancen, nicht ersetzen.",
  },
  {
    emoji: "💯",
    title: "Honesty Over Hype",
    text: "Ich sage dir die Wahrheit. Hufi ist nicht perfekt. Es wird sich entwickeln. Aber ich baue es transparent und FAIR.",
  },
  {
    emoji: "🐴",
    title: "BeTheHorse Philosophie",
    text: "Freiheit. Selbstbestimmung. Im Moment leben. Das ist nicht nur eine Philosophie \u2013 das ist wie ich lebe und baue.",
  },
  {
    emoji: "🌱",
    title: "Long-Term Over Quick Money",
    text: "Mein Ziel ist nicht $. Mein Ziel ist Vertrauen. Wenn du Hufi in 5 Jahren liebst \u2013 DANN bin ich erfolgreich.",
  },
];

export default function ValuesSection() {
  return (
    <section className="max-w-5xl mx-auto py-16 px-6">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Was mir wichtig ist
        </h2>
        <p className="text-muted-foreground text-sm">Pascal&apos;s Mindset &ndash; Keine Marketing-Versprechen, echte Werte.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {values.map((v) => (
          <div
            key={v.title}
            className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{v.emoji}</span>
              <h3 className="font-bold text-sm">{v.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{v.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
