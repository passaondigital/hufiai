import { Switch } from "@/components/ui/switch";
import { GraduationCap, RotateCcw } from "lucide-react";
import { useEducation } from "@/hooks/useEducation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  showReset?: boolean;
}

export default function GamificationMode({ className, showReset }: Props) {
  const { educationMode, setEducationMode, resetTips } = useEducation();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
        <GraduationCap className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Lernmodus</p>
          <p className="text-xs text-muted-foreground">
            {educationMode ? "Tipps & Lernpfade werden angezeigt" : "Nur Kernfunktionen sichtbar"}
          </p>
        </div>
        <Switch
          checked={educationMode}
          onCheckedChange={setEducationMode}
        />
      </div>
      {showReset && educationMode && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={resetTips}
        >
          <RotateCcw className="w-3 h-3 mr-1.5" />
          Alle Tipps zurücksetzen
        </Button>
      )}
    </div>
  );
}
