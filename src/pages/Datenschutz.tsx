import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Datenschutz() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>
        <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
          <h2 className="text-foreground font-semibold text-lg">1. Verantwortlicher</h2>
          <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist: [Name/Firma eintragen], [Adresse], [E-Mail].</p>
          <h2 className="text-foreground font-semibold text-lg">2. Erhebung und Speicherung personenbezogener Daten</h2>
          <p>Bei der Registrierung erheben wir: E-Mail-Adresse, Anzeigename, Kontotyp (Privat/Gewerbe). Diese Daten werden ausschließlich in der EU gespeichert.</p>
          <h2 className="text-foreground font-semibold text-lg">3. Zweck der Datenverarbeitung</h2>
          <p>Wir verarbeiten Ihre Daten zur Bereitstellung unserer KI-gestützten Dienste, zur Kontoverwaltung und zur Verbesserung unserer Plattform.</p>
          <h2 className="text-foreground font-semibold text-lg">4. HufiAi Horse-LLM Initiative</h2>
          <p>Nutzer können freiwillig (Opt-in) ihre anonymisierten Pferdedaten für das Training unseres spezialisierten KI-Modells bereitstellen. Personenbezogene Daten (PII) werden dabei strikt ausgeschlossen. Die Einwilligung kann jederzeit in den Einstellungen widerrufen werden.</p>
          <h2 className="text-foreground font-semibold text-lg">5. Ihre Rechte</h2>
          <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit Ihrer personenbezogenen Daten gemäß Art. 15-20 DSGVO.</p>
          <h2 className="text-foreground font-semibold text-lg">6. Datenlöschung</h2>
          <p>Bei Kontolöschung werden alle personenbezogenen Daten innerhalb von 30 Tagen unwiderruflich gelöscht.</p>
          <h2 className="text-foreground font-semibold text-lg">7. Kontakt</h2>
          <p>Für Datenschutzanfragen kontaktieren Sie uns unter: [E-Mail-Adresse].</p>
        </div>
      </div>
    </div>
  );
}
