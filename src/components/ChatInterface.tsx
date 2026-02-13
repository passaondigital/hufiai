import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, Loader2, FileDown, Crown, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PdfExportDialog from "@/components/PdfExportDialog";
import UpsellModal from "@/components/UpsellModal";
import { useSubscription } from "@/hooks/useSubscription";
import ReactMarkdown from "react-markdown";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: AttachmentPreview[];
}

interface AttachmentPreview {
  id?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url?: string;
  extractedText?: string;
  status: "uploading" | "extracting" | "ready" | "error";
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

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "text/plain", "text/markdown", "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".txt", ".md", ".csv", ".json", ".docx"];

export default function ChatInterface() {
  const { user, profile } = useAuth();
  const { isFounderFlowActive, founderFlowDaysLeft, hasGewerbeAccess, hasUnlimitedUploads } = useSubscription();
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
  const [pendingFiles, setPendingFiles] = useState<AttachmentPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          const primary = horseList.find((h) => h.is_primary) || horseList[0];
          setSelectedHorse(primary);
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

  const checkUploadLimit = async (): Promise<boolean> => {
    if (hasUnlimitedUploads) return true;
    if (!user) return false;
    const monthYear = new Date().toISOString().slice(0, 7);
    const { data } = await supabase
      .from("upload_usage")
      .select("upload_count")
      .eq("user_id", user.id)
      .eq("month_year", monthYear)
      .maybeSingle();
    const currentCount = data?.upload_count || 0;
    if (currentCount >= 3) {
      setUpsellFeature("Mehr als 3 Datei-Analysen pro Monat");
      setUpsellOpen(true);
      return false;
    }
    return true;
  };

  const incrementUploadCount = async () => {
    if (!user || hasUnlimitedUploads) return;
    const monthYear = new Date().toISOString().slice(0, 7);
    const { data: existing } = await supabase
      .from("upload_usage")
      .select("id, upload_count")
      .eq("user_id", user.id)
      .eq("month_year", monthYear)
      .maybeSingle();
    if (existing) {
      await supabase.from("upload_usage").update({ upload_count: existing.upload_count + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("upload_usage").insert({ user_id: user.id, month_year: monthYear, upload_count: 1 });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check upload limit before proceeding
    const allowed = await checkUploadLimit();
    if (!allowed) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const validFiles: AttachmentPreview[] = [];
    for (const file of files) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: Datei zu groß (max. 20MB)`);
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(`${file.name}: Dateityp nicht unterstützt`);
        continue;
      }
      validFiles.push({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        status: "uploading",
      });
    }

    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles]);
      uploadFiles(files.filter((f) => {
        const ext = "." + f.name.split(".").pop()?.toLowerCase();
        return f.size <= MAX_FILE_SIZE && (ALLOWED_TYPES.includes(f.type) || ALLOWED_EXTENSIONS.includes(ext));
      }));
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFiles = async (files: File[]) => {
    if (!user) return;
    setUploading(true);

    for (const file of files) {
      const filePath = `${user.id}/${crypto.randomUUID()}_${file.name}`;

      try {
        // Upload to storage
        const { error: uploadErr } = await supabase.storage
          .from("chat-attachments")
          .upload(filePath, file);

        if (uploadErr) throw uploadErr;

        // Create attachment record
        const { data: attachment, error: insertErr } = await supabase
          .from("chat_attachments")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
            extraction_status: "pending",
          })
          .select("id")
          .single();

        if (insertErr) throw insertErr;

        // Update pending file with id and status
        setPendingFiles((prev) =>
          prev.map((pf) =>
            pf.fileName === file.name && pf.status === "uploading"
              ? { ...pf, id: attachment.id, status: "extracting" }
              : pf
          )
        );

        // Trigger text extraction
        const { data: extractData, error: extractErr } = await supabase.functions.invoke("extract-text", {
          body: { attachment_id: attachment.id },
        });

        if (extractErr) {
          console.error("Extraction error:", extractErr);
          setPendingFiles((prev) =>
            prev.map((pf) =>
              pf.id === attachment.id ? { ...pf, status: "ready" } : pf
            )
          );
        } else {
          // Increment usage counter on successful extraction
          await incrementUploadCount();
          setPendingFiles((prev) =>
            prev.map((pf) =>
              pf.id === attachment.id
                ? { ...pf, extractedText: extractData?.extracted_text || "", status: "ready" }
                : pf
            )
          );
        }
      } catch (err: any) {
        console.error("Upload error:", err);
        toast.error(`Upload fehlgeschlagen: ${file.name}`);
        setPendingFiles((prev) =>
          prev.map((pf) =>
            pf.fileName === file.name && (pf.status === "uploading" || pf.status === "extracting")
              ? { ...pf, status: "error" }
              : pf
          )
        );
      }
    }

    setUploading(false);
  };

  const removePendingFile = (fileName: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.fileName !== fileName));
  };

  const sendMessage = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || !user || loading) return;

    // Build message content including attachment context
    let fullContent = input.trim();
    const attachments = [...pendingFiles.filter((f) => f.status === "ready" || f.status === "error")];
    let fileCtx = "";

    if (attachments.length > 0) {
      const attachmentContext = attachments
        .map((a) => {
          if (a.extractedText) {
            return `\n\n📎 Datei: ${a.fileName}\n--- Inhalt ---\n${a.extractedText.slice(0, 4000)}\n--- Ende ---`;
          }
          return `\n\n📎 Datei: ${a.fileName} (${a.fileType}, ${(a.fileSize / 1024).toFixed(0)} KB)`;
        })
        .join("");
      fullContent += attachmentContext;
      fileCtx = attachments
        .filter((a) => a.extractedText)
        .map((a) => `${a.fileName}: ${a.extractedText?.slice(0, 2000)}`)
        .join("\n---\n");
    }

    // Show disclaimer as first message in new chats
    const isNewChat = messages.length === 0;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim() || `📎 ${attachments.map((a) => a.fileName).join(", ")}`,
      attachments,
    };

    let currentMessages: Message[];
    if (isNewChat) {
      const disclaimerMsg: Message = {
        id: "disclaimer",
        role: "assistant",
        content: "⚖️ **Hinweis:** HufiAi ist eine KI-Assistenz zur Unterstützung. Informationen ersetzen keine fachliche Beratung durch Tierärzte, Huf-Experten oder Juristen. Nutzung auf eigenes Risiko.\n\nBasierend auf den vorliegenden Informationen unterstütze ich dich gerne – in Zusammenarbeit mit Fachleuten vor Ort. Wie kann ich dir helfen?",
      };
      currentMessages = [disclaimerMsg, userMsg];
      setMessages(currentMessages);
    } else {
      currentMessages = [...messages, userMsg];
      setMessages(currentMessages);
    }
    setInput("");
    setPendingFiles([]);
    setLoading(true);

    try {
      let convId = conversationId;
      if (!convId) {
        const insertData: any = { user_id: user.id, title: (input.trim() || "Datei-Upload").slice(0, 50) };
        if (selectedHorse) insertData.horse_id = selectedHorse.id;
        const { data, error } = await supabase
          .from("conversations")
          .insert(insertData)
          .select("id")
          .single();
        if (error) throw error;
        convId = data.id;
        setConversationId(convId);
        setShowSelector(false);
      }

      // Link attachments to conversation
      for (const att of attachments) {
        if (att.id) {
          await supabase
            .from("chat_attachments")
            .update({ conversation_id: convId })
            .eq("id", att.id);
        }
      }

      await supabase.from("messages").insert({
        conversation_id: convId,
        role: "user",
        content: fullContent,
      });

      // Build AI messages from conversation history (excluding disclaimer)
      const aiMessages = currentMessages
        .filter((m) => m.id !== "disclaimer")
        .map((m) => ({ role: m.role, content: m.content }));

      // Determine if training should be logged
      const shouldLog = profile?.is_data_contribution_active && !profile?.exclude_from_training;

      // Stream from AI
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: aiMessages,
          conversation_id: convId,
          horse_context: horseContext || undefined,
          user_type: profile?.user_type || "privat",
          log_training: shouldLog,
          user_id: shouldLog ? user.id : undefined,
          file_context: shouldLog && fileCtx ? fileCtx.slice(0, 4000) : undefined,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Fehler ${resp.status}`);
      }

      if (!resp.body) throw new Error("Kein Stream erhalten");

      // Stream tokens
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;
      const assistantId = crypto.randomUUID();

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { id: assistantId, role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m)));
            }
          } catch { /* ignore */ }
        }
      }

      // Save final assistant message to DB
      if (assistantSoFar) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: assistantSoFar,
          model: "google/gemini-3-flash-preview",
        });
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      toast.error(err.message || "Nachricht konnte nicht gesendet werden");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
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
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                  {/* Show attachment badges */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-primary-foreground/20">
                      {msg.attachments.map((att, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-foreground/10 text-xs">
                          {getFileIcon(att.fileType)}
                          {att.fileName}
                        </span>
                      ))}
                    </div>
                  )}
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

      {/* Pending files preview */}
      {pendingFiles.length > 0 && (
        <div className="border-t border-border px-4 py-2 bg-card/50">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
            {pendingFiles.map((file, i) => (
              <div
                key={`${file.fileName}-${i}`}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                  file.status === "error"
                    ? "border-destructive/50 bg-destructive/5 text-destructive"
                    : file.status === "ready"
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {file.status === "uploading" || file.status === "extracting" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  getFileIcon(file.fileType)
                )}
                <span className="max-w-[150px] truncate">{file.fileName}</span>
                {file.status === "extracting" && <span className="text-[10px]">Analysiere…</span>}
                {file.status === "ready" && file.extractedText && (
                  <span className="text-[10px] text-primary">✓ Analysiert</span>
                )}
                <button
                  onClick={() => removePendingFile(file.fileName)}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 bg-card rounded-2xl border border-border px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
            {conversationId && messages.length > 0 && (
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 shrink-0" onClick={() => setPdfOpen(true)} title="Als PDF exportieren">
                <FileDown className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-9 w-9 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Datei anhängen (PDF, Bild, Text)"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.txt,.md,.csv,.json,.docx"
              onChange={handleFileSelect}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={selectedHorse ? `Frage zu ${selectedHorse.name}...` : "Nachricht eingeben..."}
              className="flex-1 bg-transparent text-sm outline-none py-1.5 placeholder:text-muted-foreground"
            />
            <Button
              onClick={sendMessage}
              size="icon"
              disabled={(!input.trim() && pendingFiles.filter((f) => f.status === "ready").length === 0) || loading}
              className="rounded-xl h-9 w-9"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2 max-w-lg mx-auto leading-relaxed">
            ⚖️ HufiAi ist eine KI-Assistenz zur Unterstützung. Informationen ersetzen keine fachliche Beratung durch Tierärzte, Huf-Experten oder Juristen. Nutzung auf eigenes Risiko.
          </p>
        </div>
      </div>

      <PdfExportDialog conversationId={conversationId} open={pdfOpen} onOpenChange={setPdfOpen} />
      <UpsellModal open={upsellOpen} onOpenChange={setUpsellOpen} featureName={upsellFeature} />
    </div>
  );
}
