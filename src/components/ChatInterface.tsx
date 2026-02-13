import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Create conversation if needed
      let convId = conversationId;
      if (!convId) {
        const { data, error } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title: input.trim().slice(0, 50) })
          .select("id")
          .single();
        if (error) throw error;
        convId = data.id;
        setConversationId(convId);
      }

      // Save user message
      await supabase.from("messages").insert({
        conversation_id: convId,
        role: "user",
        content: userMsg.content,
      });

      // Placeholder AI response (will connect Lovable AI later)
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
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Hallo! Wie kann ich helfen?</h2>
            <p className="text-muted-foreground max-w-md">
              Stelle mir eine Frage rund um Pferde, Hufpflege, Tiergesundheit oder dein Gewerbe.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8 max-w-lg">
              {[
                "Worauf achte ich bei der Hufpflege?",
                "Futterplan für ein Sportpferd",
                "Stallbau-Tipps für Offenstall",
                "Kundenmanagement-Tipps",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="p-3 rounded-xl border border-border bg-card text-sm text-left hover:border-primary/50 hover:bg-accent transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
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
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Nachricht eingeben..."
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
    </div>
  );
}
