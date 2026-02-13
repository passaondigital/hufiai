import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, Loader2, FileDown, ChevronDown, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PdfExportDialog from "@/components/PdfExportDialog";
import UpsellModal from "@/components/UpsellModal";
import { useSubscription } from "@/hooks/useSubscription";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface HorseOption {
  id: string;
  name: string;
  breed: string | null;
  known_issues: string | null;
  hoof_type: string | null;
  keeping_type: string | null;
  ai_summary: string | null;
  is_primary: boolean;
}

export default function ChatInterface() {
  const { user, profile } = useAuth();
  const { isFounderFlowActive, founderFlowDaysLeft, hasGewerbeAccess } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [horses, setHorses] = useState<HorseOption[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<HorseOption | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch all horses
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_horses")
      .select("id, name, breed, known_issues, hoof_type, keeping_type, ai_summary, is_primary")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const horseList = data as HorseOption[];
          setHorses(horseList);
          // Auto-select primary horse
          const primary = horseList.find((h) => h.is_primary) || horseList[0];
          setSelectedHorse(primary);
          // Show selector if multiple horses
          if (horseList.length > 1) setShowSelector(true);
        }
      });
  }, [user]);

  const displayName = profile?.display_name || "du";
  const greeting = selectedHorse
    ? `Hallo ${displayName}! Wie geht es ${selectedHorse.name} heute?`
    : `Hallo ${displayName}! Wie kann ich dir helfen?`;

  const horseContext = selectedHorse
    ? `🐴 ${selectedHorse.name}${selectedHorse.breed ? ` (${selectedHorse.breed})` : ""}${selectedHorse.hoof_type ? ` · ${selectedHorse.hoof_type === "barefoot" ? "Barhuf" : selectedHorse.hoof_type === "shod" ? "Beschlagen" : "Alternativ"}` : ""}${selectedHorse.known_issues ? ` · Bekannt: ${selectedHorse.known_issues}` : ""}${selectedHorse.ai_summary ? ` · KI: ${selectedHorse.ai_summary}` : ""}`
    : null;

  const sendMessage = async () => {
    if (!input.trim() || !user || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let convId = conversationId;
      if (!convId) {
        const insertData: any = { user_id: user.id, title: input.trim().slice(0, 50) };
        if (selectedHorse) insertData.horse_id = selectedHorse.id;
        const { data, error } = await supabase
          .from("conversations")
          .insert(insertData)
          .select("id")
          .single();
        if (error) throw error;
        convId = data.id;
        setConversationId(convId);
        setShowSelector(false); // Lock horse selection after first message
      }

      await supabase.from("messages").insert({
        conversation_id: convId,
        role: "user",
        content: userMsg.content,
      });

      // Placeholder AI response
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Danke für deine Nachricht! Die KI-Anbindung wird in Kürze aktiviert. Aktuell wird dein Chat gespeichert und du kannst die Oberfläche erkunden.",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      await supabase.from("messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: assistantMsg.content,
      });
    } catch (err: any) {
      toast.error(err.message || "Nachricht konnte nicht gesendet werden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Horse selector bar */}
      {horses.length > 1 && showSelector && messages.length === 0 && (
        <div className="border-b border-border px-6 py-3 bg-card/50">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Mit welchem Pferd arbeiten wir heute?</p>
          <div className="flex gap-2 flex-wrap">
            {horses.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHorse(h)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                  selectedHorse?.id === h.id
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                }`}
              >
                <span>🐴</span>
                <span>{h.name}</span>
                {h.is_primary && <span className="text-[10px] bg-primary/20 px-1.5 py-0.5 rounded-full">Haupt</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active horse context indicator */}
      {selectedHorse && messages.length > 0 && (
        <div className="px-6 py-2 border-b border-border bg-primary/5 flex items-center gap-2 text-xs text-primary">
          <span>🐴</span>
          <span className="font-medium">{selectedHorse.name}</span>
          {selectedHorse.breed && <span className="text-muted-foreground">({selectedHorse.breed})</span>}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{greeting}</h2>
            {horseContext && (
              <p className="text-sm text-primary/80 bg-primary/5 px-4 py-2 rounded-xl mb-4 max-w-lg">
                {horseContext}
              </p>
            )}
            <p className="text-muted-foreground max-w-md">
              {profile?.user_type === "gewerbe"
                ? "Berichte erstellen, Projekte analysieren oder Content für Social Media generieren."
                : selectedHorse
                  ? `Stelle mir eine Frage zu ${selectedHorse.name} – ich kenne die Historie.`
                  : "Stelle mir eine Frage rund um Pferde, Hufpflege oder Tiergesundheit."}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8 max-w-lg">
              {(profile?.user_type === "gewerbe"
                ? [
                    { label: "Kundenbericht erstellen", business: true },
                    { label: "Projekt-Analyse", business: true },
                    { label: "Social Media Hook generieren", business: true },
                    { label: "Fachbegriffe erklären", business: false },
                  ]
                : selectedHorse
                  ? [
                      { label: `Hufpflege-Check für ${selectedHorse.name}`, business: false },
                      { label: `Futterplan für ${selectedHorse.name}`, business: false },
                      { label: "Tipps für den Offenstall", business: false },
                      { label: `${selectedHorse.name}: Wann nächster Beschlag?`, business: false },
                    ]
                  : [
                      { label: "Hufpflege-Check", business: false },
                      { label: "Futterplan erstellen", business: false },
                      { label: "Tipps für den Offenstall", business: false },
                      { label: "Mein erstes Pferd – was brauche ich?", business: false },
                    ]
              ).map((q) => (
                <button
                  key={q.label}
                  onClick={() => {
                    if (q.business && !hasGewerbeAccess) {
                      setUpsellFeature(q.label);
                      setUpsellOpen(true);
                    } else {
                      setInput(q.label);
                    }
                  }}
                  className="p-3 rounded-xl border border-border bg-card text-sm text-left hover:border-primary/50 hover:bg-accent transition-all"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Founder Flow CTA for Privat users */}
            {profile?.user_type === "privat" && !hasGewerbeAccess && (
              <button
                onClick={() => setUpsellOpen(true)}
                className="mt-6 flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all"
              >
                <Crown className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-semibold">HufiAi Founder Flow starten</p>
                  <p className="text-xs text-muted-foreground">30 Tage Gewerbe Pro kostenlos testen</p>
                </div>
              </button>
            )}

            {/* Founder Flow active badge */}
            {isFounderFlowActive && (
              <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm">
                <Crown className="w-4 h-4" />
                <span className="font-medium">Founder Flow aktiv – noch {founderFlowDaysLeft} Tage</span>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0s" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 bg-card rounded-2xl border border-border px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
            {conversationId && messages.length > 0 && (
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 shrink-0" onClick={() => setPdfOpen(true)} title="Als PDF exportieren">
                <FileDown className="w-4 h-4" />
              </Button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={selectedHorse ? `Frage zu ${selectedHorse.name}...` : "Nachricht eingeben..."}
              className="flex-1 bg-transparent text-sm outline-none py-1.5 placeholder:text-muted-foreground"
            />
            <Button onClick={sendMessage} size="icon" disabled={!input.trim() || loading} className="rounded-xl h-9 w-9">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            HufiAi kann Fehler machen. Überprüfe wichtige Informationen.
          </p>
        </div>
      </div>

      <PdfExportDialog conversationId={conversationId} open={pdfOpen} onOpenChange={setPdfOpen} />
      <UpsellModal open={upsellOpen} onOpenChange={setUpsellOpen} featureName={upsellFeature} />
    </div>
  );
}
