import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileDown, Loader2, CalendarIcon, Files, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  conversationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Template = "report" | "proposal" | "guide" | "meeting" | "invoice" | "private" | "business" | "professional";
type DateRange = "all" | "today" | "week" | "custom";

const TEMPLATES: { key: Template; icon: string; label: string; desc: string; category: "standard" | "expert" }[] = [
  { key: "report", icon: "📋", label: "Report", desc: "Strukturierter Analysebericht", category: "standard" },
  { key: "proposal", icon: "💼", label: "Proposal", desc: "Angebot / Verkaufsdokument", category: "standard" },
  { key: "guide", icon: "📖", label: "Guide", desc: "Anleitung / Tutorial", category: "standard" },
  { key: "meeting", icon: "📝", label: "Meeting Notes", desc: "Gesprächsnotizen & Aktionspunkte", category: "standard" },
  { key: "invoice", icon: "🧾", label: "Kostenvoranschlag", desc: "Offerte / Quote", category: "standard" },
  { key: "private", icon: "🐴", label: "Privat", desc: "Einfach, verständlich", category: "standard" },
  { key: "business", icon: "🏢", label: "Business", desc: "Formal, mit Firmendaten", category: "expert" },
  { key: "professional", icon: "🩺", label: "Experten-Bericht", desc: "Mit Branding & Zertifikaten", category: "expert" },
];

export default function PdfExportDialog({ conversationId, open, onOpenChange }: Props) {
  const { profile, user } = useAuth();
  const isExpert = profile?.sub_role && ["hufbearbeiter", "tierarzt", "stallbetreiber"].includes(profile.sub_role);

  // Template & basic info
  const [template, setTemplate] = useState<Template>("report");
  const [horseName, setHorseName] = useState("");
  const [horseBreed, setHorseBreed] = useState("");
  const [horseAge, setHorseAge] = useState("");
  const [ownerName, setOwnerName] = useState(profile?.display_name || "");

  // Date range
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  // Export options
  const [includePrompts, setIncludePrompts] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [addWatermark, setAddWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState("VERTRAULICH");
  const [compressImages, setCompressImages] = useState(false);
  const [includeToc, setIncludeToc] = useState(true);

  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [conversations, setConversations] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>(conversationId ? [conversationId] : []);
  const [batchAction, setBatchAction] = useState<"individual" | "combined">("individual");
  const [loadingConvs, setLoadingConvs] = useState(false);

  const [generating, setGenerating] = useState(false);

  // Load conversations for batch mode
  useEffect(() => {
    if (!batchMode || !user) return;
    setLoadingConvs(true);
    supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setConversations(data || []);
        setLoadingConvs(false);
      });
  }, [batchMode, user]);

  const roleLabel: Record<string, string> = {
    hufbearbeiter: "Hufbearbeiter",
    tierarzt: "Tierarzt",
    stallbetreiber: "Stallbetreiber",
  };

  const getDateFilter = () => {
    if (dateRange === "all") return {};
    const now = new Date();
    if (dateRange === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { date_from: start.toISOString(), date_to: now.toISOString() };
    }
    if (dateRange === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { date_from: start.toISOString(), date_to: now.toISOString() };
    }
    if (dateRange === "custom") {
      return {
        date_from: customFrom?.toISOString(),
        date_to: customTo?.toISOString() || now.toISOString(),
      };
    }
    return {};
  };

  const generate = async () => {
    const ids = batchMode ? selectedConvIds : (conversationId ? [conversationId] : []);
    if (ids.length === 0) { toast.error("Kein Chat ausgewählt"); return; }
    setGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Nicht eingeloggt");

      const payload = {
        conversation_ids: ids,
        batch_action: batchMode ? batchAction : "individual",
        template,
        horse_name: horseName || undefined,
        horse_breed: horseBreed || undefined,
        horse_age: horseAge || undefined,
        owner_name: ownerName || undefined,
        include_prompts: includePrompts,
        include_metadata: includeMetadata,
        include_toc: includeToc,
        watermark: addWatermark ? watermarkText : undefined,
        compress_images: compressImages,
        ...getDateFilter(),
        ...(template === "professional" ? {
          expert_name: profile?.display_name || undefined,
          expert_title: profile?.sub_role ? roleLabel[profile.sub_role] || profile.sub_role : undefined,
          expert_certificates: profile?.certificates || undefined,
        } : {}),
      };

      const res = await supabase.functions.invoke("generate-pdf", { body: payload });
      if (res.error) throw res.error;

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = batchMode && batchAction === "combined"
        ? `Hufi-Sammelexport-${Date.now()}.pdf`
        : `Hufi-${template}-${(ids[0] || "").slice(0, 8)}.pdf`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`PDF erfolgreich erstellt! (${ids.length} Chat${ids.length > 1 ? "s" : ""})`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "PDF konnte nicht erstellt werden");
    } finally {
      setGenerating(false);
    }
  };

  const toggleConvSelection = (id: string) => {
    setSelectedConvIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            PDF Export
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="template" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="template" className="text-xs">📄 Vorlage</TabsTrigger>
            <TabsTrigger value="options" className="text-xs"><Settings2 className="w-3 h-3 mr-1" /> Optionen</TabsTrigger>
            <TabsTrigger value="batch" className="text-xs"><Files className="w-3 h-3 mr-1" /> Batch</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">👁 Vorschau</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-2">
            {/* TEMPLATE TAB */}
            <TabsContent value="template" className="space-y-4 mt-2">
              <div>
                <Label className="text-sm font-medium">Vorlage wählen</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {TEMPLATES.filter(t => t.category === "standard" || (t.key === "professional" ? isExpert : true)).map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTemplate(t.key)}
                      className={cn(
                        "px-3 py-2.5 rounded-xl border-2 text-left text-sm transition-all",
                        template === t.key
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="block font-semibold text-xs">{t.icon} {t.label}</span>
                      <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stammdaten */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Pferdename</Label>
                  <Input value={horseName} onChange={e => setHorseName(e.target.value)} placeholder="z.B. Stella" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Rasse</Label>
                  <Input value={horseBreed} onChange={e => setHorseBreed(e.target.value)} placeholder="z.B. Warmblut" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Alter</Label>
                  <Input value={horseAge} onChange={e => setHorseAge(e.target.value)} placeholder="z.B. 12 Jahre" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Besitzer</Label>
                  <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Name" className="mt-1 h-8 text-sm" />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <Label className="text-sm font-medium">Zeitraum</Label>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Nachrichten</SelectItem>
                    <SelectItem value="today">Heute</SelectItem>
                    <SelectItem value="week">Letzte 7 Tage</SelectItem>
                    <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                  </SelectContent>
                </Select>
                {dateRange === "custom" && (
                  <div className="flex gap-2 mt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("w-full justify-start text-xs", !customFrom && "text-muted-foreground")}>
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {customFrom ? format(customFrom, "dd.MM.yyyy") : "Von"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("w-full justify-start text-xs", !customTo && "text-muted-foreground")}>
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {customTo ? format(customTo, "dd.MM.yyyy") : "Bis"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={customTo} onSelect={setCustomTo} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {template === "professional" && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">🩺 Experten-Bericht enthält:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Name: <strong>{profile?.display_name || "–"}</strong></li>
                    <li>Rolle: <strong>{profile?.sub_role ? roleLabel[profile.sub_role] || profile.sub_role : "–"}</strong></li>
                    {profile?.certificates && profile.certificates.length > 0 && (
                      <li>Zertifikate: <strong>{profile.certificates.join(", ")}</strong></li>
                    )}
                  </ul>
                </div>
              )}
            </TabsContent>

            {/* OPTIONS TAB */}
            <TabsContent value="options" className="space-y-4 mt-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Nutzer-Prompts einschließen</Label>
                    <p className="text-[10px] text-muted-foreground">Zeigt User-Nachrichten im PDF</p>
                  </div>
                  <Switch checked={includePrompts} onCheckedChange={setIncludePrompts} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Metadaten einschließen</Label>
                    <p className="text-[10px] text-muted-foreground">Datum, Modell, Conversation-ID</p>
                  </div>
                  <Switch checked={includeMetadata} onCheckedChange={setIncludeMetadata} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Inhaltsverzeichnis</Label>
                    <p className="text-[10px] text-muted-foreground">Auto-generiertes TOC auf Seite 1</p>
                  </div>
                  <Switch checked={includeToc} onCheckedChange={setIncludeToc} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Wasserzeichen</Label>
                    <p className="text-[10px] text-muted-foreground">Diagonaler Text auf jeder Seite</p>
                  </div>
                  <Switch checked={addWatermark} onCheckedChange={setAddWatermark} />
                </div>
                {addWatermark && (
                  <Input
                    value={watermarkText}
                    onChange={e => setWatermarkText(e.target.value)}
                    placeholder="VERTRAULICH"
                    className="h-8 text-sm"
                  />
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Bilder komprimieren</Label>
                    <p className="text-[10px] text-muted-foreground">Kleinere Dateigröße für Email</p>
                  </div>
                  <Switch checked={compressImages} onCheckedChange={setCompressImages} />
                </div>
              </div>
            </TabsContent>

            {/* BATCH TAB */}
            <TabsContent value="batch" className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Batch-Modus</Label>
                  <p className="text-[10px] text-muted-foreground">Mehrere Chats gleichzeitig exportieren</p>
                </div>
                <Switch checked={batchMode} onCheckedChange={setBatchMode} />
              </div>

              {batchMode && (
                <>
                  <Select value={batchAction} onValueChange={v => setBatchAction(v as "individual" | "combined")}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Einzelne PDFs</SelectItem>
                      <SelectItem value="combined">Kombiniertes PDF</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="border border-border rounded-xl p-2 max-h-40 overflow-y-auto space-y-1">
                    {loadingConvs ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : conversations.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Keine Chats gefunden</p>
                    ) : (
                      conversations.map(c => (
                        <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent cursor-pointer text-xs">
                          <Checkbox
                            checked={selectedConvIds.includes(c.id)}
                            onCheckedChange={() => toggleConvSelection(c.id)}
                          />
                          <span className="truncate flex-1">{c.title || "Unbenannt"}</span>
                          <span className="text-muted-foreground text-[10px] shrink-0">
                            {new Date(c.updated_at).toLocaleDateString("de-DE")}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{selectedConvIds.length} Chat(s) ausgewählt</p>
                </>
              )}
            </TabsContent>

            {/* PREVIEW TAB */}
            <TabsContent value="preview" className="space-y-3 mt-2">
              <div className="border border-border rounded-xl overflow-hidden bg-background">
                <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground">HTML-Vorschau</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{template}</span>
                </div>
                <div className="p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                  <div className="space-y-3 text-xs">
                    <div className="text-center pb-3 border-b border-border">
                      <p className="text-lg font-bold text-primary">🐴 Hufi {TEMPLATES.find(t => t.key === template)?.label}</p>
                      {horseName && <p className="text-muted-foreground">Pferd: <strong>{horseName}</strong>{horseBreed ? ` (${horseBreed})` : ""}{horseAge ? `, ${horseAge}` : ""}</p>}
                      {ownerName && <p className="text-muted-foreground">Besitzer: {ownerName}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                    {includeToc && (
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <p className="font-medium mb-1">📑 Inhaltsverzeichnis</p>
                        <p className="text-muted-foreground">1. Zusammenfassung</p>
                        <p className="text-muted-foreground">2. Hauptinhalt</p>
                        <p className="text-muted-foreground">3. Fazit</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="font-medium">1. Zusammenfassung</p>
                      <p className="text-muted-foreground leading-relaxed">KI-generierte Zusammenfassung des Chat-Verlaufs wird hier angezeigt...</p>
                      {includePrompts && (
                        <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="text-[10px] text-primary font-medium">👤 Beispiel-Prompt</p>
                          <p className="text-muted-foreground">Wie pflege ich die Hufe meines Pferdes richtig?</p>
                        </div>
                      )}
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <p className="text-[10px] font-medium">🤖 Hufi Antwort</p>
                        <p className="text-muted-foreground">Ausführliche Antwort mit Fachterminologie...</p>
                      </div>
                    </div>
                    {addWatermark && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                        <p className="text-4xl font-bold text-foreground rotate-[-30deg]">{watermarkText}</p>
                      </div>
                    )}
                    {includeMetadata && (
                      <div className="pt-2 border-t border-border text-[10px] text-muted-foreground">
                        <p>Modell: gemini-2.5-flash • Exportiert: {new Date().toLocaleString("de-DE")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Dies ist eine vereinfachte Vorschau. Das finale PDF kann abweichen.
              </p>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="pt-3 border-t border-border space-y-2">
          <Button onClick={generate} disabled={generating} className="w-full">
            {generating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> PDF wird erstellt…</>
            ) : (
              <><FileDown className="w-4 h-4 mr-2" /> PDF generieren {batchMode && selectedConvIds.length > 1 ? `(${selectedConvIds.length})` : ""}</>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground/70 text-center">
            ⚖️ KI-Assistenz – ersetzt keine fachliche Beratung. Nutzung auf eigenes Risiko.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
