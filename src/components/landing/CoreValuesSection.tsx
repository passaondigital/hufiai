import { Shield, GraduationCap, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";

const pillars = [
  {
    icon: Shield,
    emoji: "🛡️",
    title: "Datenschutz & Pferdeschutz",
    points: [
      "DSGVO-konform, 100% sicher",
      "Deine Pferdefotos gehören DIR",
      "Wir verkaufen deine Daten nie",
    ],
    links: [
      { label: "Datenschutzerklärung", path: "/datenschutz" },
      { label: "Ethik & Sicherheit", path: "/ethik" },
    ],
  },
  {
    icon: GraduationCap,
    emoji: "🎓",
    title: "Education First",
    points: [
      "KI verstehen, keine Angst haben",
      "Gamification macht es Spaß",
      "Jeder kann Level 1 erreichen",
      "From Newbie to Master in 4 Wochen",
    ],
    links: [],
  },
  {
    icon: Rocket,
    emoji: "🚀",
    title: "Real Tools for Real Work",
    points: [
      "Nicht nur Chat. Echte Produktivität.",
      "Prompts, Content, Memory, PDFs",
      "Alles was du brauchst. Nichts was du nicht brauchst.",
    ],
    links: [],
  },
];

export default function CoreValuesSection() {
  const navigate = useNavigate();

  return (
    <section className="max-w-6xl mx-auto py-20 px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Die drei Säulen von HufiAi</h2>
        <p className="text-muted-foreground">Worauf du dich verlassen kannst.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {pillars.map((p) => (
          <div
            key={p.title}
            className="bg-card rounded-2xl border border-border p-8 hover:shadow-lg hover:border-primary/30 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
              <p.icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-4">{p.emoji} {p.title}</h3>
            <ul className="space-y-2.5 mb-4">
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
