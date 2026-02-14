import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Shield, Heart, AlertTriangle, Scale, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EthikSeite() {
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
            <span className="font-bold text-lg">HufiAi</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Shield className="w-4 h-4" /> Ethik & Verantwortung
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            KI mit <span className="text-primary">Verantwortung</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Wir entwickeln KI, die dem Tierwohl dient, das Handwerk schützt und 
            ethische Grenzen respektiert.
          </p>
        </section>

        {/* Principles */}
        <section className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: Heart,
              title: "Tierwohl zuerst",
              desc: "Bei kritischen Situationen (Kolik, Lahmheit, Verletzungen) verweist HufiAi IMMER an qualifizierte Experten vor Ort. Die KI gibt niemals eigenständige Diagnosen oder Behandlungsempfehlungen.",
            },
            {
              icon: Users,
              title: "Handwerk schützen",
              desc: "HufiAi ersetzt keine Hufbearbeiter, Tierärzte oder Stallbetreiber. Wir unterstützen sie. Unsere KI ist ein Werkzeug – die fachliche Entscheidung liegt immer beim Menschen.",
            },
            {
              icon: Shield,
              title: "Datenschutz by Design",
              desc: "DSGVO-konform von Anfang an. Alle Daten bleiben in der EU. Nutzer haben volle Kontrolle über ihre Daten und können Trainings-Beiträge jederzeit deaktivieren.",
            },
            {
              icon: Scale,
              title: "Transparenz",
              desc: "Jede KI-Antwort enthält den Hinweis, dass HufiAi eine Assistenz ist. Wir kommunizieren offen über Limitierungen, Fehlerquoten und die Technologie hinter der Plattform.",
            },
          ].map((p) => (
            <div key={p.title} className="bg-card rounded-2xl border border-border p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <p.icon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{p.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </section>

        {/* Ethic Guardrail */}
        <section className="bg-card rounded-2xl border-2 border-primary/20 p-10 space-y-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">Der Ethic Guardrail</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            HufiAi verfügt über einen eingebauten "Ethic Guardrail". Wenn die KI eine 
            potenziell kritische Situation erkennt – ob akute Verletzung, Kolik-Verdacht, 
            Hufrehe oder andere Notfälle – greift ein automatischer Schutzmechanismus:
          </p>
          <div className="bg-background rounded-xl p-6 border border-border space-y-3">
            <p className="text-sm font-medium">So funktioniert der Guardrail:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li><strong>Erkennung:</strong> KI analysiert den Kontext und identifiziert kritische Schlüsselwörter</li>
              <li><strong>Warnung:</strong> Statt einer Diagnose wird ein deutlicher Warnhinweis angezeigt</li>
              <li><strong>Verweisung:</strong> Ein prominenter CTA-Button leitet direkt zur Experten-Suche</li>
              <li><strong>Dokumentation:</strong> Der Vorfall wird für Qualitätssicherung protokolliert</li>
            </ol>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
            <p className="text-sm text-foreground">
              ⚠️ <strong>Wichtig: Diese Situation erfordert professionelle Hilfe vor Ort.</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              🔍 <a href="/experten" className="text-primary hover:underline">Finde einen Experten in deiner Nähe →</a>
            </p>
          </div>
        </section>

        {/* Commitment */}
        <section className="text-center space-y-6 bg-card rounded-2xl border border-border p-10">
          <h2 className="text-2xl font-bold">Unser Versprechen</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            {[
              { emoji: "🐴", text: "Das Wohl des Tieres steht IMMER über dem Geschäftsinteresse." },
              { emoji: "🔒", text: "Deine Daten gehören dir. Wir verkaufen keine Nutzerdaten." },
              { emoji: "🤝", text: "KI unterstützt Experten, sie ersetzt sie nicht." },
            ].map((item) => (
              <div key={item.emoji} className="space-y-2">
                <p className="text-3xl">{item.emoji}</p>
                <p className="text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Verantwortungsvoll starten <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} HufiAi. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  );
}
