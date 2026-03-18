import { useState } from "react";
import { Trophy, Star, Users, Share2, ChevronRight, Sparkles, Shield, Zap, BookOpen, Award } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const levels = [
  {
    level: 1,
    titleKey: "gamification.level1.title",
    descKey: "gamification.level1.desc",
    icon: BookOpen,
    color: "from-muted to-muted/60",
    accent: "bg-muted-foreground/20",
    badgeKey: "gamification.level1.badge",
    week: "1",
  },
  {
    level: 2,
    titleKey: "gamification.level2.title",
    descKey: "gamification.level2.desc",
    icon: Zap,
    color: "from-blue-500/20 to-blue-400/10",
    accent: "bg-blue-500/20",
    badgeKey: "gamification.level2.badge",
    week: "1–2",
  },
  {
    level: 3,
    titleKey: "gamification.level3.title",
    descKey: "gamification.level3.desc",
    icon: Shield,
    color: "from-primary/20 to-primary/5",
    accent: "bg-primary/20",
    badgeKey: "gamification.level3.badge",
    week: "2–3",
  },
  {
    level: 4,
    titleKey: "gamification.level4.title",
    descKey: "gamification.level4.desc",
    icon: Star,
    color: "from-amber-500/20 to-amber-400/10",
    accent: "bg-amber-500/20",
    badgeKey: "gamification.level4.badge",
    week: "3",
  },
  {
    level: 5,
    titleKey: "gamification.level5.title",
    descKey: "gamification.level5.desc",
    icon: Trophy,
    color: "from-primary/30 to-amber-500/20",
    accent: "bg-gradient-to-r from-primary/30 to-amber-500/30",
    badgeKey: "gamification.level5.badge",
    week: "4",
  },
];

export default function GamificationJourney() {
  const { t } = useI18n();
  const [activeLevel, setActiveLevel] = useState(0);

  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header with BEFORE → AFTER */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            {t("gamification.badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("gamification.title")}</h2>

          {/* BEFORE → AFTER cards */}
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">
            {/* BEFORE */}
            <div className="relative rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-left">
              <span className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-wider">
                {t("gamification.before")}
              </span>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed italic">
                "{t("gamification.before.quote")}"
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <span className="text-sm">😰</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{t("gamification.before.persona")}</p>
                  <p className="text-xs text-muted-foreground">{t("gamification.before.feeling")}</p>
                </div>
              </div>
            </div>

            {/* AFTER */}
            <div className="relative rounded-2xl border border-primary/30 bg-primary/5 p-6 text-left">
              <span className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                {t("gamification.after")}
              </span>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed italic">
                "{t("gamification.after.quote")}"
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm">🤩</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{t("gamification.after.persona")}</p>
                  <p className="text-xs text-muted-foreground">{t("gamification.after.feeling")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="relative max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between relative">
            {/* Connection line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 rounded-full" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-500"
              style={{ width: `${(activeLevel / (levels.length - 1)) * 100}%` }}
            />

            {levels.map((lvl, i) => (
              <button
                key={lvl.level}
                onClick={() => setActiveLevel(i)}
                className={cn(
                  "relative z-10 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300",
                  i <= activeLevel
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-110"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {i <= activeLevel ? <lvl.icon className="w-5 h-5" /> : lvl.level}
              </button>
            ))}
          </div>
        </div>

        {/* Active Level Detail */}
        <div className="max-w-3xl mx-auto">
          <div
            className={cn(
              "rounded-2xl border border-border p-8 bg-gradient-to-br transition-all duration-500",
              levels[activeLevel].color
            )}
          >
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0", levels[activeLevel].accent)}>
                {(() => {
                  const Icon = levels[activeLevel].icon;
                  return <Icon className="w-8 h-8 text-foreground" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    Level {levels[activeLevel].level}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("gamification.week")} {levels[activeLevel].week}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{t(levels[activeLevel].titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {t(levels[activeLevel].descKey)}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border text-xs font-medium">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  {t(levels[activeLevel].badgeKey)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom social proof strips */}
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("gamification.social.achievements")}</p>
              <p className="text-xs text-muted-foreground">{t("gamification.social.achievements.desc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("gamification.social.share")}</p>
              <p className="text-xs text-muted-foreground">{t("gamification.social.share.desc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("gamification.social.community")}</p>
              <p className="text-xs text-muted-foreground">{t("gamification.social.community.desc")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
