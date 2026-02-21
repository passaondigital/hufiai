import { Shield, Server, Clock, Cpu } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const items = [
  { icon: Shield, key: "trust.gdpr" },
  { icon: Server, key: "trust.eu" },
  { icon: Clock, key: "trust.available" },
  { icon: Cpu, key: "trust.multiLLM" },
] as const;

export default function TrustBar() {
  const { t } = useI18n();
  return (
    <div className="border-y border-border bg-muted/40">
      <div className="max-w-6xl mx-auto flex justify-center gap-8 md:gap-16 py-5 px-6 flex-wrap">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <item.icon className="w-4 h-4 text-primary" />
            {t(item.key)}
          </div>
        ))}
      </div>
    </div>
  );
}
