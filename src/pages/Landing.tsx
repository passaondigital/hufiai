import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import CookieBanner from "@/components/CookieBanner";
import { Button } from "@/components/ui/button";
import { Shield, MessageSquare, Cpu, ArrowRight, Users, FileText, Building2, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import horseHero from "@/assets/horse-hero.png";
import hufiaiLogo from "@/assets/hufiai-logo.svg";
import ComparisonTable from "@/components/landing/ComparisonTable";
import UseCaseSection from "@/components/landing/UseCaseSection";
import TrustFooter from "@/components/landing/TrustFooter";

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
  const [posts, setPosts] = useState<BlogPost[]>([]);

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
        <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo("hero")}>
            <img src={hufiaiLogo} alt="HufiAi" className="h-8" />
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={() => navigate("/ueber-hufiai")} className="hover:text-foreground transition-colors">Über HufiAi</button>
            <button onClick={() => navigate("/ethik")} className="hover:text-foreground transition-colors">Ethik</button>
            <button onClick={() => scrollTo("features")} className="hover:text-foreground transition-colors">Funktionen</button>
            <button onClick={() => navigate("/experten")} className="hover:text-foreground transition-colors">Experten</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-foreground transition-colors">Preise</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>Anmelden</Button>
            <Button onClick={() => navigate("/auth")}>
              Kostenlos starten <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" className="relative max-w-7xl mx-auto pt-16 pb-20 px-6 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            KI für die Pferdebranche
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Dein KI-Assistent für die{" "}
            <span className="text-gradient">Pferdebranche</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mb-10">
            HufiAi unterstützt Pferdebesitzer, Hufschmiede, Tierärzte und Betriebe mit modernster KI – DSGVO-konform und speziell für die Equine-Branche entwickelt.
          </p>
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-8">
              Jetzt starten <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo("features")} className="text-base px-8">
              Mehr erfahren
            </Button>
          </div>
        </div>
        <div className="flex-1 flex justify-center md:justify-end">
          <img src={horseHero} alt="HufiAi – KI für die Pferdebranche" className="w-full max-w-md md:max-w-lg object-contain drop-shadow-2xl" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto py-20 px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Alles was du brauchst</h2>
          <p className="text-muted-foreground">Für Privatpersonen und Gewerbetreibende gleichermaßen.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: MessageSquare, title: "Intelligenter Chat", desc: "Stelle Fragen zu Hufpflege, Fütterung, Stallbau und mehr. Die KI lernt mit jeder Interaktion." },
            { icon: Cpu, title: "Multi-LLM Unterstützung", desc: "Wähle zwischen verschiedenen KI-Modellen für die beste Antwortqualität." },
            { icon: Shield, title: "DSGVO-konform", desc: "Alle Daten werden in der EU gespeichert. Volle Kontrolle über deine Daten." },
            { icon: Building2, title: "Gewerbe-Modus", desc: "Erweiterte Funktionen für Betriebe: Projekte, Teamverwaltung, Dokumentenmanagement." },
            { icon: FileText, title: "Wissensdatenbank", desc: "Lade eigene Dokumente hoch und lass die KI mit deinem Fachwissen arbeiten." },
            { icon: Users, title: "B2C & B2B", desc: "Ob privater Pferdebesitzer oder professioneller Dienstleister – HufiAi passt sich an." },
          ].map((f) => (
            <div key={f.title} className="bg-card rounded-2xl border border-border p-7 hover:shadow-lg hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section id="blog" className="max-w-6xl mx-auto py-20 px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Blog & Neuigkeiten</h2>
            <p className="text-muted-foreground">Wissenswertes rund um die Pferdebranche und KI.</p>
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

      {/* Use Cases */}
      <UseCaseSection />

      {/* Expert Search CTA */}
      <section className="max-w-4xl mx-auto py-16 px-6 text-center">
        <div className="bg-card rounded-2xl border border-border p-10 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Finde einen Experten in deiner Nähe</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Zertifizierte Hufbearbeiter, Tierärzte und Stallbetreiber – geprüft und bereit, dir und deinem Pferd zu helfen.
          </p>
          <Button size="lg" onClick={() => navigate("/experten")} className="mt-2">
            Experten suchen <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Trust & AI for Good */}
      <TrustFooter />

      {/* Cookie Banner */}
      <CookieBanner />

      {/* Stats */}
      <section className="bg-muted py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "100%", label: "DSGVO-konform" },
            { value: "24/7", label: "Verfügbar" },
            { value: "Multi-LLM", label: "KI-Modelle" },
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
              <img src={hufiaiLogo} alt="HufiAi" className="h-8" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              KI-gestützte Lösungen für die gesamte Pferdebranche. DSGVO-konform, in der EU gehostet.
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <h4 className="font-semibold text-sm mb-3">Produkt</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <button onClick={() => scrollTo("features")} className="block hover:text-foreground transition-colors">Funktionen</button>
                <button onClick={() => navigate("/experten")} className="block hover:text-foreground transition-colors">Experten finden</button>
                <button onClick={() => navigate("/manual")} className="block hover:text-foreground transition-colors">Handbuch</button>
                <button onClick={() => navigate("/pricing")} className="block hover:text-foreground transition-colors">Preise</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Unternehmen</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <button onClick={() => navigate("/ueber-hufiai")} className="block hover:text-foreground transition-colors">Über HufiAi</button>
                <button onClick={() => navigate("/ethik")} className="block hover:text-foreground transition-colors">Ethik & Verantwortung</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Rechtliches</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <button onClick={() => navigate("/impressum")} className="block hover:text-foreground transition-colors">Impressum</button>
                <button onClick={() => navigate("/agb")} className="block hover:text-foreground transition-colors">AGB</button>
                <button onClick={() => navigate("/datenschutz")} className="block hover:text-foreground transition-colors">Datenschutz</button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground text-center">© {new Date().getFullYear()} HufiAi. Alle Rechte vorbehalten.</p>
          <p className="text-xs text-muted-foreground/60 text-center"><a href="/admin" className="text-muted-foreground/60 hover:text-muted-foreground/60 no-underline cursor-text" tabIndex={-1} aria-hidden="true">KI</a> kann Fehler machen. Nutzung auf eigenes Risiko.</p>
        </div>
      </footer>
    </div>
  );
}
