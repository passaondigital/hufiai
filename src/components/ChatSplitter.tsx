import { useState } from "react";
import { Scissors, MessageSquarePlus, GitBranch } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ChatSplitterProps {
  content: string;
  messageId?: string;
  parentConversationId: string | null;
  onExtractAsChat: (content: string) => void;
  onDeepDive?: (content: string) => void;
}

export default function ChatSplitter({ content, messageId, parentConversationId, onExtractAsChat, onDeepDive }: ChatSplitterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Chat aufteilen">
          <Scissors className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => onExtractAsChat(content)} className="gap-2 text-xs">
          <MessageSquarePlus className="w-3.5 h-3.5" />
          Als neuen Chat extrahieren
        </DropdownMenuItem>
        {onDeepDive && (
          <DropdownMenuItem onClick={() => onDeepDive(content)} className="gap-2 text-xs">
            <GitBranch className="w-3.5 h-3.5" />
            Deep Dive Sub-Chat erstellen
          </DropdownMenuItem>
        )}
        {parentConversationId && (
          <DropdownMenuItem disabled className="gap-2 text-xs text-muted-foreground">
            <GitBranch className="w-3.5 h-3.5" />
            Verlinkt mit Parent Chat
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
