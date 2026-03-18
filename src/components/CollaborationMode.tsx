import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Mail, Copy, Check, MessageSquare, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  conversationId?: string;
}

export default function CollaborationMode({ conversationId }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviting, setInviting] = useState(false);

  const shareLink = conversationId
    ? `${window.location.origin}/chat?shared=${conversationId}`
    : window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async () => {
    if (!email.includes("@")) {
      toast.error("Bitte gib eine gültige E-Mail ein.");
      return;
    }
    setInviting(true);
    // Simulate invite – would call edge function in production
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(`Einladung an ${email} gesendet!`);
    setEmail("");
    setInviting(false);
  };

  const features = [
    { icon: Mail, label: "Freunde per E-Mail einladen" },
    { icon: MessageSquare, label: "Aktiven Chat teilen" },
    { icon: Eye, label: "Echtzeit: Wer schaut gerade?" },
    { icon: Users, label: "Chats zusammenführen" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="w-4 h-4" />
          Zusammenarbeiten
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Collaboration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Invite by email */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Freund einladen</label>
            <div className="flex gap-2">
              <Input
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleInvite} disabled={inviting} size="sm">
                {inviting ? "..." : "Einladen"}
              </Button>
            </div>
          </div>

          {/* Share link */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Chat-Link teilen</label>
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="flex-1 text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Feature list */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium mb-3 text-muted-foreground">Collaboration Features</p>
            <div className="grid grid-cols-2 gap-2">
              {features.map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <f.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
