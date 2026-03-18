import { useState } from "react";
import { cn } from "@/lib/utils";

const timeline = [
  {
    emoji: "🐴",
    years: "2010–2021",
    title: "15 Jahre in der Pferdewelt",
    subtitle: "Meine Leidenschaft: Pferde. Mein Beruf: Hufpflege.",
    story: "Ein Arm-Bruch 2021 → alle Kunden weg → Neustart.",
    quote: "Ich musste neu anfangen. Aber dieses Mal smart.",
    color: "border-primary/30 bg-primary/5",
    dotColor: "bg-primary",
  },
  {
    emoji: "🤖",
    years: "2021–2024",
    title: "Ich lernte KI lieben",
    subtitle: "KI ist nicht mein Feind. KI ist mein Werkzeug.",
    story: "ChatGPT, Claude, die Angst der Branche – und die Chance.",
    quote: "Ich sah die Chance: KI für Hufpfleger, von einem Hufpfleger.",
    color: "border-accent-foreground/20 bg-accent/50",
    dotColor: "bg-accent-foreground",
  },
  {
    emoji: "✨",
    years: "2024–2026",
    title: "HufiAi entstand aus einer Vision",
    subtitle: "Ich will dir die Angst nehmen.",
    story: "Warum HufiAi anders ist als jede andere KI-Plattform.",
    quote: "KI soll Spaß machen. Einfach. Nützlich. Sicher.",
    color: "border-primary/30 bg-primary/5",
    dotColor: "bg-primary",
  },
  {
    emoji: "💚",
    years: "Heute",
    title: "Aus der Pferdewelt für die Pferdewelt",
    subtitle: "Made with ❤️ für Hufpfleger, Pferdebesitzer, Profis.",
    story: "Ich kenne deine Herausforderungen.",
    quote: "Ich baue für dich.",
    color: "border-success/30 bg-success/5",
    dotColor: "bg-success",
  },
];

export default function AboutPascalSection() {
  const [active, setActive] = useState(0);

  return (
    <section id="about-pascal" className="max-w-6xl mx-auto py-20 px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Über Pascal Schmid – Gründer von HufiAi
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Vom Hufpfleger zum KI-Gründer. Eine ehrliche Geschichte.
        </p>
      </div>

      {/* Desktop timeline */}
      <div className="hidden md:block relative max-w-4xl mx-auto">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-8">
          {timeline.map((item, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative w-full text-left pl-20 pr-6 py-6 rounded-2xl border transition-all duration-300",
                active === i ? item.color : "border-transparent hover:bg-muted/50"
              )}
            >
              {/* Dot */}
              <div
                className={cn(
                  "absolute left-[22px] top-8 w-5 h-5 rounded-full border-4 border-background transition-all",
                  active === i ? item.dotColor : "bg-muted-foreground/30"
                )}
              />

              <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0">{item.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {item.years}
                    </span>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{item.subtitle}</p>
                  {active === i && (
                    <div className="mt-3 space-y-2 animate-fade-in">
                      <p className="text-sm text-muted-foreground">{item.story}</p>
                      <p className="text-sm font-medium italic text-foreground">
                        „{item.quote}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {timeline.map((item, i) => (
          <div
            key={i}
            className={cn("rounded-2xl border p-5", item.color)}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {item.years}
              </span>
            </div>
            <h3 className="font-bold mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{item.subtitle}</p>
            <p className="text-sm text-muted-foreground">{item.story}</p>
            <p className="text-sm font-medium italic text-foreground mt-2">
              „{item.quote}"
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
