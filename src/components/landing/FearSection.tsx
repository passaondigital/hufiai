import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fears = [
  "„Wird KI mich ersetzen?"",
  "„Ist das sicher?"",
  "„Das ist zu kompliziert für mich"",
  "„Ich verstehe die Technik nicht"",
];

const answers = [
  { icon: "⚡", text: "KI wird dich nicht ersetzen. Sie macht dich besser." },
  { icon: "🛡️", text: "Wir schützen deine Daten wie deine Pferde." },
  { icon: "😊", text: "Du brauchst KEIN Technik-Wissen." },
  { icon: "🎮", text: "Mit Gamification + Learning Paths wird es Spaß." },
];

export default function FearSection() {
  const navigate = useNavigate();

  return (
    <section className="bg-secondary text-secondary-foreground py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Deine Angst vor KI ist normal. Wir nehmen sie dir.
          </h2>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto">
            Ich verstehe deine Angst. Die meisten Menschen sind am Anfang verängstigt:
          </p>
        </div>

        {/* Fears */}
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {fears.map((f) => (
            <div
              key={f}
              className="flex items-center gap-3 bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-xl px-5 py-4"
            >
              <span className="text-destructive">✓</span>
              <span className="text-sm font-medium text-secondary-foreground/80">{f}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xl font-bold mb-8 text-secondary-foreground">
          ABER:
        </p>

        {/* Answers */}
        <div className="grid sm:grid-cols-2 gap-3 mb-12">
          {answers.map((a) => (
            <div
              key={a.text}
              className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-5 py-4"
            >
              <span className="text-xl">{a.icon}</span>
              <span className="text-sm font-medium text-secondary-foreground">{a.text}</span>
            </div>
          ))}
        </div>

        {/* Promise */}
        <div className="text-center bg-secondary-foreground/5 rounded-2xl border border-secondary-foreground/10 p-8">
          <p className="text-lg font-medium text-secondary-foreground/80 mb-2">
            Und die beste News? 👇
          </p>
          <p className="text-secondary-foreground font-bold mb-1">
            Du brauchst nur 30 Minuten pro Woche.
          </p>
          <p className="text-secondary-foreground/70 text-sm mb-1">
            In 4 Wochen wirst du sicher. In 8 Wochen wirst du ein Pro sein.
          </p>
          <p className="text-primary font-bold text-sm mb-6">Versprochen.</p>

          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-base px-8"
          >
            Ich will meine Angst überwinden <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
