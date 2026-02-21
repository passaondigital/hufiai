import { ShieldCheck, Lock, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const cards = [
  { icon: ShieldCheck, titleKey: "why.trust.title", descKey: "why.trust.desc" },
  { icon: Lock, titleKey: "why.data.title", descKey: "why.data.desc" },
  { icon: Zap, titleKey: "why.easy.title", descKey: "why.easy.desc" },
] as const;

export default function WhySection() {
  const { t } = useI18n();
  return (
    <section className="max-w-6xl mx-auto py-20 px-6">
      <div className="text-center mb-14">
        <h2 className="text-3xl font-bold mb-4">{t("why.title")}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t("why.subtitle")}</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {cards.map((c) => (
          <div key={c.titleKey} className="bg-card rounded-2xl border border-border p-8 text-center hover:shadow-lg hover:border-primary/30 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <c.icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-3">{t(c.titleKey)}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t(c.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
