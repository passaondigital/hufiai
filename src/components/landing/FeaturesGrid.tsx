import { MessageSquare, Video, Heart, Users, FileText, PenTool } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const features = [
  { icon: MessageSquare, titleKey: "features.chat.title", descKey: "features.chat.desc" },
  { icon: Video, titleKey: "features.video.title", descKey: "features.video.desc" },
  { icon: Heart, titleKey: "features.hufmanager.title", descKey: "features.hufmanager.desc" },
  { icon: Users, titleKey: "features.ecosystem.title", descKey: "features.ecosystem.desc" },
  { icon: FileText, titleKey: "features.knowledge.title", descKey: "features.knowledge.desc" },
  { icon: PenTool, titleKey: "features.content.title", descKey: "features.content.desc" },
] as const;

export default function FeaturesGrid() {
  const { t } = useI18n();
  return (
    <section id="features" className="max-w-6xl mx-auto py-20 px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">{t("features.title")}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t("features.subtitle")}</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((f) => (
          <div key={f.titleKey} className="bg-card rounded-2xl border border-border p-7 hover:shadow-lg hover:border-primary/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <f.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t(f.titleKey)}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
