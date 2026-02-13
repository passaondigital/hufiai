import { CheckCircle2, X } from "lucide-react";

const features = [
  { name: "KI-Chat für Pferdewissen", privat: true, gewerbe: true },
  { name: "Hufgesundheits-Tracking", privat: true, gewerbe: true },
  { name: "Wissensdatenbank (eigene Dokumente)", privat: true, gewerbe: true },
  { name: "DSGVO-konformer Datenschutz", privat: true, gewerbe: true },
  { name: "Projekte & Fallverwaltung", privat: false, gewerbe: true },
  { name: "Kunden-Reports & Dokumentation", privat: false, gewerbe: true },
  { name: "Pro-PDF-Export (mit Logo)", privat: false, gewerbe: true },
  { name: "Firmen-Branding (Logo, Adresse)", privat: false, gewerbe: true },
  { name: "Team-Verwaltung", privat: false, gewerbe: true },
  { name: "Strukturierte Eingabe-Modi", privat: false, gewerbe: true },
];

export default function ComparisonTable() {
  return (
    <section className="max-w-4xl mx-auto py-20 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Privat vs. Gewerbe</h2>
        <p className="text-muted-foreground">Finde den passenden Modus für deine Bedürfnisse.</p>
      </div>
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <div className="grid grid-cols-3 bg-muted/50 border-b border-border">
          <div className="p-4 font-semibold text-sm">Feature</div>
          <div className="p-4 font-semibold text-sm text-center">Privat</div>
          <div className="p-4 font-semibold text-sm text-center bg-primary/5 border-l border-r border-border">Gewerbe</div>
        </div>
        {features.map((f, i) => (
          <div key={f.name} className={`grid grid-cols-3 ${i < features.length - 1 ? "border-b border-border" : ""}`}>
            <div className="p-4 text-sm">{f.name}</div>
            <div className="p-4 flex justify-center">
              {f.privat ? <CheckCircle2 className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground/40" />}
            </div>
            <div className="p-4 flex justify-center bg-primary/5 border-l border-r border-border">
              {f.gewerbe ? <CheckCircle2 className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground/40" />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
