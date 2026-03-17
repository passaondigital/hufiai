import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ImageIcon, Video, Loader2, Camera, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface StockResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  photographer: string;
  photographerUrl: string;
  source: string;
  downloadUrl: string;
  width: number;
  height: number;
  type: "photo" | "video";
  avgColor?: string;
  duration?: number;
}

const POPULAR_TAGS = [
  "Pferd", "Natur", "Business", "Technologie", "Marketing",
  "Huf", "Stall", "Reiten", "Tier", "Veterinär",
];

export default function StockMedia() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<"pexels" | "unsplash">("pexels");
  const [mediaType, setMediaType] = useState<"photos" | "videos">("photos");
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedImage, setSelectedImage] = useState<StockResult | null>(null);

  const searchStock = async (searchQuery: string, pageNum: number = 1, append = false) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stock-media", {
        body: {
          query: searchQuery,
          source: activeSource,
          type: mediaType,
          page: pageNum,
          perPage: 20,
        },
      });

      if (error) throw error;
      if (data?.results) {
        if (append) {
          setResults(prev => [...prev, ...data.results]);
        } else {
          setResults(data.results);
        }
        setTotalResults(data.total || 0);
        setPage(pageNum);
      }
    } catch (err: any) {
      toast.error(err.message || "Suche fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchStock(query, 1);
  };

  const downloadImage = (item: StockResult) => {
    const a = document.createElement("a");
    a.href = item.downloadUrl;
    a.download = `stock-${item.id}.${item.type === "video" ? "mp4" : "jpg"}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    toast.success("Download gestartet!");
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
        <CardContent className="pt-4 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--sidebar-muted))]" />
              <Input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Stock Bilder suchen... z.B. 'Pferd', 'Natur', 'Business'"
                className="pl-10 bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))]" />
            </div>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Suchen
            </Button>
          </form>

          {/* Quick Tags */}
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_TAGS.map(tag => (
              <button key={tag} onClick={() => { setQuery(tag); searchStock(tag, 1); }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-[hsl(var(--sidebar-border))] hover:border-primary/40 hover:bg-primary/5 transition-all text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-foreground))]">
                {tag}
              </button>
            ))}
          </div>

          {/* Source + Type Toggle */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 border border-[hsl(var(--sidebar-border))] rounded-lg p-0.5">
              <Button variant={activeSource === "pexels" ? "default" : "ghost"} size="sm"
                onClick={() => { setActiveSource("pexels"); if (query) searchStock(query, 1); }}
                className="text-xs h-7 px-3">Pexels</Button>
              <Button variant={activeSource === "unsplash" ? "default" : "ghost"} size="sm"
                onClick={() => { setActiveSource("unsplash"); if (query) searchStock(query, 1); }}
                className="text-xs h-7 px-3">Unsplash</Button>
            </div>
            <div className="flex gap-1 border border-[hsl(var(--sidebar-border))] rounded-lg p-0.5">
              <Button variant={mediaType === "photos" ? "default" : "ghost"} size="sm"
                onClick={() => { setMediaType("photos"); if (query) searchStock(query, 1); }}
                className="text-xs gap-1 h-7 px-3">
                <Camera className="w-3 h-3" /> Fotos
              </Button>
              {activeSource === "pexels" && (
                <Button variant={mediaType === "videos" ? "default" : "ghost"} size="sm"
                  onClick={() => { setMediaType("videos"); if (query) searchStock(query, 1); }}
                  className="text-xs gap-1 h-7 px-3">
                  <Video className="w-3 h-3" /> Videos
                </Button>
              )}
            </div>
            {totalResults > 0 && (
              <Badge variant="outline" className="text-[10px] self-center">
                {totalResults.toLocaleString("de-DE")} Ergebnisse
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      {results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.map(item => (
              <Card key={item.id} className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] overflow-hidden group cursor-pointer"
                onClick={() => setSelectedImage(item)}>
                <div className="relative aspect-[4/3]" style={item.avgColor ? { backgroundColor: item.avgColor } : {}}>
                  <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  {item.type === "video" && item.duration && (
                    <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                      {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, "0")}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                    <span className="text-white text-[10px] truncate max-w-[60%]">📸 {item.photographer}</span>
                    <Button size="sm" variant="secondary" className="h-7 text-[10px] gap-1" onClick={(e) => { e.stopPropagation(); downloadImage(item); }}>
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {results.length < totalResults && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => searchStock(query, page + 1, true)} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Mehr laden
              </Button>
            </div>
          )}
        </>
      ) : !loading ? (
        <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20 text-[hsl(var(--sidebar-muted))]" />
            <p className="text-sm text-[hsl(var(--sidebar-muted))]">Suche nach lizenzfreien Bildern & Videos</p>
            <p className="text-xs text-[hsl(var(--sidebar-muted))] mt-1">Pexels: 200 Anfragen/Std · Unsplash: Unbegrenzt</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Selected Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <CardContent className="pt-4 space-y-3">
              {selectedImage.type === "video" ? (
                <video src={selectedImage.url} controls className="w-full rounded-lg max-h-[60vh]" />
              ) : (
                <img src={selectedImage.url} alt="" className="w-full rounded-lg max-h-[60vh] object-contain" />
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">📸 {selectedImage.photographer}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedImage.width} × {selectedImage.height} · {selectedImage.source === "pexels" ? "Pexels" : "Unsplash"} · Lizenzfrei
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedImage.photographerUrl && (
                    <Button variant="outline" size="sm" onClick={() => window.open(selectedImage.photographerUrl, "_blank")} className="gap-1 text-xs">
                      <ExternalLink className="w-3.5 h-3.5" /> Profil
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => downloadImage(selectedImage)} className="gap-1.5 text-xs">
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedImage(null)} className="text-xs">
                    Schließen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-2 justify-center">
        <Badge variant="outline" className="text-[10px]">Powered by Pexels & Unsplash API</Badge>
        <Badge variant="outline" className="text-[10px]">Alle Medien lizenzfrei</Badge>
      </div>
    </div>
  );
}
