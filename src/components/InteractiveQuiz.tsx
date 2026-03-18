import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGamification } from "@/hooks/useGamification";

interface Module {
  id: string;
  title: string;
  xp_reward: number;
}

// Quiz questions per path
const QUIZ_BANKS: Record<string, { question: string; options: string[]; correct: number; explanation: string }[]> = {
  AI_BASICS: [
    { question: "Was ist KI im Kern?", options: ["Ein Roboter", "Ein Algorithmus, der aus Daten lernt", "Ein Ersatz für Menschen", "Eine Suchmaschine"], correct: 1, explanation: "KI sind Algorithmen, die Muster in Daten erkennen und daraus lernen – kein Roboter, kein Mensch-Ersatz." },
    { question: "Wofür steht DSGVO?", options: ["Datensicherheits-Grundverordnung", "Datenschutz-Grundverordnung", "Digitale Sicherheits-Garantie", "Daten-Service-Gesetz"], correct: 1, explanation: "Die Datenschutz-Grundverordnung schützt personenbezogene Daten in der EU." },
    { question: "Wird KI dich ersetzen?", options: ["Ja, komplett", "Nein, KI ist ein Werkzeug", "Nur in manchen Berufen", "KI ist zu dumm dafür"], correct: 1, explanation: "KI verstärkt menschliche Fähigkeiten – sie ersetzt keine Expertise, sondern ergänzt sie." },
    { question: "Du willst einen Social-Media-Post schreiben. Welche Modus + Modell-Kombi?", options: ["Scout + Claude", "Canvas + Gemini", "Agent + Claude", "Analyst + Gemini"], correct: 1, explanation: "Canvas-Modus + schnelles Gemini = die beste Kombi für kreativen Social Content." },
  ],
  PROMPT_MASTERY: [
    { question: "Was sind die 4 Bausteine eines guten Prompts?", options: ["Wer, Was, Wann, Wo", "Rolle, Aufgabe, Kontext, Format", "Frage, Antwort, Check, Done", "Input, Process, Output, Feedback"], correct: 1, explanation: "Rolle + Aufgabe + Kontext + Format = die perfekte Prompt-Formel." },
    { question: "Wann nutzt du den Scout-Modus?", options: ["Für kreative Texte", "Für Recherche und Fakten", "Für Datenanalyse", "Für Automatisierung"], correct: 1, explanation: "Scout ist dein Recherche-Modus – ideal für Faktensuche und Überblick." },
    { question: "Was ist 'Few-Shot Prompting'?", options: ["Wenig schreiben", "Beispiele im Prompt geben", "Schnell tippen", "Kurze Antworten erzwingen"], correct: 1, explanation: "Bei Few-Shot gibst du der KI Beispiele, damit sie das Muster versteht." },
    { question: "Warum solltest du Kontext im Prompt angeben?", options: ["Damit die Antwort länger wird", "Damit die KI relevantere Antworten gibt", "Ist nicht nötig", "Für die Abrechnung"], correct: 1, explanation: "Kontext hilft der KI, deine Situation zu verstehen und passgenau zu antworten." },
    { question: "Was bewirkt der Canvas-Modus?", options: ["Schnellere Antworten", "Kreative Inhalte erstellen", "Daten analysieren", "Code schreiben"], correct: 1, explanation: "Canvas ist dein Kreativ-Modus – ideal für Texte, Posts und Marketingmaterial." },
  ],
  CONTENT_CREATION: [
    { question: "Was macht einen guten Bild-Prompt aus?", options: ["Möglichst kurz", "Detailliert mit Stil, Motiv und Stimmung", "Nur ein Wort", "Technische Begriffe"], correct: 1, explanation: "Je detaillierter dein Prompt (Motiv, Stil, Beleuchtung, Stimmung), desto besser das Ergebnis." },
    { question: "Was ist ein Video-Hook?", options: ["Ein Angelhaken", "Die ersten 3 Sekunden, die Aufmerksamkeit fangen", "Das Ende eines Videos", "Ein Spezialeffekt"], correct: 1, explanation: "Der Hook sind die ersten 1-3 Sekunden – sie entscheiden, ob jemand weiterschaut." },
    { question: "Welches Format für Instagram Reels?", options: ["16:9", "9:16", "1:1", "4:3"], correct: 1, explanation: "Instagram Reels nutzen 9:16 – Hochformat für maximale Bildschirmnutzung." },
  ],
  BUSINESS_AI: [
    { question: "Wie hilft KI bei der Marketing-Strategie?", options: ["Ersetzt das Marketing-Team", "Automatisiert Analyse und Content-Erstellung", "Ist nur für große Firmen", "Macht alles alleine"], correct: 1, explanation: "KI automatisiert repetitive Aufgaben und liefert datenbasierte Insights für bessere Entscheidungen." },
    { question: "Was ist der wichtigste KI-Vorteil für Kleinunternehmen?", options: ["Kostenlos", "Zeitersparnis und Skalierung", "Ersetzt Mitarbeiter", "Braucht man nicht"], correct: 1, explanation: "KI spart Zeit bei wiederkehrenden Aufgaben und ermöglicht Wachstum ohne mehr Personal." },
  ],
  MEMORY_MASTERY: [
    { question: "Was speichert das Memory-System?", options: ["Passwörter", "Fakten und Kontext aus deinen Chats", "Fotos", "Nur Namen"], correct: 1, explanation: "Das Memory-System merkt sich relevante Fakten aus deinen Gesprächen für bessere, personalisierte Antworten." },
    { question: "Wofür sind Smart Reminders gut?", options: ["Wecker stellen", "Kontextbezogene Erinnerungen in Chats", "E-Mails senden", "Termine buchen"], correct: 1, explanation: "Smart Reminders erinnern dich im richtigen Moment – basierend auf Themen und Kontext, nicht nur Zeit." },
  ],
  COLLABORATION: [
    { question: "Was ist das Ecosystem?", options: ["Ein Wald", "Vernetzung mit Experten und Apps", "Ein Spiel", "Eine Datenbank"], correct: 1, explanation: "Das Ecosystem verbindet dich mit zertifizierten Experten und spezialisierten Apps der Pferdebranche." },
    { question: "Wie teilst du ein Pferdeprofil?", options: ["Per E-Mail", "Über sichere Ecosystem-Links", "Screenshot", "Geht nicht"], correct: 1, explanation: "Über das Ecosystem kannst du Pferdeprofile sicher mit Tierärzten und Hufbearbeitern teilen." },
  ],
};

interface Props {
  module: Module;
  pathCode: string;
  onComplete: () => void;
  onBack: () => void;
}

export default function InteractiveQuiz({ module, pathCode, onComplete, onBack }: Props) {
  const { awardXP } = useGamification();
  const questions = QUIZ_BANKS[pathCode] || QUIZ_BANKS.AI_BASICS;
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[currentQ];
  const isCorrect = selected === q?.correct;

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === q.correct) setCorrectCount((c) => c + 1);
  };

  const handleNext = async () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
      // Award XP for correct answers (per 5 correct = 5 XP bonus via quiz_correct)
      if (correctCount > 0) {
        const bonusRounds = Math.floor(correctCount / 1); // 5 XP per correct answer
        for (let i = 0; i < bonusRounds; i++) {
          await awardXP("quiz_correct", module.id);
        }
      }
    }
  };

  if (finished) {
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">{score >= 80 ? "🎉" : score >= 50 ? "👍" : "💪"}</div>
            <h3 className="text-xl font-bold mb-2">Quiz abgeschlossen!</h3>
            <p className="text-muted-foreground mb-4">
              {correctCount}/{questions.length} richtig ({score}%)
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
              +{correctCount * 5} XP verdient
            </div>
            <div>
              <Button onClick={onComplete}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Modul abschließen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
        <span className="text-sm text-muted-foreground">
          Frage {currentQ + 1}/{questions.length}
        </span>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-6">{q.question}</h3>
          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={showResult}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-all text-sm font-medium",
                  !showResult && "hover:border-primary/40 hover:bg-accent cursor-pointer border-border",
                  showResult && idx === q.correct && "border-green-500 bg-green-500/10 text-green-700",
                  showResult && selected === idx && idx !== q.correct && "border-destructive bg-destructive/10 text-destructive",
                  showResult && idx !== q.correct && selected !== idx && "opacity-50 border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    showResult && idx === q.correct ? "bg-green-500 text-white" :
                    showResult && selected === idx ? "bg-destructive text-white" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {showResult && idx === q.correct ? <CheckCircle2 className="w-4 h-4" /> :
                     showResult && selected === idx ? <XCircle className="w-4 h-4" /> :
                     String.fromCharCode(65 + idx)}
                  </div>
                  {opt}
                </div>
              </button>
            ))}
          </div>

          {showResult && (
            <div className={cn(
              "mt-4 p-4 rounded-xl text-sm",
              isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-amber-500/10 border border-amber-500/20"
            )}>
              <p className="font-medium mb-1">{isCorrect ? "✅ Richtig!" : "❌ Nicht ganz."}</p>
              <p className="text-muted-foreground">{q.explanation}</p>
            </div>
          )}

          {showResult && (
            <Button className="w-full mt-4" onClick={handleNext}>
              {currentQ < questions.length - 1 ? (
                <>Nächste Frage <ChevronRight className="w-4 h-4 ml-1" /></>
              ) : (
                "Ergebnis anzeigen"
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
