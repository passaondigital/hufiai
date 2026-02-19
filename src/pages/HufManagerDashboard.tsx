import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { hufmanagerClient } from "@/lib/hufmanager-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Heart, Calendar, FileText, Search, Handshake } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ActivePartnersOverview from "@/components/ActivePartnersOverview";

interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  role?: string;
}

interface Horse {
  id: string;
  name: string;
  breed?: string;
  age?: number;
  color?: string;
  owner_name?: string;
  notes?: string;
}

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

interface HoofAnalysis {
  id: string;
  horse_id?: string;
  horse_name?: string;
  analysis_date?: string;
  findings?: string;
  recommendations?: string;
  status?: string;
}

export default function HufManagerDashboard() {
  const [activeTab, setActiveTab] = useState("contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [analyses, setAnalyses] = useState<HoofAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());

  const loadTab = async (tab: string) => {
    if (loadedTabs.has(tab)) return;
    setLoading(true);
    try {
      switch (tab) {
        case "contacts": {
          const data = await hufmanagerClient.select("contacts", { limit: 200 });
          setContacts(data || []);
          break;
        }
        case "horses": {
          const data = await hufmanagerClient.select("horses", { limit: 200 });
          setHorses(data || []);
          break;
        }
        case "appointments": {
          const data = await hufmanagerClient.select("appointments", {
            order: { column: "date", ascending: false },
            limit: 100,
          });
          setAppointments(data || []);
          break;
        }
        case "analyses": {
          const data = await hufmanagerClient.select("hoof_analyses", {
            order: { column: "analysis_date", ascending: false },
            limit: 100,
          });
          setAnalyses(data || []);
          break;
        }
      }
      setLoadedTabs((prev) => new Set(prev).add(tab));
    } catch (err: any) {
      toast.error(`Fehler beim Laden: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab]);

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (c.first_name?.toLowerCase().includes(q)) ||
      (c.last_name?.toLowerCase().includes(q)) ||
      (c.email?.toLowerCase().includes(q)) ||
      (c.city?.toLowerCase().includes(q))
    );
  });

  const filteredHorses = horses.filter((h) => {
    const q = search.toLowerCase();
    return !q || h.name?.toLowerCase().includes(q) || h.breed?.toLowerCase().includes(q);
  });

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto">
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
          <div>
            <h1 className="text-2xl font-bold">HufManager</h1>
            <p className="text-sm text-muted-foreground">
              Daten aus deiner verbundenen HufManager-App
            </p>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="contacts" className="gap-1.5">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Kunden</span>
              </TabsTrigger>
              <TabsTrigger value="horses" className="gap-1.5">
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Pferde</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="gap-1.5">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Termine</span>
              </TabsTrigger>
              <TabsTrigger value="analyses" className="gap-1.5">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Analysen</span>
              </TabsTrigger>
              <TabsTrigger value="partners" className="gap-1.5">
                <Handshake className="w-4 h-4" />
                <span className="hidden sm:inline">Partner</span>
              </TabsTrigger>
            </TabsList>

            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            <TabsContent value="contacts" className="mt-4">
              {!loading && filteredContacts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Keine Kunden gefunden.</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredContacts.map((c) => (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {[c.first_name, c.last_name].filter(Boolean).join(" ") || "Unbekannt"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                      {c.email && <p>✉ {c.email}</p>}
                      {c.phone && <p>📞 {c.phone}</p>}
                      {c.city && <p>📍 {c.city}</p>}
                      {c.role && <Badge variant="outline" className="mt-1">{c.role}</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="horses" className="mt-4">
              {!loading && filteredHorses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Keine Pferde gefunden.</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredHorses.map((h) => (
                  <Card key={h.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">🐴 {h.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                      {h.breed && <p>Rasse: {h.breed}</p>}
                      {h.age != null && <p>Alter: {h.age} Jahre</p>}
                      {h.color && <p>Farbe: {h.color}</p>}
                      {h.owner_name && <p>Besitzer: {h.owner_name}</p>}
                      {h.notes && <p className="line-clamp-2">{h.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="mt-4">
              {!loading && appointments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Keine Termine gefunden.</p>
              )}
              <div className="space-y-2">
                {appointments.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {a.date ? new Date(a.date).toLocaleDateString("de-DE") : "Kein Datum"}
                          {a.time ? ` · ${a.time}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[a.contact_name, a.horse_name].filter(Boolean).join(" – ") || a.type || "Termin"}
                        </p>
                        {a.notes && <p className="text-xs text-muted-foreground line-clamp-1">{a.notes}</p>}
                      </div>
                      {a.status && (
                        <Badge variant={a.status === "done" ? "default" : "secondary"}>
                          {a.status}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analyses" className="mt-4">
              {!loading && analyses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Keine Analysen gefunden.</p>
              )}
              <div className="space-y-2">
                {analyses.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {a.horse_name || "Pferd"}
                          {a.analysis_date ? ` · ${new Date(a.analysis_date).toLocaleDateString("de-DE")}` : ""}
                        </p>
                        {a.status && <Badge variant="outline">{a.status}</Badge>}
                      </div>
                      {a.findings && <p className="text-xs text-muted-foreground">{a.findings}</p>}
                      {a.recommendations && (
                        <p className="text-xs text-primary">💡 {a.recommendations}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="partners" className="mt-4">
              <ActivePartnersOverview />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
