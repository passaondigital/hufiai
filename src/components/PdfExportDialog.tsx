import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  conversationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PdfExportDialog({ conversationId, open, onOpenChange }: Props) {
  const { profile } = useAuth();
  const [template, setTemplate] = useState<"business" | "private">(
    profile?.user_type === "gewerbe" ? "business" : "private"
  );
  const [horseName, setHorseName] = useState("");
  const [horseBreed, setHorseBreed] = useState("");
  const [horseAge, setHorseAge] = useState("");
  const [ownerName, setOwnerName] = useState(profile?.display_name || "");
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!conversationId) {
      toast.error("Kein Chat ausgewählt");
      return;
    }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Nicht eingeloggt");

      const res = await supabase.functions.invoke("generate-pdf", {
        body: {
          conversation_id: conversationId,
          template,
          horse_name: horseName || undefined,
          horse_breed: horseBreed || undefined,
          horse_age: horseAge || undefined,
          owner_name: ownerName || undefined,
        },
      });

      if (res.error) throw res.error;

      // Download the PDF
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HufiAi-Bericht-${conversationId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("PDF erstellt und heruntergeladen!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "PDF konnte nicht erstellt werden");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            Fallbericht exportieren
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Template Selection */}
          <div>
            <Label className="text-sm font-medium">Vorlage</Label>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setTemplate("private")}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  template === "private"
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="block font-semibold">🐴 Privat</span>
                <span className="text-xs text-muted-foreground">Verständlich, Tierwohl-fokussiert</span>
              </button>
              <button
                onClick={() => setTemplate("business")}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  template === "business"
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="block font-semibold">💼 Business</span>
                <span className="text-xs text-muted-foreground">Formal, für Tierärzte & Versicherungen</span>
              </button>
            </div>
          </div>

          {/* Horse Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Pferdename</Label>
              <Input value={horseName} onChange={(e) => setHorseName(e.target.value)} placeholder="z.B. Stella" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Rasse</Label>
              <Input value={horseBreed} onChange={(e) => setHorseBreed(e.target.value)} placeholder="z.B. Warmblut" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Alter</Label>
              <Input value={horseAge} onChange={(e) => setHorseAge(e.target.value)} placeholder="z.B. 12 Jahre" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Besitzer</Label>
              <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Name" className="mt-1" />
            </div>
          </div>

          <Button onClick={generate} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Bericht wird erstellt…
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" /> PDF generieren
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Die KI erstellt eine strukturierte Zusammenfassung deines Chats als professionellen Fallbericht.
          </p>
          <p className="text-[10px] text-muted-foreground/70 text-center mt-1">
            ⚖️ HufiAi ist eine KI-Assistenz. Informationen ersetzen keine fachliche Beratung. Nutzung auf eigenes Risiko.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
