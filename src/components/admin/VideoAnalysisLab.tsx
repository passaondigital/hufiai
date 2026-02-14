import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Video, Upload, Loader2, Hash, FileText, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VideoAnalysisLabProps {
  selectedModel: string;
}

interface AnalysisResult {
  hooks: string;
  captions: string;
  summary: string;
}

export default function VideoAnalysisLab({ selectedModel }: VideoAnalysisLabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
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
    setResult(null);
  };

  const analyzeVideo = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      // Convert to base64 for the API
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          action: "analyze_video",
          model: selectedModel,
          video_base64: base64,
          video_type: file.type,
          file_name: file.name,
        },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Video analysiert!");
    } catch (err: any) {
      toast.error(err.message || "Analyse fehlgeschlagen");
    }
    setAnalyzing(false);
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
          Lade ein Video hoch (.mp4, max 50 MB). Die KI generiert Hooks, Captions und Social-Media-Zusammenfassungen.
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

        {file && (
          <Button onClick={analyzeVideo} disabled={analyzing} className="w-full">
            {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {analyzing ? "Analysiere…" : "Video analysieren"}
          </Button>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            {[
              { key: "hooks" as const, label: "Social Media Hooks", icon: Hash },
              { key: "captions" as const, label: "Captions / Untertitel", icon: FileText },
              { key: "summary" as const, label: "Social Media Summary", icon: Sparkles },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 font-semibold text-sm">
                    <Icon className="w-4 h-4 text-primary" /> {label}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result[key], label)}>
                    Kopieren
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result[key]}</p>
              </div>
            ))}
          </div>
        )}

        <Badge variant="outline" className="text-xs">Modell: {selectedModel}</Badge>
      </CardContent>
    </Card>
  );
}
