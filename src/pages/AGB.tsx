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

          <h2 className="text-foreground font-semibold text-lg">§ 1 Geltungsbereich und Anbieter</h2>
          <p>Diese AGB gelten für alle Nutzungen der Plattform Hufi, betrieben von: Pascal Schmid, Laurentiusstrasse 34, 54497 Morscheid Riedenburg (nachfolgend „Anbieter").</p>

          <h2 className="text-foreground font-semibold text-lg">§ 2 Leistungsbeschreibung</h2>
          <p>Hufi ist ein intelligentes Branchen-Portal für die Pferdewelt. Der Anbieter stellt folgende Dienste zur Verfügung:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Hufi Chat:</strong> Ein KI-gestütztes Assistenzsystem zur Analyse und Information.</li>
            <li><strong>Experten-Netzwerk:</strong> Vermittlung von Kontakten zu professionellen Dienstleistern.</li>
            <li><strong>Content-Plattform:</strong> Bereitstellung von Fachwissen und News.</li>
          </ul>

          <h2 className="text-foreground font-semibold text-lg">§ 3 Haftungsausschluss für KI-Inhalte</h2>
          <p>Die durch Hufi generierten Inhalte (Texte, Analysen, Empfehlungen) werden durch eine Künstliche Intelligenz erstellt.</p>
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 my-3">
            <p className="text-sm font-semibold text-destructive">⚠️ Wichtiger Hinweis</p>
            <p className="text-sm mt-1">Diese Inhalte dienen ausschließlich der Information. Sie stellen keine tierärztliche Diagnose oder Behandlungsempfehlung dar.</p>
          </div>
          <p>Die Nutzung der KI-Vorschläge erfolgt auf eigene Gefahr. Der Anbieter haftet nicht für Schäden, die durch die Anwendung der KI-generierten Informationen am Tier oder Eigentum entstehen. Es wird dringend empfohlen, bei gesundheitlichen Problemen des Pferdes immer einen qualifizierten Tierarzt oder Fachmann hinzuzuziehen.</p>

          <h2 className="text-foreground font-semibold text-lg">§ 4 Vertragsschluss und Abonnements</h2>
          <p>Durch den Abschluss eines Abonnements (z.&nbsp;B. Founder Flow) kommt ein kostenpflichtiger Vertrag zustande.</p>
          <p>Die Abrechnung erfolgt monatlich oder jährlich im Voraus über den Zahlungsdienstleister Stripe.</p>
          <p>Der Zugang zu den Premium-Funktionen wird unmittelbar nach erfolgreicher Zahlung freigeschaltet.</p>

          <h2 className="text-foreground font-semibold text-lg">§ 5 Laufzeit und Kündigung</h2>
          <p>Abonnements können jederzeit zum Ende der laufenden Abrechnungsperiode gekündigt werden.</p>
          <p>Die Kündigung kann direkt über das Nutzer-Dashboard oder per E-Mail an den Support erfolgen.</p>

          <h2 className="text-foreground font-semibold text-lg">§ 6 Pflichten des Nutzers</h2>
          <p>Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten.</p>
          <p>Die missbräuchliche Nutzung der KI-Schnittstelle (z.&nbsp;B. durch automatisierte Massenabfragen oder Scraping) ist untersagt und führt zur sofortigen Sperrung.</p>

          <h2 className="text-foreground font-semibold text-lg">§ 7 Vision 2030 und Daten-Nutzung</h2>
          <p>Der Nutzer erkennt an, dass Hufi Teil eines größeren Forschungsprojekts für das Pferdewohl ist. Der Anbieter ist berechtigt, anonymisierte Daten zur Verbesserung der KI-Modelle und für wissenschaftliche Auswertungen im Rahmen der Mission 2030 zu nutzen, sofern der Nutzer dem in der Datenschutzerklärung nicht widersprochen hat.</p>

          <h2 className="text-foreground font-semibold text-lg">§ 8 Schlussbestimmungen</h2>
          <p>Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz des Anbieters.</p>

          <p className="text-xs mt-8">Stand: Februar 2026</p>
        </div>
      </div>
    </div>
  );
}
