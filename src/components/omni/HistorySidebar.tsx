import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Plus, MessageSquare, FolderKanban, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  horse_id: string | null;
  project_id: string | null;
}

interface HistorySidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function HistorySidebar({
  activeConversationId, onSelectConversation, onNewChat, collapsed, onCollapse,
}: HistorySidebarProps) {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("conversations")
      .select("id, title, created_at, updated_at, horse_id, project_id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setConversations(data || []);
        setLoading(false);
      });
  }, [user]);

  const filtered = search
    ? conversations.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const deleteConversation = async (id: string) => {
    await supabase.from("messages").delete().eq("conversation_id", id);
    await supabase.from("conversations").delete().eq("id", id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) onNewChat();
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-sidebar flex flex-col items-center py-3 border-r border-sidebar-border shrink-0">
        <button onClick={() => onCollapse(false)} className="p-2 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors mb-3">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={onNewChat} className="p-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 transition-opacity mb-4">
          <Plus className="w-4 h-4" />
        </button>
        <div className="flex-1 overflow-y-auto space-y-1 w-full px-1.5">
          {filtered.slice(0, 20).map(c => (
            <button
              key={c.id}
              onClick={() => onSelectConversation(c.id)}
              className={`w-full p-2 rounded-lg transition-colors ${
                activeConversationId === c.id ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              title={c.title || "Chat"}
            >
              <MessageSquare className="w-4 h-4 mx-auto" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-sidebar-border">
        <span className="text-sm font-semibold text-sidebar-foreground">
          {lang === "de" ? "Verlauf" : "History"}
        </span>
        <button onClick={() => onCollapse(true)} className="p-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* New chat button */}
      <div className="p-3">
        <Button onClick={onNewChat} className="w-full gap-2 rounded-xl" size="sm">
          <Plus className="w-4 h-4" />
          {lang === "de" ? "Neuer Chat" : "New Chat"}
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "de" ? "Suchen..." : "Search..."}
            className="pl-8 h-8 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-sidebar-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-sidebar-muted text-center py-8">
            {lang === "de" ? "Keine Chats gefunden" : "No chats found"}
          </p>
        ) : (
          filtered.map(c => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                activeConversationId === c.id
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              onClick={() => onSelectConversation(c.id)}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{c.title || "Neuer Chat"}</p>
                <p className="text-[10px] opacity-60">
                  {formatDistanceToNow(new Date(c.updated_at || c.created_at), {
                    addSuffix: true,
                    locale: lang === "de" ? de : enUS,
                  })}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
