import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === "de" ? "en" : "de")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border hover:bg-accent transition-colors"
      aria-label="Switch language"
    >
      <Globe className="w-4 h-4" />
      {lang === "de" ? "EN" : "DE"}
    </button>
  );
}
