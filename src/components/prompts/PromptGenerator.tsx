import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wand2, Sparkles, Loader2, Copy, Edit3, Star, ArrowRight, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface PromptGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAsNew: (title: string, content: string, explanation: string) => void;
  onSaveAsFavorite: (title: string, content: string, explanation: string) => void;
}

export default function PromptGenerator({ open, onOpenChange, onSaveAsNew, onSaveAsFavorite }: PromptGeneratorProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [explanation, setExplanation] = useState("");

  const reset = () => {
    setStep(1); setGoal(""); setContext(""); setGeneratedPrompt(""); setExplanation(""); setGenerating(false);
  };

  const generate = async () => {
    if (!goal.trim()) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Nicht eingeloggt");
      const res = await supabase.functions.invoke("generate-content", {
        body: { action: "generate_prompt", idea: goal, context },
      });
      if (res.error) throw res.error;
      setGeneratedPrompt(res.data?.prompt || "");
      setExplanation(res.data?.explanation || "");
      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Generator fehlgeschlagen");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" /> Prompt-Generator
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? "bg-primary text-primary-foreground" :
                step > s ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              <span className={`text-xs hidden sm:inline ${step === s ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s === 1 ? "Ziel" : s === 2 ? "Kontext" : "Ergebnis"}
              </span>
              {s < 3 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step 1: Ziel */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Was möchtest du erreichen?</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">Beschreibe dein Ziel in 1-2 Sätzen.</p>
              <Textarea
                value={goal} onChange={e => setGoal(e.target.value)}
                placeholder="z.B. Ich will eine Hufanalyse durchführen und dem Besitzer die Ergebnisse verständlich erklären..."
                className="min-h-[100px]" autoFocus
              />
            </div>
            <Button onClick={() => setStep(2)} disabled={!goal.trim()} className="w-full gap-2">
              Weiter <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Kontext */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Kontext & Details (optional)</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">Gibt es besondere Anforderungen, Zielgruppe oder Formatwünsche?</p>
              <Textarea
                value={context} onChange={e => setContext(e.target.value)}
                placeholder="z.B. Für Pferdebesitzer ohne Fachkenntnisse, tabellarisch, mit Handlungsempfehlungen..."
                className="min-h-[100px]" autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Zurück</Button>
              <Button onClick={generate} disabled={generating} className="flex-1 gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Generiere..." : "Prompt generieren"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Ergebnis */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted border border-border">
              <p className="text-xs font-medium mb-1.5 text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Generierter Prompt
              </p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{generatedPrompt}</p>
            </div>
            {explanation && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs font-medium mb-1 text-primary/80">💡 Warum funktioniert dieser Prompt?</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{explanation}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(generatedPrompt); toast.success("Kopiert!"); }} className="gap-1.5 text-xs">
                <Copy className="w-3.5 h-3.5" /> Kopieren
              </Button>
              <Button variant="outline" onClick={() => { onSaveAsNew(goal.slice(0, 60), generatedPrompt, explanation); onOpenChange(false); reset(); }} className="gap-1.5 text-xs">
                <Edit3 className="w-3.5 h-3.5" /> Bearbeiten
              </Button>
              <Button onClick={() => { onSaveAsFavorite(goal.slice(0, 60), generatedPrompt, explanation); onOpenChange(false); reset(); }} className="gap-1.5 text-xs">
                <Star className="w-3.5 h-3.5" /> Favorit
              </Button>
            </div>
            <Button variant="ghost" onClick={reset} className="w-full text-xs text-muted-foreground">
              Neuen Prompt generieren
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
