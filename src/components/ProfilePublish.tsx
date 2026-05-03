import { useState } from "react";
import { useGamification } from "@/hooks/useGamification";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, Copy, Check, Instagram, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProfilePublish() {
  const { achievements, userLevel, levelEmoji, levelName } = useGamification();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const toggleAchievement = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateMessage = () => {
    const selectedAchs = achievements.filter((a) => selected.has(a.id));
    const badges = selectedAchs.map((a) => `${a.icon_emoji} ${a.title}`).join("\n");
    return `${levelEmoji} Level ${userLevel?.current_level ?? 1} ${levelName} bei Hufi!\n\nMeine Badges:\n${badges}\n\n#Hufi #KI #AIforGood`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMessage());
    setCopied(true);
    toast.success("In Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToLinkedIn = () => {
    const text = encodeURIComponent(generateMessage());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://hufiapp.de&summary=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Achievements teilen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Achievements teilen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Level display */}
          <div className="flex items-center gap-3 bg-primary/5 rounded-xl p-4">
            <span className="text-3xl">{levelEmoji}</span>
            <div>
              <p className="font-bold">Level {userLevel?.current_level ?? 1}</p>
              <p className="text-sm text-muted-foreground">{levelName} · {userLevel?.total_xp ?? 0} XP</p>
            </div>
          </div>

          {/* Achievement selection */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Noch keine Badges verdient. Starte einen Lernpfad!
              </p>
            ) : (
              achievements.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selected.has(a.id) ? "border-primary/30 bg-primary/5" : "border-border hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    checked={selected.has(a.id)}
                    onCheckedChange={() => toggleAchievement(a.id)}
                  />
                  <span className="text-lg">{a.icon_emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          {/* Actions */}
          {selected.size > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              {/* Preview */}
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground whitespace-pre-line">
                {generateMessage()}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Kopiert!" : "Kopieren"}
                </Button>
                <Button variant="outline" size="icon" onClick={shareToLinkedIn}>
                  <Linkedin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
