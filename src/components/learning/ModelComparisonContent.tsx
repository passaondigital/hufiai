import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const models = [
  {
    name: "Claude Sonnet",
    emoji: "🧠",
    color: "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300",
    badgeColor: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    strengths: ["Komplexes Denken", "Code & Technik", "Deutsche Sprache"],
    speed: "Langsamer (durchdachter)",
    cost: "Etwas höher",
    bestFor: "Tiefes Denken, Analysen, technische Aufgaben",
  },
  {
    name: "Gemini Flash",
    emoji: "⚡",
    color: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300",
    badgeColor: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    strengths: ["Schnelligkeit", "Kreative Aufgaben", "Bildgenerierung"],
    speed: "Sehr schnell",
    cost: "Günstiger",
    bestFor: "Schnelle Antworten, Kreativ-Content, Bilder",
  },
];

const modeCombos = [
  { mode: "🎯 Scout", model: "Claude", reason: "Recherche braucht Präzision" },
  { mode: "🎨 Canvas", model: "Gemini", reason: "Kreativität braucht Speed" },
  { mode: "📊 Analyst", model: "Claude", reason: "Daten brauchen Sorgfalt" },
  { mode: "⚡ Agent", model: "Gemini", reason: "Aktionen brauchen Tempo" },
];

export default function ModelComparisonContent() {
  return (
    <div className="space-y-5 text-left">
      <div className="text-center">
        <h4 className="font-bold text-base mb-1">Claude vs Gemini – Was passt wann?</h4>
        <p className="text-xs text-muted-foreground">Beide sind großartig. Wähle, was zu deiner Aufgabe passt.</p>
      </div>

      {/* Model cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {models.map((m) => (
          <div key={m.name} className={cn("rounded-xl border p-4 space-y-3", m.color)}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{m.emoji}</span>
              <h5 className="font-bold text-sm">{m.name}</h5>
            </div>
            <div className="space-y-1.5">
              {m.strengths.map((s) => (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span>✅</span><span>{s}</span>
                </div>
              ))}
            </div>
            <div className="text-xs space-y-1 pt-1 border-t border-current/10">
              <p>📊 Speed: {m.speed}</p>
              <p>💰 Kosten: {m.cost}</p>
            </div>
            <Badge variant="outline" className={cn("text-[10px]", m.badgeColor)}>
              Ideal für: {m.bestFor}
            </Badge>
          </div>
        ))}
      </div>

      {/* Mode combos */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
        <h5 className="font-bold text-sm mb-3">🎯 In Hufi Pro – Welcher Modus + Modell?</h5>
        <div className="space-y-2">
          {modeCombos.map((c) => (
            <div key={c.mode} className="flex items-center justify-between text-xs bg-background/60 rounded-lg px-3 py-2">
              <span className="font-medium">{c.mode}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-bold">{c.model}</span>
              <span className="text-muted-foreground hidden sm:inline">({c.reason})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Example */}
      <div className="bg-accent/50 rounded-xl p-4 space-y-2">
        <h5 className="font-bold text-xs">💡 Beispiel:</h5>
        <p className="text-xs text-muted-foreground">
          „Ich brauche einen Marketing-Post" → <strong>🎨 Canvas + Gemini</strong> = schnell & kreativ
        </p>
        <p className="text-xs text-muted-foreground">
          „Analysiere meine Kundendaten" → <strong>📊 Analyst + Claude</strong> = tiefgehend & genau
        </p>
      </div>
    </div>
  );
}
