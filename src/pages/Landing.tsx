import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

import horseHero from "@/assets/horse-hero.png";
import hufiaiLogo from "@/assets/hufiai-logo.svg";

import LanguageToggle from "@/components/landing/LanguageToggle";
import TrustBar from "@/components/landing/TrustBar";
import AboutPascalSection from "@/components/landing/AboutPascalSection";
import ComparisonTable from "@/components/landing/ComparisonTable";
import CoreValuesSection from "@/components/landing/CoreValuesSection";
import GamificationJourney from "@/components/landing/GamificationJourney";
import SocialProofSection from "@/components/landing/SocialProofSection";
import FearSection from "@/components/landing/FearSection";
import MegaFeaturesSection from "@/components/landing/MegaFeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import EthicsSection from "@/components/landing/EthicsSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import CookieBanner from "@/components/CookieBanner";

export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <button onClick={() => scrollTo("about-pascal")} className="hover:text-foreground transition-colors">Über Pascal</button>
            <button onClick={() => navigate("/ethik")} className="hover:text-foreground transition-colors">Ethik</button>
            <button onClick={() => scrollTo("features")} className="hover:text-foreground transition-colors">Features</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-foreground transition-colors">Preise</button>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/auth")}>Login</Button>
            <Button size="sm" onClick={() => navigate("/auth")} className="text-xs md:text-sm">
              Kostenlos Starten <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg px-4 py-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {[
              { label: "Über Pascal", action: () => scrollTo("about-pascal") },
              { label: "Ethik", action: () => navigate("/ethik") },
              { label: "Features", action: () => scrollTo("features") },
              { label: "Preise", action: () => scrollTo("pricing") },
              { label: "Login", action: () => navigate("/auth") },
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

      {/* SECTION 1: Hero */}
      <section id="hero" className="relative max-w-7xl mx-auto pt-10 md:pt-16 pb-12 md:pb-20 px-4 md:px-6 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <div className="flex-1 text-center md:text-left z-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 md:mb-6 leading-tight">
            KI ist nicht dein Feind.{" "}
            <span className="text-gradient">KI ist dein Werkzeug.</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-xl mb-6 md:mb-10">
            Ohne Fach-Chinesisch. Ohne Angst. Nur echte Hilfe.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 justify-center md:justify-start">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-8">
              Kostenlos Starten <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo("about-pascal")} className="text-base px-8">
              Meine Story
            </Button>
            <Button size="lg" variant="ghost" onClick={() => navigate("/ethik")} className="text-base">
              Ethik & Sicherheit
            </Button>
          </div>
        </div>
        <div className="flex-1 flex justify-center md:justify-end">
          <img src={horseHero} alt="HufiAi – KI für die Pferdebranche" className="w-full max-w-md md:max-w-lg object-contain drop-shadow-2xl" />
        </div>
      </section>

      {/* Trust Bar */}
      <TrustBar />

      {/* SECTION 2: About Pascal */}
      <AboutPascalSection />

      {/* SECTION 3: Why Different */}
      <ComparisonTable />

      {/* SECTION 4: Core Values */}
      <CoreValuesSection />

      {/* SECTION 5: Gamification */}
      <GamificationJourney />

      {/* SECTION 6: Social Proof */}
      <SocialProofSection />

      {/* SECTION 7: Fear */}
      <FearSection />

      {/* SECTION 8: Mega Features */}
      <MegaFeaturesSection />

      {/* SECTION 9: Pricing */}
      <PricingSection />

      {/* SECTION 10: Ethics */}
      <EthicsSection />

      {/* SECTION 11: FAQ */}
      <FAQSection />

      {/* SECTION 12: Final CTA */}
      <FinalCTASection />

      <CookieBanner />

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={hufiaiLogo} alt="HufiAi" className="h-[4.5rem]" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              KI-Plattform für die Pferdebranche. Einfach. Sicher. Gamified.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
            <div>
              <h4 className="font-semibold text-sm mb-3">Über Pascal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <button onClick={() => navigate("/ueber-hufiai")} className="block hover:text-foreground transition-colors">Über HufiAi</button>
                <button onClick={() => navigate("/ethik")} className="block hover:text-foreground transition-colors">Ethik & Security</button>
                <button onClick={() => navigate("/support")} className="block hover:text-foreground transition-colors">Support</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Produkt</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <button onClick={() => scrollTo("features")} className="block hover:text-foreground transition-colors">Features</button>
                <button onClick={() => scrollTo("pricing")} className="block hover:text-foreground transition-colors">Preise</button>
                <button onClick={() => navigate("/manual")} className="block hover:text-foreground transition-colors">Handbuch</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Rechtliches</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <button onClick={() => navigate("/datenschutz")} className="block hover:text-foreground transition-colors">Datenschutz</button>
                <button onClick={() => navigate("/impressum")} className="block hover:text-foreground transition-colors">Impressum</button>
                <button onClick={() => navigate("/agb")} className="block hover:text-foreground transition-colors">AGB</button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground text-center">&copy; {new Date().getFullYear()} HufiAi. Alle Rechte vorbehalten.</p>
          <p className="text-xs text-muted-foreground/60 text-center">
            <a href="/admin" className="text-muted-foreground/60 hover:text-muted-foreground/60 no-underline cursor-text" tabIndex={-1} aria-hidden="true">KI</a>-generierte Inhalte k&ouml;nnen Fehler enthalten.
          </p>
        </div>
      </footer>
    </div>
  );
}
