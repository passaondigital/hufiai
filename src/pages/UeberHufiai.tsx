import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, Target, Heart, TrendingUp, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UeberHufiai() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Zurück</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Hufi</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" /> Unsere Mission
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Die Zukunft der<br />
            <span className="text-primary">Pferdebranche gestalten</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hufi ist das digitale Betriebssystem für Pferdebetriebe. Eine Vision für eine Branche,
            in der Technologie dem Tierwohl dient und Handwerk respektiert wird.
          </p>
        </section>

        {/* Vision 2030 */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="bg-card rounded-2xl border border-border p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Vision 2030</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bis 2030 wollen wir das führende digitale Betriebssystem für die gesamte Equine-Branche im
              deutschsprachigen Raum sein. Unser Ziel: Jeder Hufbearbeiter, Tierarzt und
              Pferdebesitzer hat einen strukturierten, professionellen Betriebsalltag.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">✅ 10.000+ aktive Nutzer bis 2027</li>
              <li className="flex items-center gap-2">✅ Vollständig selbsttragendes Geschäftsmodell</li>
              <li className="flex items-center gap-2">✅ Vollständige Betriebsdokumentation</li>
              <li className="flex items-center gap-2">✅ Integration mit Hufmanager & Co.</li>
            </ul>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Passive Rent Philosophie</h2>
            <p className="text-muted-foreground leading-relaxed">
              Hufi baut auf dem Prinzip der "Passive Rent" – einmal aufgebaute Systeme 
              generieren nachhaltigen Mehrwert. Unser Ansatz: Investiere in Qualität, 
              automatisiere intelligent und lass die Plattform für dich arbeiten.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">🔄 Automatisierte Content-Pipeline</li>
              <li className="flex items-center gap-2">📈 Skalierbare SaaS-Architektur</li>
              <li className="flex items-center gap-2">🤝 Assistent im Hintergrund, Mensch im Vordergrund</li>
              <li className="flex items-center gap-2">💰 Faire, transparente Preisgestaltung</li>
            </ul>
          </div>
        </section>

        {/* Team / Founder */}
        <section className="text-center space-y-6 bg-card rounded-2xl border border-border p-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Von Pferdemenschen, für Pferdemenschen</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Hufi wurde nicht in einem Silicon Valley Lab geboren, sondern im Stall. 
            Aus echten Problemen. Aus der Frustration, dass die Pferdebranche bei der 
            Digitalisierung abgehängt wird. Wir glauben: Technologie muss dem Tier dienen – 
            nicht umgekehrt.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Teil der Bewegung werden <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </section>

        {/* DSGVO & Trust */}
        <section className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Globe, title: "100% EU-Server", desc: "Alle Daten werden in der EU gespeichert und verarbeitet. DSGVO-konform von Tag 1." },
            { icon: Heart, title: "Open Knowledge", desc: "Wir glauben an offenes Wissen. Unser Blog und Manual sind für alle zugänglich." },
            { icon: Sparkles, title: "Assistent mit Gewissen", desc: "Hufi erkennt kritische Situationen und verweist an echte Experten vor Ort." },
          ].map((item) => (
            <div key={item.title} className="bg-card rounded-xl border border-border p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Hufi. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  );
}
