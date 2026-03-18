import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEducation } from "@/hooks/useEducation";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  why?: string;
  side?: "top" | "bottom" | "left" | "right";
  iconSize?: number;
  className?: string;
}

export default function TooltipHelpBubble({ text, why, side = "top", iconSize = 14, className }: Props) {
  const { educationMode } = useEducation();

  if (!educationMode) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className={cn("inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors", className)}>
          <Info style={{ width: iconSize, height: iconSize }} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <p className="text-xs">{text}</p>
        {why && (
          <p className="text-[10px] text-primary/80 mt-1 italic">Warum? {why}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
