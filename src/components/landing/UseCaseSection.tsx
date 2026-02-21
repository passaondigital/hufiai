import { useState } from "react";
import { Heart, Briefcase } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function UseCaseSection() {
  const [mode, setMode] = useState<"privat" | "gewerbe">("privat");
  const { t } = useI18n();

  const useCases = {
    privat: [
      { q: t("usecases.p1.q"), a: t("usecases.p1.a") },
      { q: t("usecases.p2.q"), a: t("usecases.p2.a") },
      { q: t("usecases.p3.q"), a: t("usecases.p3.a") },
    ],
    gewerbe: [
      { q: t("usecases.b1.q"), a: t("usecases.b1.a") },
      { q: t("usecases.b2.q"), a: t("usecases.b2.a") },
      { q: t("usecases.b3.q"), a: t("usecases.b3.a") },
    ],
  };

  return (
    <section className="max-w-5xl mx-auto py-20 px-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">{t("usecases.title")}</h2>
        <p className="text-muted-foreground mb-8">{t("usecases.subtitle")}</p>
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setMode("privat")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "privat" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Heart className="w-4 h-4" /> {t("usecases.private")}
          </button>
          <button
            onClick={() => setMode("gewerbe")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "gewerbe" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Briefcase className="w-4 h-4" /> {t("usecases.business")}
          </button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {useCases[mode].map((uc) => (
          <div key={uc.q} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all">
            <p className="font-semibold text-sm mb-3 text-primary">„{uc.q}"</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{uc.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
