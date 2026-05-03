import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Clock,
  Tag,
  CreditCard,
  Save,
  Loader2,
} from "lucide-react";

const DAYS = [
  { key: "mo", label: "Mo" },
  { key: "di", label: "Di" },
  { key: "mi", label: "Mi" },
  { key: "do", label: "Do" },
  { key: "fr", label: "Fr" },
  { key: "sa", label: "Sa" },
  { key: "so", label: "So" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

interface DaySchedule {
  open: boolean;
  from: string;
  to: string;
}

type OpeningHours = Record<DayKey, DaySchedule>;

const DEFAULT_HOURS: OpeningHours = {
  mo: { open: true, from: "08:00", to: "17:00" },
  di: { open: true, from: "08:00", to: "17:00" },
  mi: { open: true, from: "08:00", to: "17:00" },
  do: { open: true, from: "08:00", to: "17:00" },
  fr: { open: true, from: "08:00", to: "17:00" },
  sa: { open: false, from: "09:00", to: "13:00" },
  so: { open: false, from: "09:00", to: "13:00" },
};

const PAYMENT_OPTIONS = [
  { key: "bar", label: "Bar" },
  { key: "ueberweisung", label: "Überweisung" },
  { key: "paypal", label: "PayPal" },
  { key: "karte", label: "Kartenzahlung" },
] as const;

type PaymentKey = (typeof PAYMENT_OPTIONS)[number]["key"];

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function BusinessEinstellungen() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [companyAddress, setCompanyAddress] = useState(
    (profile as any)?.company_address || ""
  );
  const [taxId, setTaxId] = useState((profile as any)?.tax_id || "");
  const [saving, setSaving] = useState(false);

  const [hours, setHours] = useState<OpeningHours>(() =>
    loadJson<OpeningHours>("business_opening_hours", DEFAULT_HOURS)
  );

  const [leistungen, setLeistungen] = useState<string>(() =>
    loadJson<string>("business_leistungen", "")
  );

  const [payments, setPayments] = useState<Record<PaymentKey, boolean>>(() =>
    loadJson("business_payments", {
      bar: false,
      ueberweisung: false,
      paypal: false,
      karte: false,
    })
  );

  useEffect(() => {
    localStorage.setItem("business_opening_hours", JSON.stringify(hours));
  }, [hours]);

  useEffect(() => {
    localStorage.setItem("business_leistungen", JSON.stringify(leistungen));
  }, [leistungen]);

  useEffect(() => {
    localStorage.setItem("business_payments", JSON.stringify(payments));
  }, [payments]);

  if (profile?.user_type !== "gewerbe") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center max-w-sm">
            <Building2 className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Nur für Gewerbe-Nutzer</h2>
            <p className="text-muted-foreground mb-5 text-sm">
              Wechsle zu einem Gewerbe-Konto, um Business-Einstellungen zu nutzen.
            </p>
            <Button onClick={() => navigate("/settings")}>Zu den Einstellungen</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const saveSupabaseFields = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: companyName,
          company_address: companyAddress,
          tax_id: taxId,
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Betriebsdaten gespeichert");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setDayField = (
    day: DayKey,
    field: keyof DaySchedule,
    value: boolean | string
  ) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const togglePayment = (key: PaymentKey) => {
    setPayments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
          <h1 className="text-xl md:text-2xl font-bold">Business Einstellungen</h1>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-5 h-5 text-primary" />
              Betriebsdaten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company-name">Betriebsname</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1"
                placeholder="Dein Betriebsname"
              />
            </div>
            <div>
              <Label htmlFor="company-address">Adresse</Label>
              <Input
                id="company-address"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="mt-1"
                placeholder="Straße, PLZ, Ort"
              />
            </div>
            <div>
              <Label htmlFor="tax-id">Steuernummer</Label>
              <Input
                id="tax-id"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="mt-1"
                placeholder="z.B. DE123456789"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-5 h-5 text-primary" />
              Öffnungszeiten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DAYS.map((day, idx) => (
              <div key={day.key}>
                {idx > 0 && <Separator className="mb-3" />}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <Switch
                      checked={hours[day.key].open}
                      onCheckedChange={(v) => setDayField(day.key, "open", v)}
                    />
                    <span className="text-sm font-medium w-6">{day.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {hours[day.key].open ? "Geöffnet" : "Geschlossen"}
                    </span>
                  </div>
                  {hours[day.key].open && (
                    <div className="flex items-center gap-2 ml-1 sm:ml-auto">
                      <Input
                        type="time"
                        value={hours[day.key].from}
                        onChange={(e) => setDayField(day.key, "from", e.target.value)}
                        className="w-28 text-sm"
                      />
                      <span className="text-muted-foreground text-xs">bis</span>
                      <Input
                        type="time"
                        value={hours[day.key].to}
                        onChange={(e) => setDayField(day.key, "to", e.target.value)}
                        className="w-28 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="w-5 h-5 text-primary" />
              Preise & Leistungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="leistungen">Leistungsbeschreibung</Label>
            <textarea
              id="leistungen"
              value={leistungen}
              onChange={(e) => setLeistungen(e.target.value)}
              placeholder="Beschreibe deine angebotenen Leistungen und Preise..."
              rows={5}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-5 h-5 text-primary" />
              Zahlungsoptionen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PAYMENT_OPTIONS.map((opt) => (
              <div key={opt.key} className="flex items-center justify-between">
                <span className="text-sm font-medium">{opt.label}</span>
                <Switch
                  checked={payments[opt.key]}
                  onCheckedChange={() => togglePayment(opt.key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Button onClick={saveSupabaseFields} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? "Wird gespeichert..." : "Speichern"}
        </Button>
      </div>
    </AppLayout>
  );
}
