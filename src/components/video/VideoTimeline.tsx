import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Video, Loader2, CheckCircle, XCircle, Clock, Play } from "lucide-react";
import { useState } from "react";

type VideoJob = {
  id: string;
  prompt: string;
  model: string;
  status: string;
  video_url: string | null;
  thumbnail_url: string | null;
  feedback: string | null;
  format: string;
  created_at: string;
  aspect_ratio: string;
  preset: string | null;
};

const MODELS: Record<string, { label: string; badge: string }> = {
  "wan-2.2": { label: "Wan 2.2", badge: "⭐" },
  "skyreels-v1": { label: "SkyReels", badge: "🎬" },
  "hunyuan-video": { label: "HunyuanVideo", badge: "🔬" },
  "open-sora-2": { label: "Open-Sora", badge: "🎞️" },
  "mochi-1": { label: "Mochi", badge: "⚡" },
};

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  completed: { icon: CheckCircle, color: "text-green-400", label: "Fertig" },
  processing: { icon: Loader2, color: "text-primary animate-spin", label: "Generiere..." },
  queued: { icon: Clock, color: "text-yellow-400", label: "Warteschlange" },
  failed: { icon: XCircle, color: "text-destructive", label: "Fehler" },
};

export default function VideoTimeline({ jobs }: { jobs: VideoJob[] }) {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  // Group by date
  const grouped = jobs.reduce<Record<string, VideoJob[]>>((acc, job) => {
    const date = new Date(job.created_at).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(job);
    return acc;
  }, {});

  const selected = jobs.find(j => j.id === selectedJob);

  return (
    <div className="space-y-6">
      {/* Selected Video Preview */}
      {selected && selected.status === "completed" && selected.video_url && (
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg overflow-hidden border border-[hsl(var(--sidebar-border))]">
                <video src={selected.video_url} controls className="w-full" />
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">Video Details</h3>
                <p className="text-xs text-[hsl(var(--sidebar-muted))]">{selected.prompt}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                    {MODELS[selected.model]?.badge} {MODELS[selected.model]?.label || selected.model}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]">
                    {selected.aspect_ratio}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]">
                    {selected.format}
                  </Badge>
                </div>
                <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">
                  {new Date(selected.created_at).toLocaleString("de-DE")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Filmstrip */}
      {Object.keys(grouped).length === 0 ? (
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
          <CardContent className="py-16 text-center">
            <Video className="w-12 h-12 mx-auto mb-3 text-[hsl(var(--sidebar-muted))] opacity-30" />
            <p className="text-sm text-[hsl(var(--sidebar-muted))]">Noch keine Videos generiert</p>
            <p className="text-xs text-[hsl(var(--sidebar-muted))] mt-1">Erstelle dein erstes Video im "Erstellen" Tab</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([date, dateJobs]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-[hsl(var(--sidebar-border))]" />
              <span className="text-xs font-semibold text-[hsl(var(--sidebar-muted))] shrink-0">{date}</span>
              <div className="h-px flex-1 bg-[hsl(var(--sidebar-border))]" />
            </div>

            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-4">
                {dateJobs.map(job => {
                  const st = statusConfig[job.status] || statusConfig.queued;
                  const StatusIcon = st.icon;
                  const isSelected = selectedJob === job.id;

                  return (
                    <button
                      key={job.id}
                      onClick={() => setSelectedJob(isSelected ? null : job.id)}
                      className={`group relative shrink-0 w-[180px] rounded-xl border overflow-hidden transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                          : "border-[hsl(var(--sidebar-border))] hover:border-primary/40"
                      } bg-[hsl(var(--sidebar-accent))]`}
                    >
                      {/* Thumbnail / Preview */}
                      <div className="aspect-video bg-[hsl(var(--sidebar-background))] relative flex items-center justify-center overflow-hidden">
                        {job.status === "completed" && job.video_url ? (
                          <>
                            <video
                              src={job.video_url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                          </>
                        ) : (
                          <StatusIcon className={`w-6 h-6 ${st.color}`} />
                        )}

                        {/* Status Badge */}
                        <div className={`absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-semibold ${
                          job.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : job.status === "failed"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {st.label}
                        </div>

                        {/* Model Badge */}
                        <Badge className="absolute bottom-1.5 left-1.5 text-[8px] bg-black/60 text-white border-0">
                          {MODELS[job.model]?.badge} {MODELS[job.model]?.label || job.model}
                        </Badge>
                      </div>

                      {/* Filmstrip perforation effect */}
                      <div className="flex justify-between px-1 py-0.5 bg-[hsl(var(--sidebar-background))]">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="w-2 h-1.5 rounded-sm bg-[hsl(var(--sidebar-border))]" />
                        ))}
                      </div>

                      {/* Info */}
                      <div className="p-2">
                        <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] line-clamp-1 font-medium">
                          {job.prompt}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-[hsl(var(--sidebar-muted))]">
                            {new Date(job.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-[9px] text-[hsl(var(--sidebar-muted))]">{job.aspect_ratio}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        ))
      )}
    </div>
  );
}
