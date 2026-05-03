import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Shield,
  Brain,
  FileText,
  Trash2,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function HufiDatenschutz() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [dataContrib, setDataContrib] = useState(
    profile?.is_data_contribution_active ?? false
  );
  const [excludeTraining, setExcludeTraining] = useState(
    profile?.exclude_from_training ?? false
  );
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [savingConsent, setSavingConsent] = useState(false);
  const [clearingMemory, setClearingMemory] = useState(false);

  const updateProfile = async (fields: Record<string, unknown>) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("user_id", user.id);
    if (error) throw error;
    await refreshProfile();
  };

  const handleToggleDataContrib = async (value: boolean) => {
    setDataContrib(value);
    try {
      await updateProfile({ is_data_contribution_active: value });
      toast.success(value ? "KI-Training aktiviert" : "KI-Training deaktiviert");
    } catch (err: any) {
      setDataContrib(!value);
      toast.error(err.message);
    }
  };

  const handleToggleExclude = async (value: boolean) => {
    setExcludeTraining(value);
    try {
      await updateProfile({ exclude_from_training: value });
      toast.success(
        value ? "Von Datenverarbeitung ausgeschlossen" : "Datenverarbeitung wieder aktiv"
      );
    } catch (err: any) {
      setExcludeTraining(!value);
      toast.error(err.message);
    }
  };

  const revokeConsent = async () => {
    setSavingConsent(true);
    try {
      await updateProfile({
        is_data_contribution_active: false,
        exclude_from_training: true,
      });
      setDataContrib(false);
      setExcludeTraining(true);
      toast.success("Einwilligung widerrufen");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingConsent(false);
    }
  };

  const clearMemory = async () => {
    setClearingMemory(true);
    try {
      await updateProfile({ bio: null, sub_role: null });
      toast.success("Hufi Memory gelöscht");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setClearingMemory(false);
    }
  };

  const handleDeleteRequest = () => {
    if (deleteConfirm !== "LÖSCHEN") {
      toast.error("Bitte 'LÖSCHEN' eingeben");
      return;
    }
    toast.info(
      "Bitte kontaktiere uns für die vollständige Datenlöschung: support@hufiapp.de"
    );
    setDeleteConfirm("");
  };

  const memoryChips = [
    { label: "Name", value: profile?.display_name },
    {
      label: "Kontotyp",
      value: profile?.user_type === "gewerbe" ? "Gewerbe" : "Privat",
    },
    { label: "Rolle", value: profile?.sub_role },
    { label: "Bio", value: profile?.bio },
  ].filter((c) => c.value);

  const euAiPoints = [
    {
      title: "Nutzerprofil",
      text: "Dein Kontotyp, deine Rolle und dein Profil fließen in die Kontextualisierung von Antworten ein.",
    },
    {
      title: "Chat-Kontext",
      text: "Frühere Nachrichten im Gespräch beeinflussen, wie Hufi antwortet – keine dauerhaften Rückschlüsse ohne Memory.",
    },
    {
      title: "Expertenregeln",
      text: "Redaktionell gepflegte Fachregeln zu Hufpflege, Tiergesundheit und Stallmanagement steuern fachliche Empfehlungen.",
    },
  ];

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-5 pb-10">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold">Datenschutz & Privatsphäre</h1>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-5 h-5 text-primary" />
              DSGVO Einwilligungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">KI-Training (anonymisiert)</p>
                <p className="text-xs text-muted-foreground">
                  Hilf uns, Hufi smarter zu machen – vollständig anonymisiert.
                </p>
              </div>
              <Switch
                checked={dataContrib}
                onCheckedChange={handleToggleDataContrib}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Datenverarbeitung ausschließen</p>
                <p className="text-xs text-muted-foreground">
                  Deine Daten werden nicht für Analysen oder Training genutzt.
                </p>
              </div>
              <Switch
                checked={excludeTraining}
                onCheckedChange={handleToggleExclude}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={revokeConsent}
              disabled={savingConsent}
              className="w-full mt-2"
            >
              Einwilligung widerrufen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="w-5 h-5 text-primary" />
              Hufi Memory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Hufi merkt sich folgendes über dich:
            </p>
            {memoryChips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {memoryChips.map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-xs font-medium"
                  >
                    <span className="text-muted-foreground">{chip.label}:</span>
                    <span>{chip.value}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Noch keine Memory-Daten gespeichert.
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearMemory}
              disabled={clearingMemory}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {clearingMemory ? "Wird gelöscht..." : "Memory löschen"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="w-5 h-5 text-primary" />
              EU AI Act – Warum hat Hufi das entschieden?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              KI-Entscheidungen basieren auf folgenden Faktoren:
            </p>
            <ul className="space-y-3">
              {euAiPoints.map((point) => (
                <li key={point.title} className="space-y-0.5">
                  <p className="text-sm font-medium">{point.title}</p>
                  <p className="text-xs text-muted-foreground">{point.text}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-primary" />
              Datenschutzerklärung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/datenschutz")}
            >
              Datenschutzerklärung ansehen
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Alle Daten löschen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Möchtest du dein Konto und alle Daten vollständig löschen? Dieser Vorgang ist
              unwiderruflich.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Konto & alle Daten löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konto unwiderruflich löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Gib <strong>LÖSCHEN</strong> ein, um die vollständige Datenlöschung zu
                    beantragen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="LÖSCHEN"
                  className="my-2"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirm("")}>
                    Abbrechen
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteRequest}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={deleteConfirm !== "LÖSCHEN"}
                  >
                    Löschung beantragen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
