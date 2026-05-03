import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Video, Upload, Loader2, Flame, MessageSquare, ClipboardList, CloudUpload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const DRIVE_SCOPES = "https://www.googleapis.com/auth/drive.file";

interface VideoAnalysisLabProps {
  selectedModel: string;
}

type AnalysisMode = "hooks" | "caption" | "report";

interface AnalysisResult {
  content: string;
  mode: AnalysisMode;
}

const MODES: { id: AnalysisMode; label: string; icon: typeof Flame; desc: string }[] = [
  { id: "hooks", label: "Viral Hooks erstellen", icon: Flame, desc: "3 provokante, fachlich fundierte Hooks für Reels & TikTok" },
  { id: "caption", label: "Social Caption schreiben", icon: MessageSquare, desc: "Packende Caption mit CTA im Hufi Brand Voice" },
  { id: "report", label: "Technischer Bericht", icon: ClipboardList, desc: "Fachliches Protokoll für Kunden-Dokumentation" },
];

export default function VideoAnalysisLab({ selectedModel }: VideoAnalysisLabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<AnalysisMode | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const validateAndSetFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      toast.error("Nur Video-Dateien (.mp4) erlaubt");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error("Max. 50 MB erlaubt");
      return;
    }
    // Revoke old URL to avoid memory leaks
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setResults({});
    setProgress(0);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const analyzeVideo = async (mode: AnalysisMode) => {
    if (!file) return;
    setAnalyzing(mode);
    setProgress(0);

    // Simulate progress while waiting for API
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 92));
    }, 400);

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
      setProgress(100);
      setResults((prev) => ({ ...prev, [mode]: data.content || data.hooks || "" }));
      toast.success("Analyse abgeschlossen!");
    } catch (err: any) {
      toast.error(err.message || "Analyse fehlgeschlagen");
    }
    clearInterval(interval);
    setTimeout(() => {
      setAnalyzing(null);
      setProgress(0);
    }, 500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  const exportToDrive = async (content: string, label: string) => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("Google Client ID nicht konfiguriert");
      return;
    }

    // Open Google OAuth consent popup
    const redirectUri = window.location.origin;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(DRIVE_SCOPES)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${encodeURIComponent(JSON.stringify({ content, label }))}`;

    // Store content for after redirect
    sessionStorage.setItem("drive_export_content", content);
    sessionStorage.setItem("drive_export_label", label);
    
    // Open in popup
    const popup = window.open(authUrl, "google_auth", "width=500,height=600,menubar=no,toolbar=no");
    
    // Listen for the code from the popup
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type !== "google_auth_code") return;
      window.removeEventListener("message", handleMessage);
      
      const code = event.data.code;
      try {
        // Exchange code for token
        const { data: tokenData, error: tokenErr } = await supabase.functions.invoke("export-to-drive", {
          body: { action: "exchange_code", code, redirect_uri: redirectUri },
        });
        if (tokenErr) throw tokenErr;

        // Upload to Drive
        const fileName = `Hufi_${label.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.txt`;
        const { data: uploadData, error: uploadErr } = await supabase.functions.invoke("export-to-drive", {
          body: { action: "upload", access_token: tokenData.access_token, content, file_name: fileName },
        });
        if (uploadErr) throw uploadErr;

        toast.success(`"${fileName}" erfolgreich in Google Drive gespeichert!`, {
          action: {
            label: "Öffnen",
            onClick: () => window.open(uploadData.web_view_link, "_blank"),
          },
        });
      } catch (err: any) {
        toast.error(err.message || "Export nach Google Drive fehlgeschlagen");
      }
    };

    window.addEventListener("message", handleMessage);
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
          Lade ein Video hoch (.mp4, max 50 MB). Wähle dann die gewünschte Analyse – jeder Modus nutzt einen spezialisierten Hufi-Prompt.
        </p>

        {/* Upload Zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          }`}
        >
          <input ref={fileRef} type="file" accept="video/mp4,video/*" className="hidden" onChange={handleUpload} />
          <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${dragging ? "text-primary" : "text-muted-foreground"}`} />
          {file ? (
            <div>
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {dragging ? "Jetzt loslassen!" : "Video hierher ziehen oder klicken"}
            </p>
          )}
        </div>

        {/* Video Preview */}
        {file && videoUrl && (
          <div className="rounded-xl overflow-hidden border border-border bg-black/5">
            <video
              ref={videoPreviewRef}
              src={videoUrl}
              controls
              className="w-full max-h-64 object-contain bg-black"
              preload="metadata"
            />
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
              <span className="text-xs font-medium truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          </div>
        )}


        {analyzing && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                {MODES.find(m => m.id === analyzing)?.label}…
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

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
              <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => exportToDrive(content, modeInfo.label)}>
                    <CloudUpload className="w-3.5 h-3.5 mr-1" /> Drive
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(content, modeInfo.label)}>
                    Kopieren
                  </Button>
                </div>
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
