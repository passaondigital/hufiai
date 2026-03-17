import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Crown } from "lucide-react";
import { toast } from "sonner";
import PdfExportDialog from "@/components/PdfExportDialog";
import ChatExportMenu from "@/components/ChatExportMenu";
import EcosystemWidget from "@/components/EcosystemWidget";
import UpsellModal from "@/components/UpsellModal";
import { useSubscription } from "@/hooks/useSubscription";
import OmniBox, { type AiMode } from "@/components/omni/OmniBox";
import MessageBubble, { type MessageVersion } from "@/components/omni/MessageBubble";
import { generateSmartChips, detectMode } from "@/components/omni/SmartChipEngine";
import HistorySidebar from "@/components/omni/HistorySidebar";
import AssetLibrary from "@/components/omni/AssetLibrary";
import FavoritePromptChips from "@/components/prompts/FavoritePromptChips";
import { useIsMobile } from "@/hooks/use-mobile";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: AttachmentPreview[];
  versions?: MessageVersion[];
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

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "text/plain", "text/markdown", "text/csv", "application/json", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".txt", ".md", ".csv", ".json", ".docx"];

export default function OmniInterface() {
  const { user, profile } = useAuth();
  const { lang } = useI18n();
  const isMobile = useIsMobile();
  const location = useLocation();
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
  const [activeMode, setActiveMode] = useState<AiMode>("auto");
  const [provider, setProvider] = useState<"lovable" | "claude">("lovable");
  const [historySidebarCollapsed, setHistorySidebarCollapsed] = useState(false);
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Handle prefilled prompt from Prompt Library navigation
  useEffect(() => {
    const state = location.state as { prefillPrompt?: string } | null;
    if (state?.prefillPrompt) {
      setInput(state.prefillPrompt);
      // Clear the state so it doesn't persist
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch horses
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
          const primary = horseList.find(h => h.is_primary) || horseList[0];
          setSelectedHorse(primary);
          if (horseList.length > 1) setShowSelector(true);
        }
      });
  }, [user]);

  // Favorite prompts handled by FavoritePromptChips component

  const displayName = profile?.display_name || "du";
  const greeting = lang === "de"
    ? (selectedHorse ? `Hallo ${displayName}! Wie geht es ${selectedHorse.name} heute?` : `Hallo ${displayName}! Wie kann ich dir helfen?`)
    : (selectedHorse ? `Hello ${displayName}! How is ${selectedHorse.name} doing today?` : `Hello ${displayName}! How can I help you?`);

  const horseContext = selectedHorse
    ? `🐴 ${selectedHorse.name}${selectedHorse.breed ? ` (${selectedHorse.breed})` : ""}${selectedHorse.hoof_type ? ` · ${selectedHorse.hoof_type === "barefoot" ? "Barhuf" : selectedHorse.hoof_type === "shod" ? "Beschlagen" : "Alternativ"}` : ""}${selectedHorse.known_issues ? ` · Bekannt: ${selectedHorse.known_issues}` : ""}${selectedHorse.ai_summary ? ` · KI: ${selectedHorse.ai_summary}` : ""}`
    : null;

  // Smart chips
  const lastAssistantMsg = messages.filter(m => m.role === "assistant").pop()?.content;
  const smartChips = generateSmartChips({
    userType: profile?.user_type || null,
    horseName: selectedHorse?.name,
    hasConversation: messages.length > 0,
    lastAssistantMessage: lastAssistantMsg,
    lang,
  });

  const checkUploadLimit = async (): Promise<boolean> => {
    if (hasUnlimitedUploads) return true;
    if (!user) return false;
    const monthYear = new Date().toISOString().slice(0, 7);
    const { data } = await supabase.from("upload_usage").select("upload_count").eq("user_id", user.id).eq("month_year", monthYear).maybeSingle();
    if ((data?.upload_count || 0) >= 3) {
      setUpsellFeature(lang === "de" ? "Mehr als 3 Datei-Analysen pro Monat" : "More than 3 file analyses per month");
      setUpsellOpen(true);
      return false;
    }
    return true;
  };

  const incrementUploadCount = async () => {
    if (!user || hasUnlimitedUploads) return;
    const monthYear = new Date().toISOString().slice(0, 7);
    const { data: existing } = await supabase.from("upload_usage").select("id, upload_count").eq("user_id", user.id).eq("month_year", monthYear).maybeSingle();
    if (existing) {
      await supabase.from("upload_usage").update({ upload_count: existing.upload_count + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("upload_usage").insert({ user_id: user.id, month_year: monthYear, upload_count: 1 });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const allowed = await checkUploadLimit();
    if (!allowed) { e.target.value = ""; return; }

    const validFiles: AttachmentPreview[] = [];
    for (const file of files) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (file.size > MAX_FILE_SIZE) { toast.error(`${file.name}: ${lang === "de" ? "Datei zu groß (max. 20MB)" : "File too large (max 20MB)"}`); continue; }
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) { toast.error(`${file.name}: ${lang === "de" ? "Dateityp nicht unterstützt" : "File type not supported"}`); continue; }
      validFiles.push({ fileName: file.name, fileType: file.type, fileSize: file.size, status: "uploading" });
    }

    if (validFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...validFiles]);
      uploadFiles(files.filter(f => {
        const ext = "." + f.name.split(".").pop()?.toLowerCase();
        return f.size <= MAX_FILE_SIZE && (ALLOWED_TYPES.includes(f.type) || ALLOWED_EXTENSIONS.includes(ext));
      }));
    }
    e.target.value = "";
  };

  const uploadFiles = async (files: File[]) => {
    if (!user) return;
    setUploading(true);
    for (const file of files) {
      const filePath = `${user.id}/${crypto.randomUUID()}_${file.name}`;
      try {
        const { error: uploadErr } = await supabase.storage.from("chat-attachments").upload(filePath, file);
        if (uploadErr) throw uploadErr;
        const { data: attachment, error: insertErr } = await supabase.from("chat_attachments").insert({ user_id: user.id, file_name: file.name, file_type: file.type, file_size: file.size, storage_path: filePath, extraction_status: "pending" }).select("id").single();
        if (insertErr) throw insertErr;
        setPendingFiles(prev => prev.map(pf => pf.fileName === file.name && pf.status === "uploading" ? { ...pf, id: attachment.id, status: "extracting" } : pf));
        const { data: extractData, error: extractErr } = await supabase.functions.invoke("extract-text", { body: { attachment_id: attachment.id } });
        if (extractErr) {
          setPendingFiles(prev => prev.map(pf => pf.id === attachment.id ? { ...pf, status: "ready" } : pf));
        } else {
          await incrementUploadCount();
          setPendingFiles(prev => prev.map(pf => pf.id === attachment.id ? { ...pf, extractedText: extractData?.extracted_text || "", status: "ready" } : pf));
        }
      } catch (err: any) {
        toast.error(`Upload ${lang === "de" ? "fehlgeschlagen" : "failed"}: ${file.name}`);
        setPendingFiles(prev => prev.map(pf => pf.fileName === file.name && (pf.status === "uploading" || pf.status === "extracting") ? { ...pf, status: "error" } : pf));
      }
    }
    setUploading(false);
  };

  const removePendingFile = (fileName: string) => {
    setPendingFiles(prev => prev.filter(f => f.fileName !== fileName));
  };

  const handleChipClick = (chip: { label: string; prompt: string; mode?: AiMode }) => {
    setInput(chip.prompt);
    if (chip.mode && chip.mode !== "auto") setActiveMode(chip.mode);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setInput("");
    setPendingFiles([]);
    setActiveMode("auto");
    setShowSelector(horses.length > 1);
  };

  const loadConversation = async (id: string) => {
    setConversationId(id);
    setShowSelector(false);
    const { data } = await supabase.from("messages").select("id, role, content, created_at").eq("conversation_id", id).order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map(m => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || !user || loading) return;

    let fullContent = input.trim();
    const attachments = [...pendingFiles.filter(f => f.status === "ready" || f.status === "error")];
    let fileCtx = "";

    if (attachments.length > 0) {
      const attachmentContext = attachments.map(a => {
        if (a.extractedText) return `\n\n📎 Datei: ${a.fileName}\n--- Inhalt ---\n${a.extractedText.slice(0, 4000)}\n--- Ende ---`;
        return `\n\n📎 Datei: ${a.fileName} (${a.fileType}, ${(a.fileSize / 1024).toFixed(0)} KB)`;
      }).join("");
      fullContent += attachmentContext;
      fileCtx = attachments.filter(a => a.extractedText).map(a => `${a.fileName}: ${a.extractedText?.slice(0, 2000)}`).join("\n---\n");
    }

    // Auto-detect mode
    const resolvedMode = activeMode === "auto" ? detectMode(fullContent) : activeMode;

    const isNewChat = messages.length === 0;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim() || `📎 ${attachments.map(a => a.fileName).join(", ")}`,
      attachments,
    };

    let currentMessages: Message[];
    if (isNewChat) {
      const disclaimerMsg: Message = {
        id: "disclaimer",
        role: "assistant",
        content: lang === "de"
          ? "⚖️ **Hinweis:** HufiAi ist eine KI-Assistenz zur Unterstützung. Informationen ersetzen keine fachliche Beratung durch Tierärzte, Huf-Experten oder Juristen.\n\nWie kann ich dir helfen?"
          : "⚖️ **Note:** HufiAi is an AI assistant. Information does not replace professional advice from veterinarians, hoof experts or lawyers.\n\nHow can I help you?",
      };
      currentMessages = [disclaimerMsg, userMsg];
    } else {
      currentMessages = [...messages, userMsg];
    }
    setMessages(currentMessages);
    setInput("");
    setPendingFiles([]);
    setLoading(true);

    try {
      let convId = conversationId;
      if (!convId) {
        const insertData: any = { user_id: user.id, title: (input.trim() || "Upload").slice(0, 50) };
        if (selectedHorse) insertData.horse_id = selectedHorse.id;
        const { data, error } = await supabase.from("conversations").insert(insertData).select("id").single();
        if (error) throw error;
        convId = data.id;
        setConversationId(convId);
        setShowSelector(false);
      }

      for (const att of attachments) {
        if (att.id) await supabase.from("chat_attachments").update({ conversation_id: convId }).eq("id", att.id);
      }

      await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: fullContent });

      const aiMessages = currentMessages.filter(m => m.id !== "disclaimer").map(m => ({ role: m.role, content: m.content }));
      const shouldLog = profile?.is_data_contribution_active && !profile?.exclude_from_training;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(lang === "de" ? "Nicht authentifiziert" : "Not authenticated");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          messages: aiMessages,
          conversation_id: convId,
          horse_context: horseContext || undefined,
          user_type: profile?.user_type || "privat",
          log_training: shouldLog,
          user_id: shouldLog ? user.id : undefined,
          file_context: shouldLog && fileCtx ? fileCtx.slice(0, 4000) : undefined,
          mode: resolvedMode,
          provider: provider === "claude" ? "claude" : undefined,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `${lang === "de" ? "Fehler" : "Error"} ${resp.status}`);
      }

      if (!resp.body) throw new Error(lang === "de" ? "Kein Stream erhalten" : "No stream received");

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
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
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
              setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
            }
          } catch { /* ignore */ }
        }
      }

      if (assistantSoFar) {
        const modeModelMap: Record<string, string> = { scout: "google/gemini-2.5-flash", canvas: "google/gemini-3-flash-preview", analyst: "google/gemini-2.5-pro", agent: "google/gemini-3-flash-preview" };
        await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: assistantSoFar, model: modeModelMap[resolvedMode] || "google/gemini-3-flash-preview" });
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      toast.error(err.message || (lang === "de" ? "Nachricht konnte nicht gesendet werden" : "Message could not be sent"));
    } finally {
      setLoading(false);
    }
  };

  // === CHAT INTELLIGENCE HANDLERS ===

  const sendFollowUp = async (prompt: string) => {
    if (!user || loading) return;
    setInput(prompt);
    // Trigger send on next tick after input updates
    setTimeout(() => {
      const fakeEvent = { key: "Enter", shiftKey: false, preventDefault: () => {} };
      // Actually just call sendMessage directly with the prompt
    }, 0);
    // Simpler: just set input and let user see it, or auto-send
    setInput("");
    setLoading(true);

    try {
      let convId = conversationId;
      if (!convId) return;

      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: prompt };
      setMessages(prev => [...prev, userMsg]);

      await supabase.from("messages").insert({ conversation_id: convId, role: "user", content: prompt });

      const aiMessages = [...messages, userMsg]
        .filter(m => m.id !== "disclaimer")
        .map(m => ({ role: m.role, content: m.content }));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          messages: aiMessages,
          conversation_id: convId,
          horse_context: horseContext || undefined,
          user_type: profile?.user_type || "privat",
          provider: provider === "claude" ? "claude" : undefined,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Stream error");

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
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                return [...prev, { id: assistantId, role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { textBuffer = line + "\n" + textBuffer; break; }
        }
      }

      if (assistantSoFar) {
        await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: assistantSoFar, model: "google/gemini-3-flash-preview" });
      }
    } catch (err: any) {
      toast.error(err.message || "Fehler bei der Verarbeitung");
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    sendFollowUp(`Bitte verbessere und erweitere deine letzte Antwort. Mache sie präziser, detaillierter und professioneller. Hier ist die Antwort:\n\n${msg.content}`);
  };

  const handleSimplify = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    sendFollowUp(`Bitte vereinfache deine letzte Antwort. Mache sie kürzer, einfacher verständlich und auf den Punkt. Hier ist die Antwort:\n\n${msg.content}`);
  };

  const handleExtractActions = (content: string) => {
    sendFollowUp(`Extrahiere alle Action Items und To-Dos aus folgendem Text. Formatiere sie als nummerierte Checkliste mit klaren, umsetzbaren Schritten:\n\n${content}`);
  };

  const handleExtractInsights = (content: string) => {
    sendFollowUp(`Extrahiere die wichtigsten Erkenntnisse und Key Insights aus folgendem Text. Liste sie als Bullet Points auf:\n\n${content}`);
  };

  const handleCreateSummary = (content: string) => {
    sendFollowUp(`Erstelle eine kurze Zusammenfassung (TL;DR) des folgenden Textes in 2-3 Sätzen:\n\n${content}`);
  };

  const handleExtractAsChat = async (content: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: `Deep Dive: ${content.slice(0, 40)}...` })
        .select("id")
        .single();
      if (error) throw error;
      
      // Save the extracted content as the first message
      await supabase.from("messages").insert({ conversation_id: data.id, role: "assistant", content });
      
      toast.success("Neuer Chat erstellt! Wechsle zum Chat...");
      // Load the new conversation
      loadConversation(data.id);
    } catch (err: any) {
      toast.error("Chat konnte nicht erstellt werden");
    }
  };


  return (
    <div className="flex h-full w-full">
      {/* Left: History sidebar (hidden on mobile) */}
      {!isMobile && (
        <HistorySidebar
          activeConversationId={conversationId}
          onSelectConversation={loadConversation}
          onNewChat={handleNewChat}
          collapsed={historySidebarCollapsed}
          onCollapse={setHistorySidebarCollapsed}
        />
      )}

      {/* Center: Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Horse selector */}
        {horses.length > 1 && showSelector && messages.length === 0 && (
          <div className="border-b border-border px-6 py-3 bg-card/50">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              {lang === "de" ? "Mit welchem Pferd arbeiten wir heute?" : "Which horse are we working with today?"}
            </p>
            <div className="flex gap-2 flex-wrap">
              {horses.map(h => (
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
                  {h.is_primary && <span className="text-[10px] bg-primary/20 px-1.5 py-0.5 rounded-full">{lang === "de" ? "Haupt" : "Main"}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active horse indicator */}
        {selectedHorse && messages.length > 0 && (
          <div className="px-6 py-2 border-b border-border bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-primary">
              <span>🐴</span>
              <span className="font-medium">{selectedHorse.name}</span>
              {selectedHorse.breed && <span className="text-muted-foreground">({selectedHorse.breed})</span>}
            </div>
            <ChatExportMenu
              messages={messages.filter(m => m.id !== "disclaimer")}
              conversationId={conversationId}
              onExportPdf={() => setPdfOpen(true)}
            />
          </div>
        )}
        {!selectedHorse && messages.length > 0 && (
          <div className="px-6 py-2 border-b border-border flex items-center justify-end">
            <ChatExportMenu
              messages={messages.filter(m => m.id !== "disclaimer")}
              conversationId={conversationId}
              onExportPdf={() => setPdfOpen(true)}
            />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-lg">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">{greeting}</h1>
              {horseContext && (
                <p className="text-sm text-primary/80 bg-primary/5 px-4 py-2 rounded-xl mb-4 max-w-lg">{horseContext}</p>
              )}
              <p className="text-muted-foreground max-w-md mb-4">
                {lang === "de"
                  ? (profile?.user_type === "gewerbe"
                    ? "Berichte, Videos, Content – alles aus einer Box."
                    : "Frag mich alles rund ums Pferd. Text, Bild oder Sprache.")
                  : (profile?.user_type === "gewerbe"
                    ? "Reports, videos, content – all from one box."
                    : "Ask me anything about horses. Text, image or voice.")}
              </p>
              <div className="w-full max-w-md mb-4">
                <EcosystemWidget />
              </div>

              {/* Founder Flow CTA */}
              {profile?.user_type === "privat" && !hasGewerbeAccess && (
                <button
                  onClick={() => setUpsellOpen(true)}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all mb-4"
                >
                  <Crown className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">{lang === "de" ? "HufiAi Founder Flow starten" : "Start HufiAi Founder Flow"}</p>
                    <p className="text-xs text-muted-foreground">{lang === "de" ? "30 Tage Gewerbe Pro kostenlos testen" : "30 days Business Pro free trial"}</p>
                  </div>
                </button>
              )}
              {isFounderFlowActive && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm">
                  <Crown className="w-4 h-4" />
                  <span className="font-medium">
                    {lang === "de" ? `Founder Flow aktiv – noch ${founderFlowDaysLeft} Tage` : `Founder Flow active – ${founderFlowDaysLeft} days left`}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  attachments={msg.attachments}
                  messageId={msg.id}
                  versions={msg.versions}
                  onEdit={(id, newContent) => {
                    setMessages(prev => prev.map(m => {
                      if (m.id !== id) return m;
                      const prevVersions = m.versions || [{ content: m.content, timestamp: Date.now(), type: "original" as const }];
                      return { 
                        ...m, 
                        content: newContent, 
                        versions: [...prevVersions, { content: newContent, timestamp: Date.now(), type: "edit" as const }]
                      };
                    }));
                    if (conversationId) {
                      supabase.from("messages").update({ content: newContent }).eq("id", id).then(() => {});
                    }
                    // Re-generate after edit
                    const idx = messages.findIndex(m => m.id === id);
                    if (idx >= 0) {
                      setMessages(prev => prev.slice(0, idx + 1));
                      sendFollowUp(newContent);
                    }
                  }}
                  onRegenerate={(id) => {
                    const idx = messages.findIndex(m => m.id === id);
                    if (idx > 0) {
                      const lastUserMsg = messages.slice(0, idx).reverse().find(m => m.role === "user");
                      if (lastUserMsg) {
                        setMessages(prev => prev.slice(0, idx));
                        setInput(lastUserMsg.content);
                      }
                    }
                  }}
                  onImprove={handleImprove}
                  onSimplify={handleSimplify}
                  onExtractActions={handleExtractActions}
                  onExtractInsights={handleExtractInsights}
                  onCreateSummary={handleCreateSummary}
                  onExtractAsChat={handleExtractAsChat}
                />
              ))}
              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0s" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* OmniBox */}
        <div className="border-t border-border p-4">
          {/* Provider toggle */}
          <div className="flex items-center justify-end gap-2 mb-2 max-w-3xl mx-auto">
            <button
              onClick={() => setProvider(p => p === "lovable" ? "claude" : "lovable")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                provider === "claude"
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-600"
                  : "border-border bg-muted/50 text-muted-foreground hover:border-primary/30"
              }`}
            >
              {provider === "claude" ? "🧠 Claude" : "⚡ Lovable AI"}
            </button>
          </div>
          {/* Favorite Prompt Chips */}
          {messages.length === 0 && user && (
            <div className="px-4 pb-2">
              <FavoritePromptChips userId={user.id} onPromptClick={(content) => setInput(content)} />
            </div>
          )}
          <OmniBox
            input={input}
            onInputChange={setInput}
            onSend={sendMessage}
            onFileSelect={handleFileSelect}
            pendingFiles={pendingFiles}
            onRemoveFile={removePendingFile}
            loading={loading}
            uploading={uploading}
            selectedHorseName={selectedHorse?.name}
            smartChips={smartChips}
            onChipClick={handleChipClick}
            activeMode={activeMode}
            onModeChange={setActiveMode}
            showChips={messages.length === 0 || messages.length > 1}
          />
        </div>
      </div>

      {/* Right: Asset Library (hidden on mobile) */}
      {!isMobile && (
        <AssetLibrary open={assetLibraryOpen} onToggle={() => setAssetLibraryOpen(!assetLibraryOpen)} />
      )}

      <PdfExportDialog conversationId={conversationId} open={pdfOpen} onOpenChange={setPdfOpen} />
      <UpsellModal open={upsellOpen} onOpenChange={setUpsellOpen} featureName={upsellFeature} />
    </div>
  );
}
