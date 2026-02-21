import { CheckCircle2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const features = [
  { nameDE: "KI-Chat für Pferdewissen", nameEN: "AI Chat for Horse Knowledge", free: true, privat: true, gewerbe: true },
  { nameDE: "1 Pferdeprofil", nameEN: "1 Horse Profile", free: true, privat: true, gewerbe: true },
  { nameDE: "DSGVO-konformer Datenschutz", nameEN: "GDPR-Compliant Privacy", free: true, privat: true, gewerbe: true },
  { nameDE: "Unbegrenzte Pferdeprofile", nameEN: "Unlimited Horse Profiles", free: false, privat: true, gewerbe: true },
  { nameDE: "PDF-Export", nameEN: "PDF Export", free: false, privat: true, gewerbe: true },
  { nameDE: "Wissensdatenbank", nameEN: "Knowledge Base", free: false, privat: true, gewerbe: true },
  { nameDE: "Hufgesundheits-Tracking", nameEN: "Hoof Health Tracking", free: false, privat: true, gewerbe: true },
  { nameDE: "KI Video Engine", nameEN: "AI Video Engine", free: false, privat: false, gewerbe: true },
  { nameDE: "Projekte & Fallverwaltung", nameEN: "Projects & Case Management", free: false, privat: false, gewerbe: true },
  { nameDE: "PDF-Export mit Firmenlogo", nameEN: "PDF Export with Company Logo", free: false, privat: false, gewerbe: true },
  { nameDE: "Firmenprofil & Branding", nameEN: "Company Profile & Branding", free: false, privat: false, gewerbe: true },
  { nameDE: "10 Social Media Posts/Monat", nameEN: "10 Social Media Posts/Month", free: false, privat: false, gewerbe: true },
  { nameDE: "CRM-Grundfunktionen", nameEN: "Basic CRM Features", free: false, privat: false, gewerbe: true },
];

export default function ComparisonTable() {
  const { t, lang } = useI18n();
  return (
    <section id="pricing" className="max-w-5xl mx-auto py-20 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">{t("compare.title")}</h2>
        <p className="text-muted-foreground">{t("compare.subtitle")}</p>
      </div>
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <div className="grid grid-cols-4 bg-muted/50 border-b border-border">
          <div className="p-4 font-semibold text-sm">{t("compare.feature")}</div>
          <div className="p-4 font-semibold text-sm text-center">Free</div>
          <div className="p-4 font-semibold text-sm text-center">Privat Plus</div>
          <div className="p-4 font-semibold text-sm text-center bg-primary/5 border-l border-r border-border">Gewerbe Pro</div>
        </div>
        {features.map((f, i) => (
          <div key={f.nameDE} className={`grid grid-cols-4 ${i < features.length - 1 ? "border-b border-border" : ""}`}>
            <div className="p-4 text-sm">{lang === "de" ? f.nameDE : f.nameEN}</div>
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
