import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Calendar, Briefcase, Lightbulb, Target } from "lucide-react";
import pascalPortrait from "@/assets/pascal-portrait.png";

const chapters = [
  {
    id: 0,
    emoji: "🐴",
    icon: Calendar,
    years: "2010–2021",
    tab: "Handwerk",
    title: "15 Jahre Handwerk & Leidenschaft",
    paragraphs: [
      "Ich bin Hufbearbeiter. Das ist nicht einfach ein Job \u2013 es ist meine Passion.",
      "Seit 2010 arbeite ich t\u00e4glich mit Pferden. Ich kenne jeden Huf, jeden Fall, jede Herausforderung der Branche. 15 Jahre. Tausende Pferde. Echte Handwerkskunst.",
      "Ich war gut. Sehr gut sogar. Aber 2021 passierte etwas, das alles \u00e4nderte.",
    ],
    highlight: "Januar 2021: Ein Arm-Bruch. Alle Kunden weg. Alles verloren.",
    highlightDetail:
      "Ich war bei meinem 9. Pferd des Tages. Der Sturz war dumm. Der Arm war gebrochen. Das Einkommen war weg. In einer Nacht verlor ich alle meine Kunden. Jahre aufgebaut. In Sekunden zerst\u00f6rt. Das war der tiefste Punkt meines Lebens.",
    quote:
      "Aber genau dann erkannte ich: So kann es nicht weitergehen. Ich brauchte ein System, das nicht von meinen zwei Armen abh\u00e4ngt.",
    color: "border-primary/30 bg-primary/5",
    dotColor: "bg-primary",
    highlightColor: "bg-destructive/10 border-destructive/20 text-destructive",
  },
  {
    id: 1,
    emoji: "🤖",
    icon: Lightbulb,
    years: "2021–2024",
    tab: "KI Discovery",
    title: "Ich entdeckte KI. Und ich war ver\u00e4ngstigt.",
    paragraphs: [
      "W\u00e4hrend ich genesen bin, entdeckte ich ChatGPT. Ich war ver\u00e4ngstigt.",
      "\u201EKI wird meine Branche zerst\u00f6ren.\u201C \u201EDas ist vorbei f\u00fcr Handwerker wie mich.\u201C \u201EWer braucht noch Hufpfleger, wenn KI alles kann?\u201C",
      "Das war meine erste Reaktion. Ehrlich. Genauso wie 80% der Menschen. Aber dann \u2013 nach ein paar Wochen \u2013 verstand ich es. KI war nicht mein Feind. KI war mein Werkzeug.",
    ],
    highlight:
      "Die Erleuchtung: KI macht Handwerker nicht \u00fcberfl\u00fcssig \u2013 es macht sie besser.",
    highlightDetail:
      "Ich baute das erste System: Kundenverwaltung. Automatische Rechnungen. Termine. Reports. Alles mit KI-Unterst\u00fctzung. Und ich erkannte: Es gibt keinen anderen Hufpfleger in Deutschland, der das hat.",
    quote:
      "Ich sah zwei Welten kollidieren: Das Handwerk (meine Welt) und die KI (die Zukunft). Und ich wusste: Ich muss die Br\u00fccke bauen.",
    color: "border-accent-foreground/20 bg-accent/50",
    dotColor: "bg-accent-foreground",
    highlightColor: "bg-primary/10 border-primary/20 text-primary",
  },
  {
    id: 2,
    emoji: "✨",
    icon: Briefcase,
    years: "2024–2026",
    tab: "Building",
    title: "Ich baute HufManager. Dann HufiAi.",
    paragraphs: [
      "2024: Ich startete HufManager. Eine App f\u00fcr Hufpfleger. Von einem Hufpfleger gebaut. Mit allem, was wir brauchen: Kunden-Management, Pferde-Datenbank, automatische Rechnungen, Scheduling.",
      "HufManager wurde mein Leben. Und mein Business. Aber ich sah ein neues Problem: Die Branche hat Angst vor KI. Sie verstehen es nicht. Sie trauen sich nicht.",
      "Wenn HufManager das Betriebssystem f\u00fcr Hufpfleger ist\u2026 dann muss es auch der KI-Coach sein. Der Lehrer. Der Freund, der dir die Angst nimmt.",
    ],
    highlight:
      "M\u00e4rz 2026: HufiAi entstand aus einer Frage: \u201EWie mache ich KI einfach? Sicher? Spa\u00df?\u201C",
    highlightDetail:
      "Eine KI-Plattform speziell f\u00fcr die Pferdewelt. F\u00fcr Menschen, die keine Angst haben wollen. Die es verstehen wollen. Die es nutzen wollen, um besser zu werden. Mit Gamification, Education Paths, Sicherheit und Transparenz.",
    quote:
      "Ich baute HufManager f\u00fcr mein Business. Aber ich baue HufiAi f\u00fcr die ganze Branche.",
    color: "border-primary/30 bg-primary/5",
    dotColor: "bg-primary",
    highlightColor: "bg-primary/10 border-primary/20 text-foreground",
  },
  {
    id: 3,
    emoji: "🎯",
    icon: Target,
    years: "Heute",
    tab: "Mission 2030",
    title: "Mission 2030: Die Zukunft der Pferdewelt",
    paragraphs: [
      "Heute \u2013 M\u00e4rz 2026 \u2013 bin ich bei einem Wendepunkt. HufManager ist erfolgreich. HufiAi startet jetzt. Aber das ist nur der Anfang.",
      "Meine Vision bis 2030 (mein 40. Geburtstag): #ZukunftHuf2030 \u2013 Die gr\u00f6\u00dfte, modernste, fairste Hufpflege-L\u00f6sung im DACH-Raum. Eine echte Akademie f\u00fcr Business & Handwerk.",
      "Nicht Geld. Nicht Fame. Sondern: Du schaffst es, dein Business zu skalieren, ohne dich selbst zu zerst\u00f6ren. Du vertraust KI. Du bist empowert, selbstbestimmt, frei. Das ist BeTheHorse.",
    ],
    highlight: null,
    highlightDetail: null,
    quote:
      "Ich bin nicht nur ein Gr\u00fcnder. Ich bin ein Hufpfleger, der KI liebt. Und das macht den Unterschied.",
    color: "border-primary/30 bg-primary/5",
    dotColor: "bg-primary",
    highlightColor: "",
    stats: [
      { label: "Jahre Equine Industry", value: "15+" },
      { label: "Pferde bearbeitet", value: "2.500+" },
      { label: "L\u00f6sungen deployed", value: "3" },
      { label: "Mission", value: "#ZukunftHuf2030" },
    ],
  },
];

export default function AboutPascalSection() {
  const [active, setActive] = useState(0);
  const chapter = chapters[active];

  return (
    <section id="about-pascal" className="max-w-6xl mx-auto py-20 px-6">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
        <img
          src={pascalPortrait}
          alt="Pascal Schmid – Gr\u00fcnder von HufiAi"
          className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover object-top border-4 border-primary/20 shadow-lg shrink-0"
        />
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            \u00dcber Pascal Schmid
          </h2>
          <p className="text-primary font-medium text-sm mb-1">Gr\u00fcnder von HufManager &amp; HufiAi</p>
          <p className="text-muted-foreground max-w-xl">
            Die Story eines Hufpflegers der KI liebte
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {chapters.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActive(i)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border",
              active === i
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <span>{c.emoji}</span>
            <span className="hidden sm:inline">{c.years}:</span>
            <span>{c.tab}</span>
          </button>
        ))}
      </div>

      {/* Active chapter */}
      <div
        key={chapter.id}
        className={cn(
          "max-w-3xl mx-auto rounded-2xl border p-6 md:p-10 transition-all animate-fade-in",
          chapter.color
        )}
      >
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{chapter.emoji}</span>
          <div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {chapter.years}
            </span>
            <h3 className="font-bold text-xl mt-1">{chapter.title}</h3>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {chapter.paragraphs.map((p, i) => (
            <p key={i} className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        {chapter.highlight && (
          <div
            className={cn(
              "rounded-xl border px-5 py-4 mb-6 font-semibold text-sm",
              chapter.highlightColor
            )}
          >
            <p className="font-bold mb-2">{chapter.highlight}</p>
            {chapter.highlightDetail && (
              <p className="font-normal text-muted-foreground text-sm leading-relaxed">
                {chapter.highlightDetail}
              </p>
            )}
          </div>
        )}

        {"stats" in chapter && chapter.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {chapter.stats.map((s) => (
              <div key={s.label} className="text-center bg-background/60 rounded-xl p-3 border border-border">
                <p className="text-lg font-bold text-primary">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <blockquote className="border-l-4 border-primary pl-4 italic text-sm md:text-base text-foreground">
          &bdquo;{chapter.quote}&ldquo;
        </blockquote>
      </div>
    </section>
  );
}
