import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AGB() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
        <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>
        <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
          <h2 className="text-foreground font-semibold text-lg">§ 1 Geltungsbereich</h2>
          <p>Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Plattform HufiAi. Mit der Registrierung erkennt der Nutzer diese AGB an.</p>
          <h2 className="text-foreground font-semibold text-lg">§ 2 Leistungsbeschreibung</h2>
          <p>HufiAi stellt eine KI-gestützte Plattform für die Pferdebranche bereit. Die Plattform bietet Chat-basierte Beratung, Wissensdatenbank und Projektmanagement-Funktionen.</p>
          <h2 className="text-foreground font-semibold text-lg">§ 3 Registrierung und Konto</h2>
          <p>Für die Nutzung ist eine Registrierung erforderlich. Der Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen und seine Zugangsdaten vertraulich zu behandeln.</p>
          <h2 className="text-foreground font-semibold text-lg">§ 4 Nutzungsrechte</h2>
          <p>Der Nutzer erhält ein nicht-exklusives, nicht-übertragbares Nutzungsrecht an der Plattform für die Dauer des Vertragsverhältnisses.</p>
          <h2 className="text-foreground font-semibold text-lg">§ 5 Datenschutz</h2>
          <p>Der Schutz personenbezogener Daten ist uns wichtig. Details finden Sie in unserer Datenschutzerklärung.</p>
          <h2 className="text-foreground font-semibold text-lg">§ 6 Haftung</h2>
          <p>Die KI-generierten Inhalte dienen ausschließlich zu Informationszwecken und ersetzen keine professionelle Beratung durch Tierärzte oder Hufbearbeiter.</p>
          <h2 className="text-foreground font-semibold text-lg">§ 7 Kündigung</h2>
          <p>Beide Parteien können das Vertragsverhältnis jederzeit kündigen. Bei Kündigung werden alle personenbezogenen Daten gemäß DSGVO gelöscht.</p>
        </div>
      </div>
    </div>
  );
}
