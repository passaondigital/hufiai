import { CheckCircle2, X } from "lucide-react";

const features = [
  { name: "KI-Chat für Pferdewissen", free: true, privat: true, gewerbe: true },
  { name: "1 Pferdeprofil", free: true, privat: true, gewerbe: true },
  { name: "DSGVO-konformer Datenschutz", free: true, privat: true, gewerbe: true },
  { name: "Unbegrenzte Pferdeprofile", free: false, privat: true, gewerbe: true },
  { name: "PDF-Export", free: false, privat: true, gewerbe: true },
  { name: "Wissensdatenbank", free: false, privat: true, gewerbe: true },
  { name: "Hufgesundheits-Tracking", free: false, privat: true, gewerbe: true },
  { name: "Projekte & Fallverwaltung", free: false, privat: false, gewerbe: true },
  { name: "PDF-Export mit Firmenlogo", free: false, privat: false, gewerbe: true },
  { name: "Firmenprofil & Branding", free: false, privat: false, gewerbe: true },
  { name: "10 Social Media Posts/Monat", free: false, privat: false, gewerbe: true },
  { name: "CRM-Grundfunktionen", free: false, privat: false, gewerbe: true },
];

export default function ComparisonTable() {
  return (
    <section className="max-w-5xl mx-auto py-20 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Tarife im Vergleich</h2>
        <p className="text-muted-foreground">Finde den passenden Plan für deine Bedürfnisse.</p>
      </div>
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <div className="grid grid-cols-4 bg-muted/50 border-b border-border">
          <div className="p-4 font-semibold text-sm">Feature</div>
          <div className="p-4 font-semibold text-sm text-center">Free</div>
          <div className="p-4 font-semibold text-sm text-center">Privat Plus</div>
          <div className="p-4 font-semibold text-sm text-center bg-primary/5 border-l border-r border-border">Gewerbe Pro</div>
        </div>
        {features.map((f, i) => (
          <div key={f.name} className={`grid grid-cols-4 ${i < features.length - 1 ? "border-b border-border" : ""}`}>
            <div className="p-4 text-sm">{f.name}</div>
            <div className="p-4 flex justify-center">
              {f.free ? <CheckCircle2 className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground/40" />}
            </div>
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
