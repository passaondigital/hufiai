import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, Video, Image as ImageIcon, FileText, Download, ExternalLink, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AssetItem {
  id: string;
  type: "video" | "image" | "document";
  title: string;
  url?: string;
  thumbnail?: string;
  created_at: string;
  status?: string;
}

interface AssetLibraryProps {
  open: boolean;
  onToggle: () => void;
}

export default function AssetLibrary({ open, onToggle }: AssetLibraryProps) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    if (!user || !open) return;
    loadAssets();
  }, [user, open]);

  const loadAssets = async () => {
    if (!user) return;
    setLoading(true);

    const [videosRes, imagesRes, docsRes] = await Promise.all([
      supabase.from("video_jobs").select("id, prompt, video_url, thumbnail_url, created_at, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("generated_images").select("id, prompt, image_url, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("documents").select("id, name, file_path, file_type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    const items: AssetItem[] = [
      ...(videosRes.data || []).map(v => ({
        id: v.id, type: "video" as const,
        title: v.prompt?.slice(0, 60) || "Video",
        url: v.video_url || undefined,
        thumbnail: v.thumbnail_url || undefined,
        created_at: v.created_at,
        status: v.status,
      })),
      ...(imagesRes.data || []).map(img => ({
        id: img.id, type: "image" as const,
        title: img.prompt?.slice(0, 60) || "Bild",
        url: img.image_url,
        thumbnail: img.image_url,
        created_at: img.created_at,
      })),
      ...(docsRes.data || []).map(doc => ({
        id: doc.id, type: "document" as const,
        title: doc.name,
        created_at: doc.created_at,
      })),
    ];

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAssets(items);
    setLoading(false);
  };

  const filtered = tab === "all" ? assets : assets.filter(a => a.type === tab);

  const typeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4 text-primary" />;
      case "image": return <ImageIcon className="w-4 h-4 text-emerald-500" />;
      default: return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-card border border-border border-r-0 rounded-l-xl p-2 shadow-lg hover:bg-accent transition-colors"
        title={lang === "de" ? "Asset-Bibliothek öffnen" : "Open Asset Library"}
      >
        <Layers className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">
            {lang === "de" ? "Assets" : "Assets"}
          </span>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
            {assets.length}
          </span>
        </div>
        <button onClick={onToggle} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2 h-8 bg-muted">
          <TabsTrigger value="all" className="text-xs h-7 px-3">
            {lang === "de" ? "Alle" : "All"}
          </TabsTrigger>
          <TabsTrigger value="video" className="text-xs h-7 px-3">
            <Video className="w-3 h-3 mr-1" /> Video
          </TabsTrigger>
          <TabsTrigger value="image" className="text-xs h-7 px-3">
            <ImageIcon className="w-3 h-3 mr-1" /> {lang === "de" ? "Bild" : "Image"}
          </TabsTrigger>
          <TabsTrigger value="document" className="text-xs h-7 px-3">
            <FileText className="w-3 h-3 mr-1" /> Doc
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="flex-1 overflow-y-auto p-3 space-y-2 mt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {lang === "de" ? "Noch keine Assets" : "No assets yet"}
              </p>
            </div>
          ) : (
            filtered.map(asset => (
              <div key={asset.id} className="group bg-muted/50 rounded-xl p-2.5 border border-transparent hover:border-border transition-all">
                {/* Thumbnail */}
                {asset.thumbnail && (
                  <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-muted">
                    <img src={asset.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-start gap-2">
                  {typeIcon(asset.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{asset.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(asset.created_at).toLocaleDateString(lang === "de" ? "de-DE" : "en-US")}
                    </p>
                  </div>
                  {asset.url && (
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {asset.status && asset.status !== "completed" && (
                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                    {asset.status}
                  </span>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
