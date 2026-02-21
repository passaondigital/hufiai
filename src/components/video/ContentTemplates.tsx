import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Bookmark, Play, Clock, Maximize, Sparkles, Loader2 } from "lucide-react";

type Template = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  template_type: string;
  prompt_template: string | null;
  aspect_ratio: string;
  duration: number;
  style: string;
  is_system: boolean;
};

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  hufpflege: { label: "Hufpflege", emoji: "🐴" },
  lifestyle: { label: "Lifestyle", emoji: "🌅" },
  marketing: { label: "Marketing", emoji: "📢" },
  education: { label: "Wissen", emoji: "📚" },
  general: { label: "Allgemein", emoji: "📋" },
};

export default function ContentTemplates({ onApplyTemplate }: { onApplyTemplate: (prompt: string, aspectRatio: string, duration: number, style: string) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await supabase.from("content_templates").select("*").order("category").order("title");
    if (data) setTemplates(data);
    setLoading(false);
  };

  const filtered = filterCategory ? templates.filter(t => t.category === filterCategory) : templates;
  const categories = [...new Set(templates.map(t => t.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[hsl(var(--sidebar-foreground))]">Pferde-Profis Vorlagen</h3>
              <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">Professionelle Content-Vorlagen für die Pferdebranche</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={filterCategory === null ? "default" : "outline"} onClick={() => setFilterCategory(null)}
              className={`text-xs h-7 ${filterCategory === null ? "bg-primary hover:bg-primary/90" : "border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))]"}`}>
              Alle
            </Button>
            {categories.map(cat => {
              const info = CATEGORY_LABELS[cat] || CATEGORY_LABELS.general;
              return (
                <Button key={cat} size="sm" variant={filterCategory === cat ? "default" : "outline"} onClick={() => setFilterCategory(cat)}
                  className={`text-xs h-7 gap-1 ${filterCategory === cat ? "bg-primary hover:bg-primary/90" : "border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted))]"}`}>
                  {info.emoji} {info.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tmpl => {
          const catInfo = CATEGORY_LABELS[tmpl.category] || CATEGORY_LABELS.general;
          return (
            <Card key={tmpl.id} className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] hover:border-primary/40 transition-all group">
              {/* Visual Header */}
              <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden rounded-t-xl">
                <span className="text-5xl opacity-50">{catInfo.emoji}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sidebar-accent))] to-transparent opacity-60" />
                <div className="absolute bottom-2 left-3 flex gap-1.5">
                  <Badge className="bg-black/50 text-white border-0 text-[9px] gap-1">
                    <Maximize className="w-2.5 h-2.5" /> {tmpl.aspect_ratio}
                  </Badge>
                  <Badge className="bg-black/50 text-white border-0 text-[9px] gap-1">
                    <Clock className="w-2.5 h-2.5" /> {tmpl.duration}s
                  </Badge>
                </div>
                {tmpl.is_system && (
                  <Badge className="absolute top-2 right-2 bg-primary/90 text-white border-0 text-[9px]">
                    Offiziell
                  </Badge>
                )}
              </div>

              <CardContent className="p-4 space-y-2">
                <h4 className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">{tmpl.title}</h4>
                <p className="text-[11px] text-[hsl(var(--sidebar-muted))] line-clamp-2">{tmpl.description}</p>
                <Button size="sm" onClick={() => {
                  onApplyTemplate(tmpl.prompt_template || "", tmpl.aspect_ratio, tmpl.duration, tmpl.style);
                  toast({ title: `Vorlage "${tmpl.title}" geladen ✨` });
                }}
                  className="w-full bg-primary hover:bg-primary/90 text-xs gap-1.5 mt-2">
                  <Sparkles className="w-3 h-3" /> Vorlage verwenden
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Bookmark className="w-10 h-10 mx-auto mb-2 text-[hsl(var(--sidebar-muted))] opacity-30" />
          <p className="text-xs text-[hsl(var(--sidebar-muted))]">Keine Vorlagen in dieser Kategorie</p>
        </div>
      )}
    </div>
  );
}
