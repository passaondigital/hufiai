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

          <h2 className="text-foreground font-semibold text-lg">1. Datenschutz auf einen Blick</h2>
          <h3 className="text-foreground font-medium">Allgemeine Hinweise</h3>
          <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>

          <h3 className="text-foreground font-medium">Datenerfassung auf dieser Website</h3>
          <p><strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong> Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber: Pascal Schmid, Laurentiusstrasse 34, 54497 Morscheid Riedenburg.</p>
          <p><strong>Wie erfassen wir Ihre Daten?</strong> Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z.&nbsp;B. im Chat oder bei der Registrierung). Andere Daten werden automatisch durch unsere IT-Systeme erfasst (technische Daten wie IP-Adresse oder Browser).</p>
          <p><strong>Wofür nutzen wir Ihre Daten?</strong> Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten nutzen wir zur Bereitstellung unserer KI-Dienste (HufiAi) sowie zur Abwicklung von Zahlungen.</p>

          <h2 className="text-foreground font-semibold text-lg">2. Hosting und Infrastruktur</h2>
          <p>Wir hosten die Inhalte unserer Website bei folgenden Anbietern:</p>
          <h3 className="text-foreground font-medium">All-Inkl</h3>
          <p>Domain-Hosting und E-Mail-Dienste: ALL-INKL.COM – Neue Medien Münnich, Hauptstraße 68, 02742 Friedersdorf.</p>
          <h3 className="text-foreground font-medium">Supabase &amp; Cloud-Infrastruktur</h3>
          <p>Wir nutzen Supabase (Supabase Inc., USA) zur Speicherung von Nutzerprofilen, Projektdaten und App-Inhalten. Die Daten werden verschlüsselt auf Servern gespeichert, die den europäischen Datenschutzstandards entsprechen. Grundlage ist Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO.</p>

          <h2 className="text-foreground font-semibold text-lg">3. Spezifische Dienste: KI &amp; Zahlungen</h2>
          <h3 className="text-foreground font-medium">HufiAi Künstliche Intelligenz (Learning Loop)</h3>
          <p>Im Rahmen unserer Dienstleistung nutzen wir Künstliche Intelligenz, um Analysen und Chat-Antworten zu generieren.</p>
          <p><strong>Chat-Verarbeitung:</strong> Eingaben im HufiAi-Chat werden verarbeitet, um Ihnen fachliche Antworten zu liefern.</p>
          <p><strong>Anonymisiertes Training:</strong> Sofern Sie eingewilligt haben, nutzen wir anonymisierte Interaktionen, um das Modell HufiAi Core stetig zu verbessern. Hierbei werden alle persönlichen Merkmale (Namen, Orte) entfernt, sodass kein Rückschluss auf Ihre Person möglich ist.</p>
          <p><strong>Verantwortung:</strong> KI-Analysen sind Assistenz-Systeme und ersetzen keine tierärztliche Diagnose oder handwerkliche Facharbeit vor Ort.</p>

          <h3 className="text-foreground font-medium">Stripe (Zahlungsabwicklung)</h3>
          <p>Wir nutzen Stripe (Stripe Payments Europe Ltd., Irland) zur Abwicklung von Abonnements (z.&nbsp;B. Founder Flow). Wenn Sie ein kostenpflichtiges Paket buchen, werden Ihre Zahlungsdaten sicher an Stripe übertragen. Dies erfolgt auf Grundlage von Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO (Vertragserfüllung).</p>

          <h2 className="text-foreground font-semibold text-lg">4. Pflichtinformationen und Rechte</h2>
          <h3 className="text-foreground font-medium">Ihre Rechte</h3>
          <p><strong>Auskunft:</strong> Sie haben das Recht zu erfahren, welche Daten wir über Sie speichern.</p>
          <p><strong>Löschung:</strong> Sie können die Löschung Ihrer Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>
          <p><strong>Widerruf:</strong> Einmal erteilte Einwilligungen (z.&nbsp;B. für das KI-Training) können Sie jederzeit für die Zukunft widerrufen.</p>

          <h3 className="text-foreground font-medium">SSL- bzw. TLS-Verschlüsselung</h3>
          <p>Diese Seite nutzt eine SSL-Verschlüsselung, um Ihre Daten bei der Übertragung (z.&nbsp;B. im Chat oder beim Login) zu schützen.</p>

          <h2 className="text-foreground font-semibold text-lg">5. Analyse und Tools</h2>
          <h3 className="text-foreground font-medium">Google Fonts (Lokales Hosting)</h3>
          <p>Wir nutzen Google Fonts zur einheitlichen Darstellung. Diese sind lokal auf unserem Server installiert. Es erfolgt keine Verbindung zu Servern von Google.</p>

          <h3 className="text-foreground font-medium">YouTube und Soziale Medien</h3>
          <p>Elemente von YouTube, Facebook und Instagram sind so eingebunden, dass Daten erst übertragen werden, wenn Sie aktiv auf diese Elemente klicken (Einwilligung nach Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO).</p>

          <p className="text-xs mt-8">Stand: Februar 2026 · Quelle: Erstellt unter Einbeziehung von e-recht24.de und spezifischen Ergänzungen für HufiAi.</p>
        </div>
      </div>
    </div>
  );
}
