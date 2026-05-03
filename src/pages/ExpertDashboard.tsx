import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Loader2, CheckCircle, XCircle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface HorseShare {
  id: string;
  horse_id: string;
  owner_id: string;
  expert_id: string | null;
  expert_email: string;
  status: string;
  permissions: string;
  created_at: string;
  horse?: { name: string; breed: string | null; known_issues: string | null; hoof_type: string | null; ai_summary: string | null };
  owner?: { display_name: string | null };
}

export default function ExpertDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [shares, setShares] = useState<HorseShare[]>([]);
  const [loading, setLoading] = useState(true);

  // For horse owners: invite expert
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteHorseId, setInviteHorseId] = useState("");
  const [horses, setHorses] = useState<any[]>([]);
  const [inviting, setInviting] = useState(false);

  const isExpert = profile?.sub_role && ["hufbearbeiter", "tierarzt", "stallbetreiber"].includes(profile.sub_role);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch shares where user is expert
    const { data: expertShares } = await supabase
      .from("horse_shares")
      .select("*")
      .eq("expert_id", user.id);

    // Fetch shares where user is owner
    const { data: ownerShares } = await supabase
      .from("horse_shares")
      .select("*")
      .eq("owner_id", user.id);

    const allShares = [...(expertShares || []), ...(ownerShares || [])];

    // Enrich with horse and owner data
    const enriched: HorseShare[] = [];
    for (const share of allShares) {
      const { data: horse } = await supabase
        .from("user_horses")
        .select("name, breed, known_issues, hoof_type, ai_summary")
        .eq("id", share.horse_id)
        .single();

      const { data: owner } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", share.owner_id)
        .single();

      enriched.push({ ...share, horse: horse || undefined, owner: owner || undefined });
    }

    setShares(enriched);

    // Fetch user's horses for invite form
    const { data: userHorses } = await supabase
      .from("user_horses")
      .select("id, name")
      .eq("user_id", user.id);
    setHorses(userHorses || []);

    setLoading(false);
  };

  const inviteExpert = async () => {
    if (!user || !inviteEmail.trim() || !inviteHorseId) return;
    setInviting(true);
    const { error } = await supabase.from("horse_shares").insert({
      horse_id: inviteHorseId,
      owner_id: user.id,
      expert_email: inviteEmail.trim().toLowerCase(),
      status: "pending",
    });
    if (error) {
      if (error.code === "23505") toast.error("Dieser Experte wurde bereits eingeladen.");
      else toast.error(error.message);
    } else {
      toast.success("Einladung gesendet!");
      setInviteEmail("");
      setInviteHorseId("");
      fetchData();
    }
    setInviting(false);
  };

  const acceptShare = async (shareId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("horse_shares")
      .update({ status: "accepted", expert_id: user.id })
      .eq("id", shareId);
    if (error) toast.error(error.message);
    else { toast.success("Freigabe akzeptiert!"); fetchData(); }
  };

  const revokeShare = async (shareId: string) => {
    const { error } = await supabase
      .from("horse_shares")
      .update({ status: "revoked" })
      .eq("id", shareId);
    if (error) toast.error(error.message);
    else { toast.success("Freigabe widerrufen."); fetchData(); }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const pendingShares = shares.filter((s) => s.status === "pending" && s.expert_id === user?.id);
  const activeShares = shares.filter((s) => s.status === "accepted");
  const myInvites = shares.filter((s) => s.owner_id === user?.id);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Experten-Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isExpert
              ? "Hier siehst du alle Pferde, die mit dir geteilt wurden."
              : "Teile die Daten deines Pferdes mit einem Experten."}
          </p>
        </div>

        {/* Invite Form (for horse owners) */}
        {horses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Experten einladen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                <select
                  value={inviteHorseId}
                  onChange={(e) => setInviteHorseId(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="">Pferd wählen…</option>
                  {horses.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="E-Mail des Experten"
                  type="email"
                />
                <Button onClick={inviteExpert} disabled={inviting || !inviteEmail || !inviteHorseId}>
                  {inviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Einladen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending invites (for experts) */}
        {pendingShares.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold">Offene Einladungen</h2>
            {pendingShares.map((share) => (
              <Card key={share.id} className="border-primary/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">🐴 {share.horse?.name || "Unbekannt"}</p>
                    <p className="text-xs text-muted-foreground">Von: {share.owner?.display_name || "Pferdebesitzer"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => acceptShare(share.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Annehmen
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => revokeShare(share.id)}>
                      <XCircle className="w-4 h-4 mr-1" /> Ablehnen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Active shares */}
        {activeShares.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold">Geteilte Pferde</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {activeShares.map((share) => (
                <Card key={share.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg">🐴 {share.horse?.name || "–"}</p>
                        <p className="text-xs text-muted-foreground">
                          {share.owner_id === user?.id ? "Geteilt mit Experte" : `Besitzer: ${share.owner?.display_name || "–"}`}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {share.permissions === "read_write" ? "Lesen & Schreiben" : "Nur Lesen"}
                      </span>
                    </div>
                    {share.horse && (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {share.horse.breed && <p>Rasse: {share.horse.breed}</p>}
                        {share.horse.hoof_type && <p>Huftyp: {share.horse.hoof_type === "barefoot" ? "Barhuf" : share.horse.hoof_type === "shod" ? "Beschlagen" : "Alternativ"}</p>}
                        {share.horse.known_issues && <p>Bekannte Probleme: {share.horse.known_issues}</p>}
                        {share.horse.ai_summary && (
                          <p className="mt-2 p-2 rounded-lg bg-primary/5 text-xs">🤖 {share.horse.ai_summary}</p>
                        )}
                      </div>
                    )}
                    {share.owner_id === user?.id && (
                      <Button size="sm" variant="ghost" className="mt-3 text-destructive" onClick={() => revokeShare(share.id)}>
                        Freigabe widerrufen
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* My invites (owner view) */}
        {myInvites.length > 0 && !isExpert && (
          <div className="space-y-3">
            <h2 className="font-semibold">Meine Einladungen</h2>
            {myInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-sm">
                <div>
                  <span className="font-medium">🐴 {inv.horse?.name}</span>
                  <span className="text-muted-foreground ml-2">→ {inv.expert_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    inv.status === "accepted" ? "bg-primary/10 text-primary" :
                    inv.status === "pending" ? "bg-muted text-muted-foreground" :
                    "bg-destructive/10 text-destructive"
                  }`}>
                    {inv.status === "accepted" ? "Akzeptiert" : inv.status === "pending" ? "Ausstehend" : "Widerrufen"}
                  </span>
                  {inv.status !== "revoked" && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => revokeShare(inv.id)}>
                      <XCircle className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {shares.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {isExpert
                ? "Noch keine Pferde mit dir geteilt. Pferdebesitzer können dich über deine E-Mail einladen."
                : "Lade einen Experten ein, um die Daten deines Pferdes zu teilen."}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          ⚖️ Hufi ist eine KI-Assistenz. Geteilte Daten dienen der Zusammenarbeit – alle fachlichen Entscheidungen liegen beim Experten vor Ort.
        </p>
      </div>
    </AppLayout>
  );
}
