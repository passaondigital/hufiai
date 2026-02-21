import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Layers, Video, Image as ImageIcon, FileText, Search, Tag, Download, 
  Loader2, Plus, X, Edit2, Filter
} from "lucide-react";

type AssetItem = {
  id: string;
  type: "video" | "image" | "document";
  title: string;
  url?: string;
  thumbnail?: string;
  created_at: string;
  status?: string;
  aspect_ratio?: string;
  tags?: { horse_name?: string; project_name?: string; custom_tags?: string[] };
};

export default function AssetLibraryEnhanced({ userId }: { userId: string }) {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterTag, setFilterTag] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagHorse, setTagHorse] = useState("");
  const [tagProject, setTagProject] = useState("");
  const [tagCustom, setTagCustom] = useState("");

  useEffect(() => {
    loadAssets();
  }, [userId]);

  const loadAssets = async () => {
    setLoading(true);

    // Load assets + their tags
    const [videosRes, imagesRes, docsRes, tagsRes] = await Promise.all([
      supabase.from("video_jobs").select("id, prompt, video_url, thumbnail_url, created_at, status, aspect_ratio")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("generated_images").select("id, prompt, image_url, created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("documents").select("id, name, file_path, file_type, created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("asset_tags").select("*").eq("user_id", userId),
    ]);

    const tagsMap = new Map<string, any>();
    (tagsRes.data || []).forEach(t => tagsMap.set(t.asset_id, t));

    const items: AssetItem[] = [
      ...(videosRes.data || []).map(v => ({
        id: v.id, type: "video" as const,
        title: v.prompt?.slice(0, 80) || "Video",
        url: v.video_url || undefined,
        thumbnail: v.thumbnail_url || undefined,
        created_at: v.created_at,
        status: v.status,
        aspect_ratio: v.aspect_ratio,
        tags: tagsMap.has(v.id) ? { horse_name: tagsMap.get(v.id).horse_name, project_name: tagsMap.get(v.id).project_name, custom_tags: tagsMap.get(v.id).custom_tags } : undefined,
      })),
      ...(imagesRes.data || []).map(img => ({
        id: img.id, type: "image" as const,
        title: img.prompt?.slice(0, 80) || "Bild",
        url: img.image_url, thumbnail: img.image_url,
        created_at: img.created_at,
        tags: tagsMap.has(img.id) ? { horse_name: tagsMap.get(img.id).horse_name, project_name: tagsMap.get(img.id).project_name, custom_tags: tagsMap.get(img.id).custom_tags } : undefined,
      })),
      ...(docsRes.data || []).map(doc => ({
        id: doc.id, type: "document" as const,
        title: doc.name, created_at: doc.created_at,
        tags: tagsMap.has(doc.id) ? { horse_name: tagsMap.get(doc.id).horse_name, project_name: tagsMap.get(doc.id).project_name, custom_tags: tagsMap.get(doc.id).custom_tags } : undefined,
      })),
    ];

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAssets(items);
    setLoading(false);
  };

  const saveTag = async (assetId: string, assetType: string) => {
    const customTags = tagCustom.split(",").map(t => t.trim()).filter(Boolean);
    
    // Upsert: delete existing, insert new
    await supabase.from("asset_tags").delete().eq("asset_id", assetId).eq("user_id", userId);
    const { error } = await supabase.from("asset_tags").insert({
      user_id: userId,
      asset_id: assetId,
      asset_type: assetType,
      horse_name: tagHorse || null,
      project_name: tagProject || null,
      custom_tags: customTags,
    });
    if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    toast({ title: "Tags gespeichert ✓" });
    setEditingTagId(null);
    setTagHorse("");
    setTagProject("");
    setTagCustom("");
    loadAssets();
  };

  // Filter logic
  const filtered = assets.filter(a => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchHorse = a.tags?.horse_name?.toLowerCase().includes(q);
      const matchProject = a.tags?.project_name?.toLowerCase().includes(q);
      const matchCustom = a.tags?.custom_tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchHorse && !matchProject && !matchCustom) return false;
    }
    if (filterTag) {
      const ft = filterTag.toLowerCase();
      const hasTag = a.tags?.horse_name?.toLowerCase().includes(ft) || 
                     a.tags?.project_name?.toLowerCase().includes(ft) ||
                     a.tags?.custom_tags?.some(t => t.toLowerCase().includes(ft));
      if (!hasTag) return false;
    }
    return true;
  });

  // Collect all unique tags for filter dropdown
  const allTags = new Set<string>();
  assets.forEach(a => {
    if (a.tags?.horse_name) allTags.add(a.tags.horse_name);
    if (a.tags?.project_name) allTags.add(a.tags.project_name);
    a.tags?.custom_tags?.forEach(t => allTags.add(t));
  });

  const typeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4 text-primary" />;
      case "image": return <ImageIcon className="w-4 h-4 text-emerald-500" />;
      default: return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[hsl(var(--sidebar-foreground))]">Asset-Bibliothek</h3>
              <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">{assets.length} Assets · {allTags.size} Tags</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--sidebar-muted))]" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Suche nach Name, Pferd, Projekt..."
                className="pl-8 h-8 text-xs bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-28 h-8 text-xs bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="image">Bilder</SelectItem>
                <SelectItem value="document">Dokumente</SelectItem>
              </SelectContent>
            </Select>
            {allTags.size > 0 && (
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-36 h-8 text-xs bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Tag-Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Alle Tags</SelectItem>
                  {[...allTags].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Asset Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
          <CardContent className="py-12 text-center">
            <Layers className="w-10 h-10 mx-auto mb-2 text-[hsl(var(--sidebar-muted))] opacity-30" />
            <p className="text-xs text-[hsl(var(--sidebar-muted))]">Keine Assets gefunden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(asset => (
            <Card key={asset.id} className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] hover:border-primary/40 transition-all group">
              {/* Thumbnail */}
              {asset.thumbnail && (
                <div className="aspect-video rounded-t-lg overflow-hidden bg-black/30">
                  <img src={asset.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {!asset.thumbnail && (
                <div className="aspect-video rounded-t-lg bg-[hsl(var(--sidebar-background))] flex items-center justify-center">
                  {typeIcon(asset.type)}
                </div>
              )}

              <CardContent className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                  {typeIcon(asset.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[hsl(var(--sidebar-foreground))] truncate">{asset.title}</p>
                    <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">
                      {new Date(asset.created_at).toLocaleDateString("de-DE")}
                      {asset.aspect_ratio && ` · ${asset.aspect_ratio}`}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {asset.tags && (
                  <div className="flex gap-1 flex-wrap">
                    {asset.tags.horse_name && (
                      <Badge className="text-[9px] bg-primary/20 text-primary border-0">🐴 {asset.tags.horse_name}</Badge>
                    )}
                    {asset.tags.project_name && (
                      <Badge className="text-[9px] bg-blue-500/20 text-blue-400 border-0">📁 {asset.tags.project_name}</Badge>
                    )}
                    {asset.tags.custom_tags?.map(t => (
                      <Badge key={t} className="text-[9px] bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-muted))] border-0">{t}</Badge>
                    ))}
                  </div>
                )}

                {/* Tag Editor Inline */}
                {editingTagId === asset.id ? (
                  <div className="space-y-2 p-2 rounded-lg border border-primary/20 bg-primary/5">
                    <Input value={tagHorse} onChange={e => setTagHorse(e.target.value)} placeholder="Pferdename"
                      className="h-7 text-[10px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]" />
                    <Input value={tagProject} onChange={e => setTagProject(e.target.value)} placeholder="Projektname"
                      className="h-7 text-[10px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]" />
                    <Input value={tagCustom} onChange={e => setTagCustom(e.target.value)} placeholder="Tags (kommagetrennt)"
                      className="h-7 text-[10px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-foreground))]" />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => saveTag(asset.id, asset.type)} className="text-[10px] h-6 bg-primary hover:bg-primary/90">Speichern</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingTagId(null)} className="text-[10px] h-6 text-[hsl(var(--sidebar-muted))]">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingTagId(asset.id);
                      setTagHorse(asset.tags?.horse_name || "");
                      setTagProject(asset.tags?.project_name || "");
                      setTagCustom(asset.tags?.custom_tags?.join(", ") || "");
                    }} className="text-[10px] h-6 gap-1 text-[hsl(var(--sidebar-muted))]">
                      <Tag className="w-3 h-3" /> Tags
                    </Button>
                    {asset.url && (
                      <a href={asset.url} download className="inline-flex items-center text-[10px] h-6 px-2 rounded hover:bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-muted))] transition-colors">
                        <Download className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
