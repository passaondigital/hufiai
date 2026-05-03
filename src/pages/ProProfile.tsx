import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Award, MapPin, Globe, Phone, Save, Loader2, Plus, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");
  const [certificates, setCertificates] = useState<string[]>([]);
  const [newCert, setNewCert] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [publicProfile, setPublicProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setCertificates(profile.certificates || []);
      setServiceArea(profile.service_area || "");
      setPhone(profile.phone || "");
      setWebsite(profile.website || "");
      setPublicProfile(profile.public_profile || false);
    }
  }, [profile]);

  const addCertificate = () => {
    if (newCert.trim() && !certificates.includes(newCert.trim())) {
      setCertificates([...certificates, newCert.trim()]);
      setNewCert("");
    }
  };

  const removeCertificate = (cert: string) => {
    setCertificates(certificates.filter((c) => c !== cert));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        bio,
        certificates,
        service_area: serviceArea,
        phone,
        website,
        public_profile: publicProfile,
      })
      .eq("user_id", user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Profil gespeichert!");
      await refreshProfile();
    }
    setSaving(false);
  };

  const isProRole = profile?.sub_role && ["hufbearbeiter", "tierarzt", "stallbetreiber"].includes(profile.sub_role);

  if (!isProRole) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Experten-Profil</h2>
            <p className="text-muted-foreground text-sm">
              Diese Funktion ist für professionelle Dienstleister (Hufbearbeiter, Tierärzte, Stallbetreiber) verfügbar. 
              Wechsle in den Einstellungen zum Gewerbe-Modus und wähle deine Fachrolle.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" /> Experten-Profil
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dein professionelles Profil für Kunden und die Experten-Suche.
          </p>
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Öffentliches Profil</p>
              <p className="text-xs text-muted-foreground">Pferdebesitzer können dich in der Experten-Suche finden.</p>
            </div>
          </div>
          <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label>Über mich / Fachbeschreibung</Label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Beschreibe deine Erfahrung, Spezialisierung und Arbeitsweise..."
            className="min-h-[120px]"
          />
        </div>

        {/* Certificates */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Award className="w-4 h-4" /> Zertifikate & Qualifikationen</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {certificates.map((cert) => (
              <Badge key={cert} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                {cert}
                <button onClick={() => removeCertificate(cert)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCert}
              onChange={(e) => setNewCert(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCertificate())}
              placeholder="z.B. FN-Hufschmied, Tierarzt-Approbation..."
            />
            <Button variant="outline" onClick={addCertificate} disabled={!newCert.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Location */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Einsatzgebiet</Label>
            <Input
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="z.B. Raum München, 50km Umkreis"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49..." />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Website</Label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Profil speichern
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          ⚖️ Hufi ist eine KI-Assistenz. Dein Profil dient der Vernetzung – alle fachlichen Entscheidungen liegen bei dir als Experte vor Ort.
        </p>
      </div>
    </AppLayout>
  );
}
