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

type Template = "private" | "business" | "professional";

export default function PdfExportDialog({ conversationId, open, onOpenChange }: Props) {
  const { profile } = useAuth();
  const isExpert = profile?.sub_role && ["hufbearbeiter", "tierarzt", "stallbetreiber"].includes(profile.sub_role);

  const [template, setTemplate] = useState<Template>(
    isExpert ? "professional" : profile?.user_type === "gewerbe" ? "business" : "private"
  );
  const [horseName, setHorseName] = useState("");
  const [horseBreed, setHorseBreed] = useState("");
  const [horseAge, setHorseAge] = useState("");
  const [ownerName, setOwnerName] = useState(profile?.display_name || "");
  const [generating, setGenerating] = useState(false);

  const roleLabel: Record<string, string> = {
    hufbearbeiter: "Hufbearbeiter",
    tierarzt: "Tierarzt",
    stallbetreiber: "Stallbetreiber",
  };

  const generate = async () => {
    if (!conversationId) { toast.error("Kein Chat ausgewählt"); return; }
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
          ...(template === "professional" ? {
            expert_name: profile?.display_name || undefined,
            expert_title: profile?.sub_role ? roleLabel[profile.sub_role] || profile.sub_role : undefined,
            expert_certificates: profile?.certificates || undefined,
          } : {}),
        },
      });

      if (res.error) throw res.error;

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

  const templates: { key: Template; icon: string; label: string; desc: string; show: boolean }[] = [
    { key: "private", icon: "🐴", label: "Privat", desc: "Verständlich, Tierwohl-fokussiert", show: true },
    { key: "business", icon: "💼", label: "Business", desc: "Formal, für Versicherungen", show: true },
    { key: "professional", icon: "🩺", label: "Experten-Bericht", desc: "Mit deinem Branding & Zertifikaten", show: !!isExpert },
  ];

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
          <div>
            <Label className="text-sm font-medium">Vorlage</Label>
            <div className="flex gap-2 mt-2">
              {templates.filter((t) => t.show).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTemplate(t.key)}
                  className={`flex-1 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    template === t.key
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="block font-semibold">{t.icon} {t.label}</span>
                  <span className="text-xs text-muted-foreground">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

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

          {template === "professional" && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">🩺 Experten-Bericht enthält:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Dein Name als Ersteller: <strong>{profile?.display_name || "–"}</strong></li>
                <li>Deine Rolle: <strong>{profile?.sub_role ? roleLabel[profile.sub_role] || profile.sub_role : "–"}</strong></li>
                {profile?.certificates && profile.certificates.length > 0 && (
                  <li>Zertifikate: <strong>{profile.certificates.join(", ")}</strong></li>
                )}
              </ul>
              <p className="mt-2 text-[10px]">Der Bericht enthält den Vermerk: „KI-gestützte Analyse – ersetzt keine fachliche Begutachtung vor Ort."</p>
            </div>
          )}

          <Button onClick={generate} disabled={generating} className="w-full">
            {generating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Bericht wird erstellt…</>
            ) : (
              <><FileDown className="w-4 h-4 mr-2" /> PDF generieren</>
            )}
          </Button>

          <p className="text-[10px] text-muted-foreground/70 text-center">
            ⚖️ HufiAi ist eine KI-Assistenz. Dieser Bericht dient als Unterstützung – alle fachlichen Entscheidungen liegen beim Experten vor Ort. Nutzung auf eigenes Risiko.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
