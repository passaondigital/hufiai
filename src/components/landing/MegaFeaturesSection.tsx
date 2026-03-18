import { BookOpen, Palette, MessageSquare, Brain, FileText } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    emoji: "📚",
    title: "Prompt Library + Generator",
    desc: "30 Prompts. Generator für eigene. Favorites speichern.",
  },
  {
    icon: Palette,
    emoji: "🎨",
    title: "Content Creator",
    desc: "Images, Graphics, Videos. Für Social Media.",
  },
  {
    icon: MessageSquare,
    emoji: "💬",
    title: "Chat Intelligence",
    desc: "Copy, Edit, Split, Export. Alles easy.",
  },
  {
    icon: Brain,
    emoji: "🧠",
    title: "Memory System",
    desc: "AI remembers. Du vergisst nichts mehr.",
  },
  {
    icon: FileText,
    emoji: "📄",
    title: "Professional PDFs",
    desc: "Auto-generate. Fully branded. Ready-to-send.",
  },
];

export default function MegaFeaturesSection() {
  return (
    <section id="features" className="max-w-6xl mx-auto py-20 px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">5 Mega Features</h2>
        <p className="text-muted-foreground">Alles was du brauchst. Nichts was du nicht brauchst.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <f.icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-sm mb-2">{f.emoji} {f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
