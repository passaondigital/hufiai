import { useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, Upload, Loader2, Save, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CompanySettings() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [companyAddress, setCompanyAddress] = useState((profile as any)?.company_address || "");
  const [taxId, setTaxId] = useState((profile as any)?.tax_id || "");
  const [logoUrl, setLogoUrl] = useState((profile as any)?.company_logo_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (profile?.user_type !== "gewerbe") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Nur für Gewerbe-Nutzer</h2>
            <p className="text-muted-foreground mb-4">Wechsle zu einem Gewerbe-Konto, um diese Seite zu nutzen.</p>
            <Button onClick={() => navigate("/settings")}>Zu den Einstellungen</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const uploadLogo = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("company-logos").getPublicUrl(path);
      setLogoUrl(publicUrl);
      toast.success("Logo hochgeladen");
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        company_name: companyName,
        company_address: companyAddress,
        tax_id: taxId,
        company_logo_url: logoUrl,
      }).eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Firmendaten gespeichert");
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" /> Firmenprofil
        </h1>
        <p className="text-muted-foreground mb-8">Verwalte deine Geschäftsinformationen.</p>

        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          {/* Logo Upload */}
          <div className="mb-6">
            <Label>Firmenlogo</Label>
            <div className="flex items-center gap-4 mt-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Firmenlogo" className="w-16 h-16 rounded-xl object-cover border border-border" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? "Lädt..." : "Logo hochladen"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Firmenname</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" placeholder="Dein Firmenname" />
            </div>
            <div>
              <Label>Adresse</Label>
              <Textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="mt-1" placeholder="Straße, PLZ, Ort" rows={2} />
            </div>
            <div>
              <Label>Steuernummer / USt-IdNr.</Label>
              <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="mt-1" placeholder="z.B. DE123456789" />
            </div>
          </div>

          <Button onClick={saveSettings} disabled={saving} className="mt-6">
            <Save className="w-4 h-4 mr-2" /> {saving ? "Speichert..." : "Firmendaten speichern"}
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Datenschutz-Hinweis</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deine Firmendaten (Logo, Adresse, Steuernummer) sind als <strong>Non-Training Data</strong> markiert und werden
                niemals für KI-Training verwendet – auch wenn du der Horse-LLM Initiative zugestimmt hast. Diese Daten unterliegen
                einem besonderen Schutzstatus gemäß DSGVO.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
