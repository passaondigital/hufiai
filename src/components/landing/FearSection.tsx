import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fears = [
  {
    q: "\u201EWird KI mich ersetzen?\u201C",
    a: "Nein. KI wird den ersetzen, der KI nicht nutzt. Du nutzt sie \u2013 also wirst du besser. Nicht obsolet.",
  },
  {
    q: "\u201EIst das sicher? Meine Daten?\u201C",
    a: "Ja. 100% sicher. Ich kenne DSGVO. Ich lebe DSGVO. Deine Pferdefotos sind sicherer bei mir als \u00fcberall sonst.",
  },
  {
    q: "\u201EDas ist zu kompliziert f\u00fcr mich.\u201C",
    a: "Das dachte ich auch. Dann baute ich HufManager. Dann HufiAi. Jetzt verstehe ich es. Und du wirst es auch verstehen.",
  },
  {
    q: "\u201EIch verstehe die Technik nicht.\u201C",
    a: "Du musst nicht. Du musst nicht verstehen, wie ein Auto funktioniert, um es zu fahren. Genauso mit KI.",
  },
  {
    q: "\u201EDas kostet wahrscheinlich viel.\u201C",
    a: "Nein. HufiAi kostet nix. Free forever. Upgrades optional. Du kannst dich jederzeit l\u00f6schen.",
  },
];

const timeline = [
  { week: "Woche 1\u20132", text: "Erster Chat, Level-System checken, eine Learning Path lesen." },
  { week: "Woche 3\u20134", text: "Erster Custom Prompt, Experimente, Achievements freischalten." },
  { week: "Woche 5\u20136", text: "Content generieren (Images, Videos), Memory System nutzen." },
  { week: "Woche 7\u20138", text: "Level 5 Master. Einem Freund helfen. Erfolg teilen." },
];

export default function FearSection() {
  const navigate = useNavigate();

  return (
    <section className="bg-secondary text-secondary-foreground py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Deine Angst vor KI ist normal. Ich hatte sie auch.
          </h2>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto">
            Ich war nicht immer KI-Fan. Ich war ver\u00e4ngstigt. Genauso wie du wahrscheinlich. Und dann verstand ich es.
          </p>
        </div>

        {/* Fears & Answers */}
        <div className="space-y-3 mb-12">
          {fears.map((f) => (
            <div
              key={f.q}
              className="rounded-xl border border-secondary-foreground/10 bg-secondary-foreground/5 p-5"
            >
              <p className="text-sm font-bold text-secondary-foreground/90 mb-1.5 flex items-center gap-2">
                <span className="text-destructive">✗</span> {f.q}
              </p>
              <p className="text-sm text-secondary-foreground/70 pl-6">
                <span className="text-primary font-medium">→</span> {f.a}
              </p>
            </div>
          ))}
        </div>

        {/* My journey proof */}
        <div className="bg-secondary-foreground/5 rounded-2xl border border-secondary-foreground/10 p-6 md:p-8 mb-10">
          <h3 className="font-bold text-lg mb-4 text-center text-secondary-foreground">
            Mein Beweis: Wenn ich es kann, kannst DU es auch.
          </h3>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              "15 Jahre Handwerk gelebt",
              "KI-Angst gehabt (wie du)",
              "KI gelernt",
              "HufManager gebaut",
              "HufiAi gebaut (f\u00fcr dich)",
            ].map((item) => (
              <span
                key={item}
                className="text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5"
              >
                ✅ {item}
              </span>
            ))}
          </div>

          {/* Timeline promise */}
          <div className="grid sm:grid-cols-2 gap-3">
            {timeline.map((t) => (
              <div
                key={t.week}
                className="flex items-start gap-3 bg-secondary-foreground/5 rounded-lg p-3"
              >
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">
                  {t.week}
                </span>
                <span className="text-xs text-secondary-foreground/70">{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promise */}
        <div className="text-center">
          <blockquote className="text-sm md:text-base italic text-secondary-foreground/80 max-w-xl mx-auto mb-6 leading-relaxed">
            &bdquo;Meine Mission ist nicht, dir KI aufzuzwingen. Meine Mission ist, dir die Angst zu nehmen. Und dir zu zeigen: KI ist nicht dein Feind. KI ist dein Werkzeug.&ldquo;
          </blockquote>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-base px-8"
          >
            Ich will meine Angst \u00fcberwinden <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
