import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Shield, Heart, AlertTriangle, Scale, Sparkles, Users, Eye, Leaf, Target } from "lucide-react";

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
            <span className="font-bold text-lg">Hufi</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-20">
        {/* Hero */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Shield className="w-4 h-4" /> Ethik & Verantwortung
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Unsere Verantwortung: <span className="text-primary">KI im Dienst des Pferdewohls</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Warum Hufi kein Ersatz für das Handwerk ist, sondern dessen stärkster Verbündeter.
          </p>
        </section>

        {/* 1. Die Vision 2030 */}
        <section className="bg-card rounded-2xl border border-border p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">1. Die Vision 2030</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Hufi ist nicht einfach eine App. Es ist der erste Schritt einer Reise, die am <strong className="text-foreground">15. November 2030</strong> in der Eröffnung des modernsten Forschungs- und Schulungszentrums der Pferdewelt gipfeln wird.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Unser Ziel ist es, die digitale Intelligenz zu nutzen, um die physische Welt der Pferde – vom Stallbau bis zur Hufpflege – radikal zu verbessern.
          </p>
        </section>

        {/* 2. Wissen ist keine Kompetenz */}
        <section className="bg-card rounded-2xl border border-border p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">2. Wissen ist keine Kompetenz</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Wir glauben an die Demokratisierung von Wissen. Hufi macht Expertenwissen für jeden Pferdebesitzer zugänglich. Doch wir ziehen eine klare Grenze:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <p className="font-semibold text-primary mb-2">🤖 KI analysiert</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sie erkennt Muster, wertet Daten aus und gibt Impulse.
              </p>
            </div>
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <p className="font-semibold text-primary mb-2">🧑‍🔧 Der Mensch handelt</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kein Algorithmus der Welt ersetzt das Fingerspitzengefühl eines erfahrenen Hufschmieds, die Intuition eines Tierarztes oder das feine Gespür eines Trainers. Hufi ist der Kompass, aber der Mensch hält das Steuer.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Transparenz & Daten-Ethik */}
        <section className="bg-card rounded-2xl border border-border p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">3. Transparenz & Daten-Ethik</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Wir sammeln Daten nicht für den Profit, sondern für den Fortschritt.
          </p>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Anonymität</p>
                <p className="text-sm text-muted-foreground">Deine Daten gehören dir. Für unsere globalen Statistiken nutzen wir ausschließlich anonymisierte Werte.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Scale className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Open Insights</p>
                <p className="text-sm text-muted-foreground">Wir machen unsere Erkenntnisse über die globale Pferdegesundheit öffentlich zugänglich, um die gesamte Branche zu inspirieren und Missstände sichtbar zu machen.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Passive Miete */}
        <section className="bg-card rounded-2xl border-2 border-primary/20 p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">4. Die „Passive Miete" für einen guten Zweck</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Hufi finanziert sich durch ein faires Abo-Modell. Diese „passive Miete" ist der Treibstoff für unsere größeren Ziele:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-background rounded-xl p-5 border border-border">
              <p className="text-2xl mb-2">🌾</p>
              <p className="font-semibold mb-1">Globales Futter-Netzwerk</p>
              <p className="text-sm text-muted-foreground">Aufbau eines Netzwerks für Gnadenhöfe weltweit.</p>
            </div>
            <div className="bg-background rounded-xl p-5 border border-border">
              <p className="text-2xl mb-2">🤝</p>
              <p className="font-semibold mb-1">Förderung vor Ort</p>
              <p className="text-sm text-muted-foreground">Unterstützung von Projekten, die dort anpacken, wo es die Welt der Pferde am nötigsten hat.</p>
            </div>
          </div>
        </section>

        {/* 5. Unser Versprechen */}
        <section className="bg-card rounded-2xl border border-border p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">5. Unser Versprechen</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Wir lehnen Abhängigkeiten ab. Wir bauen unsere eigenen Systeme, um unabhängig von den „Big Playern" agieren zu können. Hufi bleibt eine Plattform <strong className="text-foreground">von Pferdemenschen für Pferdemenschen</strong> – getrieben von Leidenschaft, nicht von reiner Gier.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            {[
              { emoji: "🐴", text: "Das Wohl des Tieres steht IMMER über dem Geschäftsinteresse." },
              { emoji: "🔒", text: "Deine Daten gehören dir. Wir verkaufen keine Nutzerdaten." },
              { emoji: "🤝", text: "KI unterstützt Experten, sie ersetzt sie nicht." },
            ].map((item) => (
              <div key={item.emoji} className="text-center space-y-2">
                <p className="text-3xl">{item.emoji}</p>
                <p className="text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ethic Guardrail */}
        <section className="bg-card rounded-2xl border-2 border-primary/20 p-10 space-y-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">Der Ethic Guardrail</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Hufi verfügt über einen eingebauten "Ethic Guardrail". Wenn die KI eine
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

        {/* CTA */}
        <section className="text-center space-y-6 bg-card rounded-2xl border border-border p-10">
          <h2 className="text-2xl font-bold">Werde Teil der Vision 2030</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Starte deinen Founder Flow und gestalte die Zukunft der Pferdebranche mit uns.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Starte deinen Founder Flow <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Hufi. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  );
}
