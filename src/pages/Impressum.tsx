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
          <p>Pascal Schmid<br />Barhufserviceschmid<br />Laurentiusstrasse 34<br />54497 Morscheid Riedenburg</p>
          <h2 className="text-foreground font-semibold text-lg">Kontakt</h2>
          <p>Telefon: 015209007017<br />E-Mail: teamhufmanager@gmail.com</p>
          <h2 className="text-foreground font-semibold text-lg">Gewerbeanmeldung</h2>
          <p>Die Gewerbeerlaubnis nach § 14 GewO oder § 55c GewO wurde am 15.08.2019 von folgender Stelle erteilt: Gemeinde Morbach.</p>
          <h2 className="text-foreground font-semibold text-lg">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
          <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
          <p className="text-xs mt-4">Quelle: e-recht24.de</p>
        </div>
      </div>
    </div>
  );
}
