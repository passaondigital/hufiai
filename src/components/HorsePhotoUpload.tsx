import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface HorsePhotoUploadProps {
  horseId: string;
  userId: string;
  currentUrl: string | null;
  onUploaded: (url: string | null) => void;
}

export default function HorsePhotoUpload({ horseId, userId, currentUrl, onUploaded }: HorsePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Bitte wähle ein Bild aus.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maximale Dateigröße: 5 MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${horseId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("horse-photos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("horse-photos")
        .getPublicUrl(path);

      // Add cache-buster
      const url = `${publicUrl}?t=${Date.now()}`;

      await supabase.from("user_horses").update({ photo_url: url }).eq("id", horseId);
      onUploaded(url);
      toast.success("Foto hochgeladen!");
    } catch (err: any) {
      toast.error(err.message || "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    setUploading(true);
    try {
      // Try to delete from storage (ignore errors if file doesn't exist)
      const path = currentUrl?.split("/horse-photos/")[1]?.split("?")[0];
      if (path) {
        await supabase.storage.from("horse-photos").remove([path]);
      }
      await supabase.from("user_horses").update({ photo_url: null }).eq("id", horseId);
      onUploaded(null);
      toast.success("Foto entfernt");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Camera className="w-4 h-4 mr-1" />}
        {currentUrl ? "Foto ändern" : "Foto hochladen"}
      </Button>
      {currentUrl && !uploading && (
        <Button type="button" variant="ghost" size="sm" onClick={remove} className="text-destructive">
          <X className="w-4 h-4 mr-1" /> Entfernen
        </Button>
      )}
    </div>
  );
}
