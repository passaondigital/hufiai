import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { hufmanagerClient } from "@/lib/hufmanager-client";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Mail, UserPlus, Eye, Stethoscope, CalendarCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface PartnerInviteFormProps {
  onInvited?: () => void;
}

export default function PartnerInviteForm({ onInvited }: PartnerInviteFormProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);

  const [canViewBasic, setCanViewBasic] = useState(true);
  const [canViewMedical, setCanViewMedical] = useState(false);
  const [canCreateAppointments, setCanCreateAppointments] = useState(false);

  const isProvider = profile?.user_type === "gewerbe";

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Bitte E-Mail-Adresse eingeben");
      return;
    }
    if (!profile?.ecosystem_id) {
      toast.error("Keine Ecosystem-ID vorhanden");
      return;
    }

    setSending(true);
    try {
      await hufmanagerClient.insert("access_grants", {
        [isProvider ? "provider_id" : "client_id"]: profile.ecosystem_id,
        partner_email: email.trim(),
        partner_name: name.trim() || null,
        can_view_basic: canViewBasic,
        can_view_medical: canViewMedical,
        can_create_appointments: canCreateAppointments,
        is_active: true,
        status: "pending",
        app_source: "hufiapp",
      });
      // Send invitation email via edge function
      try {
        await supabase.functions.invoke("send-partner-invite", {
          body: {
            partner_email: email.trim(),
            partner_name: name.trim() || null,
            permissions: {
              can_view_basic: canViewBasic,
              can_view_medical: canViewMedical,
              can_create_appointments: canCreateAppointments,
            },
          },
        });
      } catch (emailErr) {
        console.warn("E-Mail konnte nicht gesendet werden:", emailErr);
      }

      toast.success(`Einladung an ${email} gesendet`);
      setOpen(false);
      setEmail("");
      setName("");
      setCanViewBasic(true);
      setCanViewMedical(false);
      setCanCreateAppointments(false);
      onInvited?.();
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Einladen");
    } finally {
      setSending(false);
    }
  };

  if (!profile?.ecosystem_id) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Partner einladen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Partner einladen (#prid)
          </DialogTitle>
          <DialogDescription>
            Lade einen externen Partner (z.B. Tierarzt, Therapeut) ein und vergib direkt Berechtigungen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="partner-email">E-Mail-Adresse *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="partner-email"
                type="email"
                placeholder="partner@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner-name">Name (optional)</Label>
            <Input
              id="partner-name"
              placeholder="Dr. Müller"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Berechtigungen</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Wähle aus, welche Daten der Partner einsehen darf.
            </p>

            <div className="space-y-2">
              <PermissionRow
                icon={<Eye className="w-4 h-4" />}
                label="Basisdaten"
                description="Name, Rasse, Standort"
                checked={canViewBasic}
                onChange={setCanViewBasic}
              />
              <PermissionRow
                icon={<Stethoscope className="w-4 h-4" />}
                label="Medizinische Daten"
                description="Hufanalysen, Gesundheit"
                checked={canViewMedical}
                onChange={setCanViewMedical}
              />
              <PermissionRow
                icon={<CalendarCheck className="w-4 h-4" />}
                label="Termine erstellen"
                description="Kann Termine anlegen"
                checked={canCreateAppointments}
                onChange={setCanCreateAppointments}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Abbrechen
          </Button>
          <Button onClick={handleInvite} disabled={sending || !email.trim()} className="gap-2">
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}
            Einladen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg p-3 border transition-colors ${
      checked ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
    }`}>
      <div className="flex items-center gap-2">
        <span className={checked ? "text-primary" : "text-muted-foreground"}>{icon}</span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
