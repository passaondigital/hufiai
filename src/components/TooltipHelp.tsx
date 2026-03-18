import { useState } from "react";
import { X, Lightbulb } from "lucide-react";
import { useEducation } from "@/hooks/useEducation";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "inline" | "floating";
}

export default function TooltipHelp({ id, title, children, className, variant = "inline" }: Props) {
  const { educationMode, dismissedTips, dismissTip } = useEducation();
  const [dismissed, setDismissed] = useState(false);

  if (!educationMode || dismissedTips.has(id) || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    dismissTip(id);
  };

  if (variant === "floating") {
    return (
      <div className={cn(
        "fixed bottom-20 right-4 z-40 max-w-xs animate-in slide-in-from-bottom-4 duration-300",
        className
      )}>
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {title && <p className="text-sm font-semibold mb-1">{title}</p>}
              <div className="text-xs text-muted-foreground leading-relaxed">{children}</div>
            </div>
            <button onClick={handleDismiss} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/10 text-xs",
      className
    )}>
      <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-foreground mb-0.5">{title}</p>}
        <div className="text-muted-foreground leading-relaxed">{children}</div>
      </div>
      <button onClick={handleDismiss} className="shrink-0 text-muted-foreground hover:text-foreground">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
