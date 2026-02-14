import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Video, Upload, Loader2, Hash, FileText, Sparkles, Flame, MessageSquare, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VideoAnalysisLabProps {
  selectedModel: string;
}

type AnalysisMode = "hooks" | "caption" | "report";

interface AnalysisResult {
  content: string;
  mode: AnalysisMode;
}

const MODES: { id: AnalysisMode; label: string; icon: typeof Hash; desc: string }[] = [
  { id: "hooks", label: "Viral Hooks erstellen", icon: Flame, desc: "3 provokante, fachlich fundierte Hooks für Reels & TikTok" },
  { id: "caption", label: "Social Caption schreiben", icon: MessageSquare, desc: "Packende Caption mit CTA im HufiAi Brand Voice" },
  { id: "report", label: "Technischer Bericht", icon: ClipboardList, desc: "Fachliches Protokoll für Kunden-Dokumentation" },
];

export default function VideoAnalysisLab({ selectedModel }: VideoAnalysisLabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState<AnalysisMode | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      toast.error("Nur Video-Dateien (.mp4) erlaubt");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error("Max. 50 MB erlaubt");
      return;
    }
    setFile(f);
    setResults({});
  };

  const analyzeVideo = async (mode: AnalysisMode) => {
    if (!file) return;
    setAnalyzing(mode);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          action: "analyze_video",
          mode,
          model: selectedModel,
          video_base64: base64,
          video_type: file.type,
          file_name: file.name,
        },
      });

      if (error) throw error;
      setResults((prev) => ({ ...prev, [mode]: data.content || data.hooks || "" }));
      toast.success("Analyse abgeschlossen!");
    } catch (err: any) {
      toast.error(err.message || "Analyse fehlgeschlagen");
    }
    setAnalyzing(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="w-5 h-5 text-primary" /> Video Analysis Lab
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lade ein Video hoch (.mp4, max 50 MB). Wähle dann die gewünschte Analyse – jeder Modus nutzt einen spezialisierten HufiAi-Prompt.
        </p>

        {/* Upload Zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-all"
        >
          <input ref={fileRef} type="file" accept="video/mp4,video/*" className="hidden" onChange={handleUpload} />
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          {file ? (
            <div>
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Video hier ablegen oder klicken</p>
          )}
        </div>

        {/* 3 Action Buttons */}
        {file && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MODES.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => analyzeVideo(id)}
                disabled={analyzing !== null}
                className={`p-4 rounded-xl border text-left transition-all hover:border-primary/50 hover:bg-accent/50 ${
                  results[id] ? "border-primary/30 bg-primary/5" : "border-border"
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {analyzing === id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Icon className="w-4 h-4 text-primary" />
                  )}
                  <span className="font-semibold text-sm">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
                {results[id] && (
                  <Badge variant="outline" className="mt-2 text-xs">✅ Fertig</Badge>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {Object.entries(results).map(([mode, content]) => {
          const modeInfo = MODES.find((m) => m.id === mode);
          if (!modeInfo || !content) return null;
          const Icon = modeInfo.icon;
          return (
            <div key={mode} className="p-4 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-semibold text-sm">
                  <Icon className="w-4 h-4 text-primary" /> {modeInfo.label}
                </span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(content, modeInfo.label)}>
                  Kopieren
                </Button>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
            </div>
          );
        })}

        <Badge variant="outline" className="text-xs">Modell: {selectedModel}</Badge>
      </CardContent>
    </Card>
  );
}
