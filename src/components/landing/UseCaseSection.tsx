import { useState } from "react";
import { Heart, Briefcase } from "lucide-react";

const useCases = {
  privat: [
    { q: "Mein Pferd hat einen Hufspalt", a: "HufiAi analysiert das Problem, erklärt mögliche Ursachen und gibt dir einen Aktionsplan mit Pflege-Tipps." },
    { q: "Welches Futter bei Hufrehe?", a: "Du erhältst eine sofortige, fachlich fundierte Einschätzung mit Ernährungsplan und Tierarzt-Hinweisen." },
    { q: "Stallbau-Planung für einen Offenstall", a: "Schritt-für-Schritt-Beratung zu Boden, Entwässerung, Abmessungen und Materialien." },
  ],
  gewerbe: [
    { q: "10 Beschläge heute dokumentieren", a: "Strukturierte Eingabe, automatische Fallakte und professioneller PDF-Export mit deinem Firmenlogo." },
    { q: "Kunden-Report für Tierarzt erstellen", a: "HufiAi generiert einen druckreifen Bericht mit Befund, Empfehlung und Verlaufsdokumentation." },
    { q: "Wissensdatenbank mit eigenen Leitfäden", a: "Lade deine Fach-PDFs hoch – die KI nutzt sie als Referenz für präzisere Antworten." },
  ],
};

export default function UseCaseSection() {
  const [mode, setMode] = useState<"privat" | "gewerbe">("privat");

  return (
    <section className="max-w-5xl mx-auto py-20 px-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">Wähle deine Situation</h2>
        <p className="text-muted-foreground mb-8">So hilft dir HufiAi im Alltag.</p>
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          <button
            onClick={() => setMode("privat")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "privat" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Heart className="w-4 h-4" /> Pferdebesitzer
          </button>
          <button
            onClick={() => setMode("gewerbe")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === "gewerbe" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Briefcase className="w-4 h-4" /> Profi / Gewerbe
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
