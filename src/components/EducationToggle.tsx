import { Switch } from "@/components/ui/switch";
import { GraduationCap } from "lucide-react";
import { useEducation } from "@/hooks/useEducation";

export default function EducationToggle() {
  const { educationMode, setEducationMode } = useEducation();

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-card border border-border">
      <GraduationCap className="w-4 h-4 text-primary shrink-0" />
      <span className="text-xs font-medium flex-1">Lernmodus</span>
      <Switch
        checked={educationMode}
        onCheckedChange={setEducationMode}
        className="scale-75"
      />
    </div>
  );
}
