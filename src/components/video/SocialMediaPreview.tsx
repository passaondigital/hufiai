import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, Send, Bookmark, Share2, ThumbsUp, Repeat2, MoreHorizontal, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SocialMediaPreviewProps {
  imageUrl?: string;
  videoUrl?: string;
  platform?: string;
}

export default function SocialMediaPreview({ imageUrl, videoUrl, platform }: SocialMediaPreviewProps) {
  const [activePlatform, setActivePlatform] = useState(platform || "instagram");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("#pferdeliebe #hufpflege #equestrian");
  const [accountName, setAccountName] = useState("mein_account");
  const [previewUrl, setPreviewUrl] = useState(imageUrl || "");

  const mediaUrl = previewUrl || imageUrl || videoUrl || "";

  const shareToSocial = (p: string) => {
    const text = `${caption}\n\n${hashtags}`;
    const shareUrls: Record<string, string> = {
      instagram: mediaUrl,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(mediaUrl)}&summary=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(mediaUrl)}`,
    };

    if (p === "instagram") {
      navigator.clipboard.writeText(`${caption}\n\n${hashtags}`);
      toast.success("Caption & Hashtags kopiert! Öffne Instagram zum Posten 📸");
    } else {
      window.open(shareUrls[p], "_blank");
      toast.success(`Wird auf ${p} geteilt...`);
    }
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(`${caption}\n\n${hashtags}`);
    toast.success("Caption kopiert!");
  };

  return (
    <div className="space-y-4">
      {/* Content Input */}
      <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Content vorbereiten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={previewUrl}
            onChange={e => setPreviewUrl(e.target.value)}
            placeholder="Bild- oder Video-URL einfügen..."
            className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-xs"
          />
          <Input
            value={accountName}
            onChange={e => setAccountName(e.target.value)}
            placeholder="Account-Name"
            className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-xs"
          />
          <Textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Caption schreiben..."
            className="min-h-[60px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-xs"
            rows={2}
          />
          <Input
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            placeholder="#hashtags"
            className="bg-[hsl(var(--sidebar-background))] border-[hsl(var(--sidebar-border))] text-xs"
          />
        </CardContent>
      </Card>

      {/* Platform Previews */}
      <Tabs value={activePlatform} onValueChange={setActivePlatform}>
        <TabsList className="bg-[hsl(var(--sidebar-accent))] border border-[hsl(var(--sidebar-border))] w-full">
          <TabsTrigger value="instagram" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs flex-1">
            📸 Instagram
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs flex-1">
            💼 LinkedIn
          </TabsTrigger>
          <TabsTrigger value="twitter" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs flex-1">
            🐦 Twitter/X
          </TabsTrigger>
        </TabsList>

        {/* Instagram Preview */}
        <TabsContent value="instagram">
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] overflow-hidden">
            <div className="bg-white text-black">
              {/* Header */}
              <div className="flex items-center gap-2 p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[10px] font-bold">
                    {accountName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <span className="text-xs font-semibold">{accountName}</span>
                <MoreHorizontal className="w-4 h-4 ml-auto" />
              </div>
              {/* Media */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {mediaUrl ? (
                  mediaUrl.includes(".mp4") || videoUrl ? (
                    <video src={mediaUrl || videoUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                  )
                ) : (
                  <p className="text-gray-400 text-xs">Bild/Video einfügen</p>
                )}
              </div>
              {/* Actions */}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-4">
                  <Heart className="w-5 h-5" />
                  <MessageCircle className="w-5 h-5" />
                  <Send className="w-5 h-5" />
                  <Bookmark className="w-5 h-5 ml-auto" />
                </div>
                <p className="text-xs"><span className="font-semibold">{accountName}</span> {caption || "Caption hier..."}</p>
                {hashtags && <p className="text-xs text-blue-600">{hashtags}</p>}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* LinkedIn Preview */}
        <TabsContent value="linkedin">
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] overflow-hidden">
            <div className="bg-white text-black">
              {/* Header */}
              <div className="flex items-center gap-2 p-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {accountName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold">{accountName}</p>
                  <p className="text-[10px] text-gray-500">Hufbearbeitung & Pferdegesundheit · Gerade eben</p>
                </div>
              </div>
              {/* Text */}
              <div className="px-3 pb-2">
                <p className="text-xs whitespace-pre-wrap">{caption || "Dein LinkedIn-Post hier..."}</p>
                {hashtags && <p className="text-xs text-blue-600 mt-1">{hashtags}</p>}
              </div>
              {/* Media */}
              {mediaUrl && (
                <div className="aspect-[1.91/1] bg-gray-100">
                  <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {/* Actions */}
              <div className="flex items-center justify-around p-3 border-t border-gray-200">
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <ThumbsUp className="w-4 h-4" /> Gefällt mir
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <MessageCircle className="w-4 h-4" /> Kommentieren
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Repeat2 className="w-4 h-4" /> Teilen
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Send className="w-4 h-4" /> Senden
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Twitter Preview */}
        <TabsContent value="twitter">
          <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] overflow-hidden">
            <div className="bg-white text-black p-3">
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {accountName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold">{accountName}</span>
                    <span className="text-xs text-gray-500">@{accountName} · jetzt</span>
                  </div>
                  <p className="text-xs mt-1 whitespace-pre-wrap">{caption || "Dein Tweet hier..."}</p>
                  {hashtags && <p className="text-xs text-blue-500 mt-1">{hashtags}</p>}
                  {/* Media */}
                  {mediaUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
                      <img src={mediaUrl} alt="" className="w-full aspect-video object-cover" />
                    </div>
                  )}
                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3 text-gray-500 max-w-[280px]">
                    <MessageCircle className="w-4 h-4" />
                    <Repeat2 className="w-4 h-4" />
                    <Heart className="w-4 h-4" />
                    <Share2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Buttons */}
      <Card className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" /> Direkt teilen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={() => shareToSocial("instagram")} variant="outline" className="text-xs gap-1.5 h-10">
              📸 Instagram
            </Button>
            <Button onClick={() => shareToSocial("linkedin")} variant="outline" className="text-xs gap-1.5 h-10">
              💼 LinkedIn
            </Button>
            <Button onClick={() => shareToSocial("twitter")} variant="outline" className="text-xs gap-1.5 h-10">
              🐦 Twitter/X
            </Button>
          </div>
          <Button onClick={copyCaption} variant="outline" className="w-full text-xs gap-1.5 h-9">
            <Copy className="w-3 h-3" /> Caption & Hashtags kopieren
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
