import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, MessageSquare, Cpu, ArrowRight, Users, FileText, Building2 } from "lucide-react";
import horseHero from "@/assets/horse-hero.png";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">HufiAi</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/auth")}>Anmelden</Button>
          <Button onClick={() => navigate("/auth")}>
            Kostenlos starten
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto pt-12 pb-16 px-6 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
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
              Jetzt starten
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-base px-8">
              Demo ansehen
            </Button>
          </div>
        </div>
        <div className="flex-1 flex justify-center md:justify-end">
          <img
            src={horseHero}
            alt="HufiAi – KI für die Pferdebranche"
            className="w-full max-w-md md:max-w-lg object-contain drop-shadow-2xl"
          />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto py-20 px-6">
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

      {/* Stats */}
      <section className="bg-secondary py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "100%", label: "DSGVO-konform" },
            { value: "24/7", label: "Verfügbar" },
            { value: "Multi-LLM", label: "KI-Modelle" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-secondary-foreground">{s.value}</p>
              <p className="text-sm text-secondary-foreground/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>© {new Date().getFullYear()} HufiAi. Alle Rechte vorbehalten. DSGVO-konform.</p>
      </footer>
    </div>
  );
}
