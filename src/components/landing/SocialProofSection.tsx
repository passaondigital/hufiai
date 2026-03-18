import { Star } from "lucide-react";

const testimonials = [
  {
    avatar: "🧑‍🌾",
    name: "Thomas K.",
    badge: "⭐ Level 5 Master",
    quote: "Ich habe 50 KI-Chats gemacht und traue mich jetzt an alles ran!",
    metric: "Erreichte Level 5 Master!",
  },
  {
    avatar: "👩‍💼",
    name: "Sarah M.",
    badge: "📱 Content Creator",
    quote: "Mit HufiAi erstelle ich jetzt täglich Content für mein Business.",
    metric: "20 Social Media Posts generiert",
  },
  {
    avatar: "👨‍🔧",
    name: "Markus W.",
    badge: "⏱️ Zeitsparer",
    quote: "Die Memory-Funktion spart mir jeden Tag Zeit.",
    metric: "10 Stunden pro Woche gespart",
  },
  {
    avatar: "👩‍🏫",
    name: "Lisa B.",
    badge: "🤝 Mentorin",
    quote: "Ich helfe anderen, die Angst vor KI zu überwinden.",
    metric: "Mentorin für 3 Freunde",
  },
];

export default function SocialProofSection() {
  return (
    <section className="max-w-6xl mx-auto py-20 px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Was User mit HufiAi schaffen</h2>
        <p className="text-muted-foreground">Echte Ergebnisse. Echte Badges.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                {t.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">{t.name}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {t.badge}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground mb-2">{t.metric}</p>
                <p className="text-sm text-muted-foreground italic">„{t.quote}"</p>
                <div className="flex gap-0.5 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-primary fill-primary" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
