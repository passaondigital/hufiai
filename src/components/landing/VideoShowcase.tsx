import { Bot, LayoutList, Download, Layers } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const items = [
  { icon: Bot, titleKey: "videoShowcase.autopilot", descKey: "videoShowcase.autopilot.desc" },
  { icon: LayoutList, titleKey: "videoShowcase.storyboard", descKey: "videoShowcase.storyboard.desc" },
  { icon: Download, titleKey: "videoShowcase.batch", descKey: "videoShowcase.batch.desc" },
  { icon: Layers, titleKey: "videoShowcase.models", descKey: "videoShowcase.models.desc" },
] as const;

export default function VideoShowcase() {
  const { t } = useI18n();
  return (
    <section className="bg-secondary text-secondary-foreground py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">{t("videoShowcase.title")}</h2>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto">{t("videoShowcase.subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.titleKey} className="bg-secondary-foreground/5 rounded-2xl border border-secondary-foreground/10 p-6 hover:bg-secondary-foreground/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t(item.titleKey)}</h3>
              <p className="text-sm text-secondary-foreground/70 leading-relaxed">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
