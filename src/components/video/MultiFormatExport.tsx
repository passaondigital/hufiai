import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  FileOutput, Download, Share2, Copy, CheckCircle, Loader2,
  Smartphone, Monitor, Square, MessageSquare, Link2
} from "lucide-react";
import JSZip from "jszip";

type VideoJob = {
  id: string;
  prompt: string;
  model: string;
  status: string;
  video_url: string | null;
  aspect_ratio: string;
  format: string;
  created_at: string;
};

const FORMAT_TARGETS = [
  { id: "reels", label: "Reels / Shorts", icon: Smartphone, ratio: "9:16", platforms: "Instagram, TikTok, YouTube Shorts", maxSize: "30MB" },
  { id: "post", label: "Feed Post", icon: Square, ratio: "1:1", platforms: "Instagram, Facebook, LinkedIn", maxSize: "10MB" },
  { id: "story", label: "Story", icon: MessageSquare, ratio: "9:16", platforms: "Instagram, Facebook, WhatsApp", maxSize: "15MB" },
  { id: "youtube", label: "YouTube", icon: Monitor, ratio: "16:9", platforms: "YouTube, Website", maxSize: "100MB" },
];

export default function MultiFormatExport({ jobs, userId }: { jobs: VideoJob[]; userId: string }) {
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [shareLinks, setShareLinks] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [includeAllFormats, setIncludeAllFormats] = useState(true);

  const completedJobs = jobs.filter(j => j.status === "completed" && j.video_url);

  const toggleJob = (id: string) => {
    setSelectedJobs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedJobs(completedJobs.map(j => j.id));
  };

  const exportAsZip = async () => {
    const toExport = completedJobs.filter(j => selectedJobs.includes(j.id));
    if (toExport.length === 0) return toast({ title: "Keine Videos ausgewählt", variant: "destructive" });

    setIsExporting(true);
    setExportProgress(0);

    try {
      const zip = new JSZip();
      let downloaded = 0;

      for (const job of toExport) {
        try {
          const response = await fetch(job.video_url!);
          if (response.ok) {
            const blob = await response.blob();
            const ratioLabel = job.aspect_ratio.replace(":", "x");
            const fileName = `HufiAi_${ratioLabel}_${job.id.slice(0, 8)}.${job.format || "mp4"}`;

            if (includeAllFormats) {
              zip.file(`Reels_9x16/${fileName}`, blob);
              zip.file(`YouTube_16x9/${fileName}`, blob);
              zip.file(`Post_1x1/${fileName}`, blob);
              zip.file(`Story_9x16/${fileName}`, blob);
            } else {
              zip.file(fileName, blob);
            }
          }
        } catch (e) {
          console.error("Download failed:", e);
        }
        downloaded++;
        setExportProgress(Math.round((downloaded / toExport.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HufiAi_Export_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Export abgeschlossen 📦", description: `${toExport.length} Videos exportiert` });
    } catch (e: any) {
      toast({ title: "Export fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const copyShareLink = (jobId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(jobId);
    toast({ title: "Link kopiert ✓" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Format Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {FORMAT_TARGETS.map(fmt => (
          <Card key={fmt.id} className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
            <CardContent className="p-4 text-center">
              <fmt.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))]">{fmt.label}</p>
              <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">{fmt.ratio}</p>
              <p className="text-[9px] text-primary mt-1">{fmt.platforms}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Controls */}
      <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
              <FileOutput className="w-4 h-4 text-primary" /> Multi-Format Export
              {selectedJobs.length > 0 && (
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">{selectedJobs.length} ausgewählt</Badge>
              )}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={selectAll}
              className="text-xs border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]">
              Alle auswählen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={includeAllFormats} onCheckedChange={setIncludeAllFormats} />
            <label className="text-xs text-[hsl(var(--sidebar-foreground))]">
              In alle Formate exportieren (Reels, Post, Story, YouTube)
            </label>
          </div>

          {completedJobs.length === 0 ? (
            <div className="text-center py-8">
              <FileOutput className="w-10 h-10 mx-auto mb-2 text-[hsl(var(--sidebar-muted))] opacity-30" />
              <p className="text-xs text-[hsl(var(--sidebar-muted))]">Keine fertigen Videos zum Exportieren</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {completedJobs.map(job => (
                <div key={job.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedJobs.includes(job.id) ? "border-primary bg-primary/10" : "border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] hover:border-primary/40"
                }`} onClick={() => toggleJob(job.id)}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                    selectedJobs.includes(job.id) ? "border-primary bg-primary" : "border-[hsl(var(--sidebar-border))]"
                  }`}>
                    {selectedJobs.includes(job.id) && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[hsl(var(--sidebar-foreground))] truncate">{job.prompt}</p>
                    <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">{job.aspect_ratio} · {new Date(job.created_at).toLocaleDateString("de")}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); copyShareLink(job.id, job.video_url!); }}>
                      {copiedId === job.id ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Link2 className="w-3.5 h-3.5 text-[hsl(var(--sidebar-muted))]" />}
                    </Button>
                    <a href={job.video_url!} download className="p-1.5 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] transition-colors" onClick={e => e.stopPropagation()}>
                      <Download className="w-3.5 h-3.5 text-[hsl(var(--sidebar-muted))]" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isExporting && (
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-[hsl(var(--sidebar-border))] overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${exportProgress}%` }} />
              </div>
              <p className="text-[10px] text-[hsl(var(--sidebar-muted))] text-center">{exportProgress}% · Exportiere...</p>
            </div>
          )}

          <Button onClick={exportAsZip} disabled={isExporting || selectedJobs.length === 0} size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-sm font-bold gap-2">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {includeAllFormats ? "Multi-Format ZIP herunterladen" : "ZIP herunterladen"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
