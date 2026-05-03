import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { hufmanagerClient } from "@/lib/hufmanager-client";
import AppLayout from "@/components/AppLayout";
import { Loader2, Calendar, FileText, PawPrint, Users, Plus, ChevronRight, AlertCircle, Clock } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { de } from "date-fns/locale";

interface Appointment {
  id: string;
  date?: string;
  time?: string;
  status?: string;
  horse_name?: string;
  contact_name?: string;
  notes?: string;
  type?: string;
}

interface Invoice {
  id: string;
  status?: string;
  total_amount?: number;
  amount?: number;
  customer_name?: string;
  contact_name?: string;
  created_at?: string;
}

interface Horse {
  id: string;
  name: string;
  known_issues?: string | null;
  last_trim_date?: string | null;
}

const TODAY = new Date().toISOString().split("T")[0];

function greeting(name: string | null | undefined) {
  const h = new Date().getHours();
  const salut = h < 12 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
  return `${salut}${name ? `, ${name}` : ""}`;
}

function appointmentLabel(appt: Appointment) {
  const parts: string[] = [];
  if (appt.time) parts.push(appt.time.slice(0, 5));
  if (appt.horse_name) parts.push(appt.horse_name);
  if (appt.contact_name) parts.push(`· ${appt.contact_name}`);
  return parts.join(" ");
}

function statusColor(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "abgeschlossen" || s === "done" || s === "completed") return "bg-green-500";
  if (s === "abgesagt" || s === "cancelled") return "bg-red-400";
  if (s === "unterwegs" || s === "in_progress") return "bg-amber-400";
  return "bg-blue-400";
}

function dateLabel(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Heute";
    if (isTomorrow(d)) return "Morgen";
    return format(d, "EEE, d. MMM", { locale: de });
  } catch {
    return dateStr;
  }
}

export default function CommandCenter() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: appointments, isLoading: apptLoading, error: apptError } = useQuery<Appointment[]>({
    queryKey: ["bhs-appointments"],
    queryFn: () =>
      hufmanagerClient.select("appointments", {
        order: { column: "date", ascending: true },
        limit: 100,
      }),
    retry: 1,
    staleTime: 3 * 60 * 1000,
  });

  const { data: invoices, isLoading: invLoading } = useQuery<Invoice[]>({
    queryKey: ["bhs-invoices"],
    queryFn: () =>
      hufmanagerClient.select("invoices", {
        order: { column: "created_at", ascending: false },
        limit: 100,
      }),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: horses, isLoading: horsesLoading } = useQuery<Horse[]>({
    queryKey: ["bhs-horses"],
    queryFn: () =>
      hufmanagerClient.select("horses", { limit: 200 }),
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery<{ id: string }[]>({
    queryKey: ["bhs-contacts"],
    queryFn: () =>
      hufmanagerClient.select("contacts", {
        select: "id",
        limit: 500,
      }),
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });

  const todayAppts = (appointments ?? []).filter((a) => a.date === TODAY);
  const upcomingAppts = (appointments ?? [])
    .filter((a) => a.date && a.date > TODAY)
    .slice(0, 5);

  const openInvoices = (invoices ?? []).filter((i) => {
    const s = (i.status ?? "").toLowerCase();
    return !["bezahlt", "paid", "abgeschlossen"].includes(s);
  });

  const horsesWithIssues = (horses ?? []).filter((h) => h.known_issues && h.known_issues.trim() !== "");

  const isLoading = apptLoading || invLoading || horsesLoading || contactsLoading;

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-5">

        {/* Greeting */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
          <h1 className="text-xl font-bold text-foreground mt-0.5">
            {greeting(profile?.display_name ?? profile?.company_name)}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Daten werden geladen…"
              : todayAppts.length > 0
              ? `${todayAppts.length} Termin${todayAppts.length !== 1 ? "e" : ""} heute`
              : "Heute keine Termine — freier Tag!"}
          </p>
        </div>

        {/* Stat-Karten */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Heute"
            value={apptLoading ? "…" : String(todayAppts.length)}
            sub="Termine"
            color="orange"
            onClick={() => navigate("/hufmanager")}
          />
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Offen"
            value={invLoading ? "…" : String(openInvoices.length)}
            sub="Rechnungen"
            color={openInvoices.length > 0 ? "red" : "green"}
            onClick={() => navigate("/hufmanager")}
          />
          <StatCard
            icon={<PawPrint className="w-5 h-5" />}
            label="Pferde"
            value={horsesLoading ? "…" : String((horses ?? []).length)}
            sub={horsesWithIssues.length > 0 ? `${horsesWithIssues.length} mit Befund` : "im System"}
            color="blue"
            onClick={() => navigate("/horses")}
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Kunden"
            value={contactsLoading ? "…" : String((contacts ?? []).length)}
            sub="Kontakte"
            color="gray"
            onClick={() => navigate("/hufmanager")}
          />
        </div>

        {/* Heutige Termine */}
        <Section
          title="Heutige Tour"
          action={todayAppts.length > 0 ? { label: "Alle", onClick: () => navigate("/hufmanager") } : undefined}
        >
          {apptLoading && <LoadingRow />}
          {apptError && (
            <ErrorRow message="Termine konnten nicht geladen werden." />
          )}
          {!apptLoading && !apptError && todayAppts.length === 0 && (
            <EmptyRow message="Keine Termine für heute eingetragen." />
          )}
          {todayAppts.map((appt) => (
            <AppointmentRow key={appt.id} appt={appt} />
          ))}
        </Section>

        {/* Nächste Termine */}
        {!apptLoading && upcomingAppts.length > 0 && (
          <Section
            title="Nächste Termine"
            action={{ label: "Alle", onClick: () => navigate("/hufmanager") }}
          >
            {upcomingAppts.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} showDate />
            ))}
          </Section>
        )}

        {/* Offene Rechnungen */}
        {openInvoices.length > 0 && (
          <Section
            title="Offene Rechnungen"
            action={{ label: "Alle", onClick: () => navigate("/hufmanager") }}
          >
            {openInvoices.slice(0, 5).map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 py-3 border-b border-border last:border-0"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {inv.customer_name ?? inv.contact_name ?? "Kunde unbekannt"}
                  </p>
                  {(inv.total_amount || inv.amount) && (
                    <p className="text-xs text-muted-foreground">
                      {((inv.total_amount ?? inv.amount ?? 0) / 100).toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </p>
                  )}
                </div>
                <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                  Offen
                </span>
              </div>
            ))}
            {openInvoices.length > 5 && (
              <p className="text-xs text-muted-foreground pt-2 text-center">
                + {openInvoices.length - 5} weitere
              </p>
            )}
          </Section>
        )}

        {/* Schnellaktionen */}
        <Section title="Schnellaktionen">
          <div className="grid grid-cols-1 gap-2 pt-1">
            <QuickAction
              label="Termin dokumentieren"
              sub="Befund + Rechnung in 3 Minuten"
              icon={<Clock className="w-5 h-5 text-primary" />}
              onClick={() => navigate("/hufmanager")}
            />
            <QuickAction
              label="Neues Pferd aufnehmen"
              sub="Pferdakte anlegen"
              icon={<Horse className="w-5 h-5 text-primary" />}
              onClick={() => navigate("/horses")}
            />
            <QuickAction
              label="Rechnung erstellen"
              sub="Aus Termin oder manuell"
              icon={<FileText className="w-5 h-5 text-primary" />}
              onClick={() => navigate("/hufmanager")}
            />
            <QuickAction
              label="Hufi fragen"
              sub="Chat, Voice oder Befundvorschlag"
              icon={<Plus className="w-5 h-5 text-primary" />}
              onClick={() => navigate("/chat")}
            />
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}

// --- Sub-components ---

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: "orange" | "red" | "green" | "blue" | "gray";
  onClick?: () => void;
}) {
  const bg: Record<string, string> = {
    orange: "bg-orange-50 border-orange-200",
    red: "bg-red-50 border-red-200",
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    gray: "bg-muted border-border",
  };
  const iconColor: Record<string, string> = {
    orange: "text-orange-500",
    red: "text-red-500",
    green: "text-green-600",
    blue: "text-blue-500",
    gray: "text-muted-foreground",
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-opacity active:opacity-70 ${bg[color]}`}
    >
      <div className={`mb-2 ${iconColor[color]}`}>{icon}</div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-foreground leading-none mt-0.5">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </button>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs text-primary font-medium flex items-center gap-0.5"
          >
            {action.label}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

function AppointmentRow({ appt, showDate }: { appt: Appointment; showDate?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor(appt.status)}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{appointmentLabel(appt)}</p>
        {appt.notes && (
          <p className="text-xs text-muted-foreground truncate">{appt.notes}</p>
        )}
      </div>
      {showDate && appt.date && (
        <span className="text-xs text-muted-foreground shrink-0">{dateLabel(appt.date)}</span>
      )}
    </div>
  );
}

function QuickAction({
  label,
  sub,
  icon,
  onClick,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 py-3 px-1 rounded-lg active:bg-muted transition-colors text-left w-full"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center gap-2 py-4 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Wird geladen…</span>
    </div>
  );
}

function ErrorRow({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 py-4 text-muted-foreground">
      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <p className="py-4 text-sm text-muted-foreground text-center">{message}</p>
  );
}
