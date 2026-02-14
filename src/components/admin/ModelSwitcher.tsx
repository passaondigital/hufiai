import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu } from "lucide-react";

const MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "Google", speed: "⚡ Schnell", cost: "Günstig", desc: "Standard – schnell & deutsch-optimiert" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", speed: "⚡ Schnell", cost: "Günstig", desc: "Multimodal, gutes Deutsch" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google", speed: "🐢 Langsam", cost: "Teuer", desc: "Höchste Qualität, komplexe Aufgaben" },
  { id: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", provider: "Google", speed: "🐢 Mittel", cost: "Teuer", desc: "Next-Gen Pro, starkes Reasoning" },
  { id: "openai/gpt-5", label: "GPT-5", provider: "OpenAI", speed: "🐢 Langsam", cost: "Teuer", desc: "Starkes Reasoning, multimodal" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", provider: "OpenAI", speed: "⚡ Mittel", cost: "Mittel", desc: "Gutes Preis-Leistung" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", provider: "OpenAI", speed: "⚡⚡ Sehr schnell", cost: "Günstig", desc: "Speed-optimiert, einfache Tasks" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini Flash Lite", provider: "Google", speed: "⚡⚡ Sehr schnell", cost: "Sehr günstig", desc: "Schnellstes Modell, einfache Aufgaben" },
];

interface ModelSwitcherProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ModelSwitcher({ selectedModel, onModelChange }: ModelSwitcherProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="w-5 h-5 text-primary" /> Model Switcher
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Wähle das KI-Modell für Admin-Tools (Video Lab, Voice, Image Lab). Alle Modelle über Lovable AI Gateway – kein extra API Key nötig.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => onModelChange(m.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedModel === m.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/40 hover:bg-accent"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{m.label}</span>
                <Badge variant="outline" className="text-xs">{m.provider}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{m.speed}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{m.cost}</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
