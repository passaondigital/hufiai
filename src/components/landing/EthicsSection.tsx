import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

const promises = [
  "Wir speichern deine Daten NICHT zum Trainieren",
  "Deine Pferdefotos gehören DIR",
  "Keine Third-Party-Shares ohne Erlaubnis",
  "DSGVO-konform. Zertifiziert.",
  "Du kannst dein Konto jederzeit löschen",
  "Transparent. Immer.",
];

export default function EthicsSection() {
  const navigate = useNavigate();

  return (
    <section className="bg-secondary text-secondary-foreground py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-3">DSGVO. Datenschutz. Pferdeschutz.</h2>
          <p className="text-secondary-foreground/70">Unsere Versprechen an dich.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
          {promises.map((p) => (
            <div
              key={p}
              className="flex items-center gap-3 bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-xl px-5 py-3.5"
            >
              <span className="text-success">✅</span>
              <span className="text-sm font-medium text-secondary-foreground">{p}</span>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate("/ethik")}
            className="text-sm font-medium text-primary hover:underline"
          >
            Vollständige Datenschutzerklärung & Ethik-Seite →
          </button>
        </div>
      </div>
    </section>
  );
}
