import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Globe, Award, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface PublicExpert {
  id: string;
  display_name: string | null;
  sub_role: string | null;
  bio: string | null;
  certificates: string[] | null;
  service_area: string | null;
  phone: string | null;
  website: string | null;
  company_name: string | null;
}

const SUB_ROLE_LABELS: Record<string, string> = {
  hufbearbeiter: "Hufbearbeiter/in",
  tierarzt: "Tierarzt/Tierärztin",
  stallbetreiber: "Stallbetreiber/in",
};

const SUB_ROLE_EMOJI: Record<string, string> = {
  hufbearbeiter: "🔨",
  tierarzt: "🩺",
  stallbetreiber: "🏠",
};

export default function ExpertenSuche() {
  const [experts, setExperts] = useState<PublicExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, sub_role, bio, certificates, service_area, phone, website, company_name")
      .eq("public_profile", true)
      .in("sub_role", ["hufbearbeiter", "tierarzt", "stallbetreiber"]);

    setExperts((data as PublicExpert[]) || []);
    setLoading(false);
  };

  const filtered = experts.filter((e) => {
    if (roleFilter && e.sub_role !== roleFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.display_name?.toLowerCase().includes(term) ||
      e.service_area?.toLowerCase().includes(term) ||
      e.company_name?.toLowerCase().includes(term) ||
      e.bio?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück</span>
          </Link>
          <h1 className="text-lg font-bold text-foreground">HufiAi Experten-Suche</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">
            Finde einen Experten in deiner Nähe
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Zertifizierte Hufbearbeiter, Tierärzte und Stallbetreiber – geprüft und bereit, dir und deinem Pferd zu helfen.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, Ort oder Stichwort…"
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["hufbearbeiter", "tierarzt", "stallbetreiber"] as const).map((role) => (
              <Button
                key={role}
                size="sm"
                variant={roleFilter === role ? "default" : "outline"}
                onClick={() => setRoleFilter(roleFilter === role ? null : role)}
              >
                {SUB_ROLE_EMOJI[role]} {SUB_ROLE_LABELS[role]}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Keine Experten gefunden. Versuche eine andere Suche.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((expert) => (
              <Card key={expert.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-lg text-foreground">
                        {SUB_ROLE_EMOJI[expert.sub_role || ""] || "👤"}{" "}
                        {expert.display_name || "Experte"}
                      </p>
                      {expert.company_name && (
                        <p className="text-sm text-muted-foreground">{expert.company_name}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {SUB_ROLE_LABELS[expert.sub_role || ""] || expert.sub_role}
                    </Badge>
                  </div>

                  {expert.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{expert.bio}</p>
                  )}

                  {expert.certificates && expert.certificates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {expert.certificates.map((cert, i) => (
                        <Badge key={i} variant="outline" className="text-xs gap-1">
                          <Award className="w-3 h-3" /> {cert}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                    {expert.service_area && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {expert.service_area}
                      </span>
                    )}
                    {expert.phone && (
                      <a href={`tel:${expert.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Phone className="w-3 h-3" /> {expert.phone}
                      </a>
                    )}
                    {expert.website && (
                      <a
                        href={expert.website.startsWith("http") ? expert.website : `https://${expert.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Globe className="w-3 h-3" /> Website
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-4">
          ⚖️ HufiAi ist eine KI-Assistenz. Alle fachlichen Entscheidungen liegen beim Experten vor Ort.
        </p>
      </main>
    </div>
  );
}
