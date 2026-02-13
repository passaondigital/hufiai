import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Impressum() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>
        <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
          <h2 className="text-foreground font-semibold text-lg">Angaben gemäß § 5 TMG</h2>
          <p>[Firmenname eintragen]<br />[Straße und Hausnummer]<br />[PLZ Ort]</p>
          <h2 className="text-foreground font-semibold text-lg">Kontakt</h2>
          <p>Telefon: [Telefonnummer]<br />E-Mail: [E-Mail-Adresse]</p>
          <h2 className="text-foreground font-semibold text-lg">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>[Name]<br />[Adresse]</p>
          <h2 className="text-foreground font-semibold text-lg">Streitschlichtung</h2>
          <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/. Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
          <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
        </div>
      </div>
    </div>
  );
}
