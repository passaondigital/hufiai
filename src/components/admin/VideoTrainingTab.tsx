import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Video, ThumbsUp, ThumbsDown, Download, Loader2, BarChart3, Users, Clock, Filter } from "lucide-react";

interface VideoJobAdmin {
  id: string;
  user_id: string;
  prompt: string;
  optimized_prompt: string | null;
  model: string;
  status: string;
  video_url: string | null;
  feedback: string | null;
  is_hufi_relevant: boolean;
  aspect_ratio: string;
  duration: number;
  motion_intensity: number;
  coherence: number;
  stylization: number;
  preset: string | null;
  input_type: string;
  hd_upscaling: boolean;
  created_at: string;
}

const MODELS = [
  { id: "wan-2.2", label: "Wan 2.2" },
  { id: "skyreels-v1", label: "SkyReels V1" },
  { id: "hunyuan-video", label: "HunyuanVideo" },
  { id: "open-sora-2", label: "Open-Sora 2.0" },
  { id: "mochi-1", label: "Mochi 1" },
];

export default function VideoTrainingTab() {
  const [jobs, setJobs] = useState<VideoJobAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModel, setFilterModel] = useState("all");
  const [filterFeedback, setFilterFeedback] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchJobs = async () => {
    setLoading(true);
    let query = supabase
      .from("video_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filterModel !== "all") query = query.eq("model", filterModel);
    if (filterFeedback === "up") query = query.eq("feedback", "up");
    if (filterFeedback === "down") query = query.eq("feedback", "down");
    if (filterFeedback === "none") query = query.is("feedback", null);
    if (filterStatus !== "all") query = query.eq("status", filterStatus);

    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setJobs((data as VideoJobAdmin[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, [filterModel, filterFeedback, filterStatus]);

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === "completed").length,
    failed: jobs.filter(j => j.status === "failed").length,
    thumbsUp: jobs.filter(j => j.feedback === "up").length,
    thumbsDown: jobs.filter(j => j.feedback === "down").length,
    hufiRelevant: jobs.filter(j => j.is_hufi_relevant).length,
    uniqueUsers: new Set(jobs.map(j => j.user_id)).size,
  };

  const modelStats = MODELS.map(m => ({
    ...m,
    count: jobs.filter(j => j.model === m.id).length,
    positive: jobs.filter(j => j.model === m.id && j.feedback === "up").length,
    negative: jobs.filter(j => j.model === m.id && j.feedback === "down").length,
  }));

  const exportTrainingData = () => {
    const relevant = jobs.filter(j => j.is_hufi_relevant && j.feedback);
    if (relevant.length === 0) { toast.error("Keine Trainingsdaten vorhanden"); return; }
    const data = relevant.map(j => ({
      prompt: j.prompt,
      optimized_prompt: j.optimized_prompt,
      model: j.model,
      feedback: j.feedback,
      aspect_ratio: j.aspect_ratio,
      duration: j.duration,
      preset: j.preset,
      input_type: j.input_type,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `hufi-video-training-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${data.length} Datensätze exportiert`);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Gesamt", value: stats.total, icon: Video },
          { label: "Nutzer", value: stats.uniqueUsers, icon: Users },
          { label: "👍 Positiv", value: stats.thumbsUp, color: "text-green-500" },
          { label: "👎 Negativ", value: stats.thumbsDown, color: "text-red-500" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${(s as any).color || ""}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Modell-Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {modelStats.filter(m => m.count > 0).map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-xs font-medium w-28">{m.label}</span>
                <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                  {m.count > 0 && (
                    <>
                      <div className="absolute left-0 top-0 h-full bg-green-500/60 rounded-l-full"
                        style={{ width: `${(m.positive / m.count) * 100}%` }} />
                      <div className="absolute right-0 top-0 h-full bg-red-500/60 rounded-r-full"
                        style={{ width: `${(m.negative / m.count) * 100}%` }} />
                    </>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
                    {m.count} Jobs · 👍{m.positive} · 👎{m.negative}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters + Export */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterModel} onValueChange={setFilterModel}>
          <SelectTrigger className="w-[140px] text-xs"><SelectValue placeholder="Modell" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Modelle</SelectItem>
            {MODELS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterFeedback} onValueChange={setFilterFeedback}>
          <SelectTrigger className="w-[140px] text-xs"><SelectValue placeholder="Feedback" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Feedback</SelectItem>
            <SelectItem value="up">👍 Positiv</SelectItem>
            <SelectItem value="down">👎 Negativ</SelectItem>
            <SelectItem value="none">Kein Feedback</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="completed">Fertig</SelectItem>
            <SelectItem value="failed">Fehlgeschlagen</SelectItem>
            <SelectItem value="processing">In Arbeit</SelectItem>
            <SelectItem value="queued">Warteschlange</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={exportTrainingData} className="ml-auto gap-1.5">
          <Download className="w-3.5 h-3.5" /> Training-Export
        </Button>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Datum</th>
                    <th className="text-left p-3 font-medium">Prompt</th>
                    <th className="text-left p-3 font-medium">Modell</th>
                    <th className="text-left p-3 font-medium">Stil</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Feedback</th>
                    <th className="text-left p-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobs.map(job => (
                    <tr key={job.id} className="hover:bg-muted/30">
                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString("de", { day: "2-digit", month: "2-digit" })}
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <p className="truncate" title={job.prompt}>{job.prompt}</p>
                        {job.optimized_prompt && (
                          <p className="truncate text-muted-foreground text-[10px]" title={job.optimized_prompt}>
                            KI: {job.optimized_prompt}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {MODELS.find(m => m.id === job.model)?.label || job.model}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {job.preset && <Badge variant="secondary" className="text-[10px]">{job.preset}</Badge>}
                      </td>
                      <td className="p-3">
                        <Badge variant={job.status === "completed" ? "default" : job.status === "failed" ? "destructive" : "secondary"}
                          className="text-[10px]">
                          {job.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {job.feedback === "up" && <ThumbsUp className="w-4 h-4 text-green-500" />}
                        {job.feedback === "down" && <ThumbsDown className="w-4 h-4 text-red-500" />}
                        {!job.feedback && <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {job.aspect_ratio} · {job.duration}s · {job.input_type}
                        {job.hd_upscaling && " · HD"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
