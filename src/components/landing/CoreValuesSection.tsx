import { Shield, GraduationCap, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";

const pillars = [
  {
    icon: Shield,
    emoji: "🛡\ufe0f",
    title: "Datenschutz & Pferdeschutz",
    subtitle: "Ich sch\u00fctze deine Daten wie meine eigenen Pferde.",
    intro: "Ein Pferd vertraut dir mit seinem K\u00f6rper. Ein Pferdebesitzer vertraut dir mit seinem liebsten Tier. Darum nehme ich Datenschutz EXTREM ernst.",
    points: [
      "DSGVO-konform (nicht optional, nicht \u201Esoon\u201C, JETZT)",
      "Deine Pferdefotos geh\u00f6ren DIR (nicht mir, nicht OpenAI)",
      "Wir verkaufen deine Daten NICHT (nie, nicht sp\u00e4ter, nie)",
      "Keine AI-Training ohne deine Erlaubnis (expliziter Opt-in)",
      "Du kannst jederzeit l\u00f6schen (alles, komplett, 1 Click)",
      "Transparent. Immer. Keine Geheimnisse.",
    ],
    links: [
      { label: "Datenschutzerkl\u00e4rung", path: "/datenschutz" },
      { label: "Ethik & Sicherheit", path: "/ethik" },
    ],
  },
  {
    icon: GraduationCap,
    emoji: "🎓",
    title: "Education First",
    subtitle: "Ich baue nicht f\u00fcr Experten. Ich baue f\u00fcr Menschen wie dich.",
    intro: "KI ist komplex. Aber es muss nicht einsch\u00fcchternd sein. Darum: Education First.",
    points: [
      "KI verstehen ohne Fach-Chinesisch",
      "Gamification macht es Spa\u00df (Levels, Badges, Achievements)",
      "Von Level 1 (absoluter Anf\u00e4nger) zu Level 5 (Master)",
      "In nur 4 Wochen (70% unserer User schaffen das)",
      "6 kostenlose Learning Paths",
      "Contextual Help \u00fcberall (Education Mode mit Tooltips)",
      "Dein Tempo \u2013 du entscheidest, nicht ich",
    ],
    links: [],
  },
  {
    icon: Rocket,
    emoji: "🚀",
    title: "Real Tools for Real Work",
    subtitle: "Gebaut f\u00fcr Solo-Entrepreneurs & Handwerker.",
    intro: "HufiAi ist nicht \u201Enoch ein Chat-Interface\u201C. Es ist eine komplette Produktivit\u00e4ts-Suite.",
    points: [
      "30 Prompts + Generator (f\u00fcr deine Aufgaben)",
      "Content Creator (Images, Graphics, Videos)",
      "Chat Intelligence (Copy, Edit, Split, Export)",
      "Master Memory + Reminders (AI remembers)",
      "Professional PDFs (Auto-generated, fully branded)",
    ],
    links: [],
  },
];

export default function CoreValuesSection() {
  const navigate = useNavigate();

  return (
    <section className="max-w-6xl mx-auto py-20 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Die drei S\u00e4ulen von HufiAi
        </h2>
        <p className="text-muted-foreground">Von Pascal & f\u00fcr dich.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {pillars.map((p) => (
          <div
            key={p.title}
            className="bg-card rounded-2xl border border-border p-7 hover:shadow-lg hover:border-primary/30 transition-all group flex flex-col"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <p.icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-1">{p.emoji} {p.title}</h3>
            <p className="text-xs text-primary font-medium mb-3">{p.subtitle}</p>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{p.intro}</p>
            <ul className="space-y-2 mb-4 flex-1">
              {p.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
            {p.links.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                {p.links.map((l) => (
                  <button
                    key={l.path}
                    onClick={() => navigate(l.path)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {l.label} →
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
