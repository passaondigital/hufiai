import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

import horseHero from "@/assets/horse-hero.png";
import hufiaiLogo from "@/assets/hufiai-logo.svg";

import LanguageToggle from "@/components/landing/LanguageToggle";
import TrustBar from "@/components/landing/TrustBar";
import WhySection from "@/components/landing/WhySection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import VideoShowcase from "@/components/landing/VideoShowcase";
import UseCaseSection from "@/components/landing/UseCaseSection";
import ComparisonTable from "@/components/landing/ComparisonTable";
import TrustFooter from "@/components/landing/TrustFooter";
import GamificationJourney from "@/components/landing/GamificationJourney";
import CookieBanner from "@/components/CookieBanner";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
}

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, image_url, category, published_at, created_at")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(6)
      .then(({ data }) => { if (data) setPosts(data as BlogPost[]); });
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo("hero")}>
            <img src={hufiaiLogo} alt="HufiAi" className="h-10 md:h-[4.5rem]" />
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={() => navigate("/ueber-hufiai")} className="hover:text-foreground transition-colors">{t("nav.about")}</button>
            <button onClick={() => navigate("/ethik")} className="hover:text-foreground transition-colors">{t("nav.ethics")}</button>
            <button onClick={() => scrollTo("features")} className="hover:text-foreground transition-colors">{t("nav.features")}</button>
            <button onClick={() => navigate("/experten")} className="hover:text-foreground transition-colors">{t("nav.experts")}</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-foreground transition-colors">{t("nav.pricing")}</button>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/auth")}>{t("nav.login")}</Button>
            <Button size="sm" onClick={() => navigate("/auth")} className="text-xs md:text-sm">
              {t("nav.cta")} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg px-4 py-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {[
              { label: t("nav.about"), action: () => navigate("/ueber-hufiai") },
              { label: t("nav.ethics"), action: () => navigate("/ethik") },
              { label: t("nav.features"), action: () => scrollTo("features") },
              { label: t("nav.experts"), action: () => navigate("/experten") },
              { label: t("nav.pricing"), action: () => scrollTo("pricing") },
              { label: t("nav.login"), action: () => navigate("/auth") },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { item.action(); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="relative max-w-7xl mx-auto pt-10 md:pt-16 pb-12 md:pb-20 px-4 md:px-6 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <div className="flex-1 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            {t("hero.badge")}
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 md:mb-6 leading-tight">
            {t("hero.title1")}{" "}
            <span className="text-gradient">{t("hero.title2")}</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-xl mb-6 md:mb-10">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 justify-center md:justify-start">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-8">
              {t("hero.cta")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo("features")} className="text-base px-8">
              {t("hero.cta2")}
            </Button>
          </div>
        </div>
        <div className="flex-1 flex justify-center md:justify-end">
          <img src={horseHero} alt="HufiAi – KI für die Pferdebranche" className="w-full max-w-md md:max-w-lg object-contain drop-shadow-2xl" />
        </div>
      </section>

      {/* Trust Bar */}
      <TrustBar />

      {/* Why HufiAi */}
      <WhySection />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Video Engine Showcase */}
      <VideoShowcase />

      {/* Use Cases */}
      <UseCaseSection />

      {/* Blog */}
      {posts.length > 0 && (
        <section id="blog" className="max-w-6xl mx-auto py-20 px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("blog.title")}</h2>
            <p className="text-muted-foreground">{t("blog.subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow group">
                {post.image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-6">
                  {post.category && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">{post.category}</span>
                  )}
                  <h3 className="font-semibold text-lg mt-3 mb-2">{post.title}</h3>
                  {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>}
                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date(post.published_at || post.created_at).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Comparison */}
      <ComparisonTable />

      {/* Expert Search CTA */}
      <section className="max-w-4xl mx-auto py-16 px-6 text-center">
        <div className="bg-card rounded-2xl border border-border p-10 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t("expert.title")}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{t("expert.desc")}</p>
          <Button size="lg" onClick={() => navigate("/experten")} className="mt-2">
            {t("expert.cta")} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Trust & AI for Good */}
      <TrustFooter />

      <CookieBanner />

      {/* Stats */}
      <section className="bg-muted py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 text-center">
          {[
            { value: "100%", label: t("stats.gdpr") },
            { value: "24/7", label: t("stats.available") },
            { value: "Multi-LLM", label: t("stats.models") },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={hufiaiLogo} alt="HufiAi" className="h-[4.5rem]" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">{t("footer.desc")}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
            <div>
              <h4 className="font-semibold text-sm mb-3">{t("footer.product")}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <button onClick={() => scrollTo("features")} className="block hover:text-foreground transition-colors">{t("footer.features")}</button>
                <button onClick={() => navigate("/experten")} className="block hover:text-foreground transition-colors">{t("footer.findExperts")}</button>
                <button onClick={() => navigate("/manual")} className="block hover:text-foreground transition-colors">{t("footer.manual")}</button>
                <button onClick={() => navigate("/pricing")} className="block hover:text-foreground transition-colors">{t("footer.pricing")}</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">{t("footer.company")}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <button onClick={() => navigate("/ueber-hufiai")} className="block hover:text-foreground transition-colors">{t("footer.about")}</button>
                <button onClick={() => navigate("/ethik")} className="block hover:text-foreground transition-colors">{t("footer.ethics")}</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">{t("footer.legal")}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <button onClick={() => navigate("/impressum")} className="block hover:text-foreground transition-colors">{t("footer.imprint")}</button>
                <button onClick={() => navigate("/agb")} className="block hover:text-foreground transition-colors">{t("footer.terms")}</button>
                <button onClick={() => navigate("/datenschutz")} className="block hover:text-foreground transition-colors">{t("footer.privacy")}</button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground text-center">© {new Date().getFullYear()} HufiAi. {t("footer.rights")}</p>
          <p className="text-xs text-muted-foreground/60 text-center"><a href="/admin" className="text-muted-foreground/60 hover:text-muted-foreground/60 no-underline cursor-text" tabIndex={-1} aria-hidden="true">KI</a> {t("footer.aiDisclaimer")}</p>
        </div>
      </footer>
    </div>
  );
}
