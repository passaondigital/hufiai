import { BookOpen, Palette, MessageSquare, Brain, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: BookOpen,
    emoji: "📚",
    title: "Prompt Library + Generator",
    desc: "30 Prompts. Generator für eigene. Favorites speichern.",
    benefit: "Spare Zeit. Bessere Ergebnisse.",
    color: "group-hover:bg-blue-500/10",
  },
  {
    icon: Palette,
    emoji: "🎨",
    title: "Content Creator",
    desc: "Images, Graphics, Videos. Alles für Social Media.",
    benefit: "Erstelle professionellen Content in Minuten.",
    color: "group-hover:bg-purple-500/10",
  },
  {
    icon: MessageSquare,
    emoji: "💬",
    title: "Chat Intelligence",
    desc: "Copy, Edit, Split, Export. Deine Chats arbeiten für dich.",
    benefit: "Mehr Kontrolle. Bessere Ergebnisse.",
    color: "group-hover:bg-green-500/10",
  },
  {
    icon: Brain,
    emoji: "🧠",
    title: "Memory System",
    desc: "AI remembers. Du vergisst nichts. Smart Reminders inklusive.",
    benefit: "Dein persönlicher KI-Assistant.",
    color: "group-hover:bg-amber-500/10",
  },
  {
    icon: FileText,
    emoji: "📄",
    title: "Professional PDFs",
    desc: "Auto-generate. Fully branded. Ready-to-send Berichte.",
    benefit: "Professionelle Outputs in Sekunden.",
    color: "group-hover:bg-red-500/10",
  },
];

export default function MegaFeaturesSection() {
  return (
    <section id="features" className="max-w-6xl mx-auto py-20 px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Alles was du brauchst</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          5 Mega Features. Nichts was du nicht brauchst. Alles was dein Business voranbringt.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all group"
          >
            <div className={cn(
              "w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-colors",
              f.color
            )}>
              <f.icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-sm mb-2">{f.emoji} {f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{f.desc}</p>
            <p className="text-[10px] font-semibold text-primary">{f.benefit}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
