import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTERNAL_URL = "https://vnschgjxkzzwzefqlrji.supabase.co";

// ── Role types in external HufManager DB ──
type ExternalRole = "provider" | "client" | "employee" | "partner" | "business";

// ── Per-role filter column mapping ──
// Each role defines which column to filter on for each allowed table.
// "provider" = #pid, "client" = #kid, "employee" = #mid, "partner" = #prid, "business" = #bid

const ROLE_TABLE_FILTERS: Record<ExternalRole, Record<string, string>> = {
  // #pid – Provider/Hufbearbeiter: filter by provider_id on most tables
  provider: {
    horses: "owner_id", // Provider sees horses of their clients (via access_grants), but owns none directly
    profiles: "id",
    contacts: "provider_id",
    appointments: "provider_id",
    hoof_analyses: "provider_id",
    hoof_entries: "created_by",
    hoof_history: "created_by",
    hoof_photos: "provider_id",
    horse_documents: "provider_id",
    services: "provider_id",
    invoices: "provider_id",
    access_grants: "provider_id",
    safe_horses: "provider_id",
    safe_appointments: "provider_id",
    safe_reviews: "provider_id",
    ecosystem_links: "user_id",
    ecosystem_apps: "user_id",
    employee_profiles: "provider_id",
    offers: "provider_id",
    daily_tours: "provider_id",
    work_sessions: "provider_id",
    inventory_items: "provider_id",
    office_documents: "provider_id",
    office_templates: "provider_id",
    provider_documents: "provider_id",
    conversations: "provider_id",
  },

  // #kid – Client/Pferdebesitzer: filter by owner_id (horses) or client_id (appointments)
  client: {
    horses: "owner_id",
    profiles: "id",
    appointments: "client_id",
    hoof_analyses: "provider_id", // Clients see analyses linked to their horses (filtered via horse join)
    hoof_entries: "created_by",
    hoof_history: "created_by",
    hoof_photos: "provider_id",
    horse_documents: "provider_id",
    access_grants: "client_id",
    safe_horses: "provider_id",
    safe_appointments: "provider_id",
    ecosystem_links: "user_id",
    conversations: "client_id",
  },

  // #mid – Employee: inherits provider scope via employee_profiles.provider_id
  // Resolved at runtime – uses provider's filter map with the employer's ecosystem_id
  employee: {},

  // #prid – Partner/Therapeut: access via access_grants to specific horses/data
  // Very limited: only horses + appointments they're granted access to
  partner: {
    profiles: "id",
    access_grants: "provider_id", // partner is listed as "provider" in access_grants
    horses: "owner_id", // Filtered further via access_grants at runtime
    appointments: "provider_id",
    hoof_analyses: "provider_id",
    ecosystem_links: "user_id",
  },

  // #bid – Business/Reitstall: filter by organization_id
  business: {
    horses: "organization_id",
    profiles: "organization_id",
    appointments: "organization_id",
    contacts: "organization_id",
    employee_profiles: "organization_id",
    services: "provider_id",
    invoices: "provider_id",
    offers: "provider_id",
    ecosystem_links: "user_id",
    ecosystem_apps: "user_id",
  },
};

// ── Resolve the effective role, filter column, and ecosystem ID ──
interface ResolvedAccess {
  role: ExternalRole;
  filterColumn: string;
  effectiveEcosystemId: string;
  organizationId?: string;
}

async function resolveAccess(
  hufmanager: any,
  ecosystemId: string,
  table: string
): Promise<ResolvedAccess | { error: string; status: number }> {
  // 1. Fetch the external profile to determine the role
  const { data: extProfile, error: extError } = await hufmanager
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", ecosystemId)
    .maybeSingle();

  if (extError) {
    console.error("External profile lookup error:", extError);
    return { error: "Externes Profil konnte nicht geladen werden", status: 500 };
  }

  if (!extProfile) {
    return { error: "Kein Profil in der HufManager-Datenbank gefunden für diese Ecosystem-ID", status: 404 };
  }

  const rawRole = (extProfile.role || "client").toLowerCase() as string;
  let role: ExternalRole;

  // Map HufManager role strings to our enum
  if (rawRole === "provider" || rawRole === "admin") {
    role = "provider";
  } else if (rawRole === "client") {
    role = "client";
  } else if (rawRole === "employee") {
    role = "employee";
  } else if (rawRole === "partner" || rawRole === "therapist") {
    role = "partner";
  } else if (rawRole === "business" || rawRole === "stable") {
    role = "business";
  } else {
    role = "client"; // Default fallback
  }

  // 2. Handle employee (#mid) – resolve to employer's scope
  if (role === "employee") {
    const { data: empProfile } = await hufmanager
      .from("employee_profiles")
      .select("provider_id, organization_id")
      .eq("user_id", ecosystemId)
      .eq("status", "active")
      .maybeSingle();

    if (!empProfile?.provider_id) {
      return { error: "Mitarbeiter-Profil nicht gefunden oder inaktiv", status: 403 };
    }

    // Use provider's filter map with employer's ID
    const providerFilters = ROLE_TABLE_FILTERS.provider;
    const filterColumn = providerFilters[table];
    if (!filterColumn) {
      return { error: `Tabelle '${table}' ist für Mitarbeiter nicht zugänglich`, status: 403 };
    }

    return {
      role: "employee",
      filterColumn,
      effectiveEcosystemId: empProfile.provider_id,
      organizationId: empProfile.organization_id,
    };
  }

  // 3. Handle business (#bid) – use organization_id
  if (role === "business" && extProfile.organization_id) {
    const businessFilters = ROLE_TABLE_FILTERS.business;
    const filterColumn = businessFilters[table];
    if (!filterColumn) {
      return { error: `Tabelle '${table}' ist für Business-Accounts nicht zugänglich`, status: 403 };
    }

    // For org-level tables filter by organization_id, for others by profile id
    const useOrgId = ["horses", "appointments", "contacts", "employee_profiles"].includes(table);
    return {
      role: "business",
      filterColumn,
      effectiveEcosystemId: useOrgId ? extProfile.organization_id : ecosystemId,
      organizationId: extProfile.organization_id,
    };
  }

  // 4. Standard role resolution (provider, client, partner)
  const roleFilters = ROLE_TABLE_FILTERS[role];
  const filterColumn = roleFilters[table];
  if (!filterColumn) {
    return { error: `Tabelle '${table}' ist für die Rolle '${role}' nicht zugänglich`, status: 403 };
  }

  return {
    role,
    filterColumn,
    effectiveEcosystemId: ecosystemId,
    organizationId: extProfile.organization_id,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Authenticate the calling user via HufiAi JWT ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const localUrl = Deno.env.get("SUPABASE_URL")!;
    const localAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const localServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const localClient = createClient(localUrl, localAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await localClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // ── Fetch ecosystem_id from local profiles ──
    const localAdmin = createClient(localUrl, localServiceKey, {
      auth: { persistSession: false },
    });

    const { data: profileData, error: profileError } = await localAdmin
      .from("profiles")
      .select("ecosystem_id, user_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return new Response(JSON.stringify({ error: "Profil konnte nicht geladen werden" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ecosystemId = profileData?.ecosystem_id;
    if (!ecosystemId) {
      return new Response(JSON.stringify({ error: "Keine Ecosystem-ID (#ID) in deinem Profil hinterlegt. Bitte vervollständige dein Profil." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Create external HufManager client ──
    const externalServiceKey = Deno.env.get("HUFMANAGER_SERVICE_ROLE_KEY");
    if (!externalServiceKey) {
      throw new Error("HUFMANAGER_SERVICE_ROLE_KEY not configured");
    }

    const hufmanager = createClient(EXTERNAL_URL, externalServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const { action, table, data, filters, select, id, order, limit } = body;

    // ── Resolve role-based access ──
    const access = await resolveAccess(hufmanager, ecosystemId, table);
    if ("error" in access) {
      return new Response(JSON.stringify({ error: access.error }), {
        status: access.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { filterColumn, effectiveEcosystemId, role } = access;
    let result: any;

    switch (action) {
      case "select": {
        let query = hufmanager.from(table).select(select || "*");

        // STRICT: Always filter by role-specific column
        query = query.eq(filterColumn, effectiveEcosystemId);

        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (key === filterColumn) continue; // Prevent override
            query = query.eq(key, value);
          }
        }
        if (order) {
          query = query.order(order.column, { ascending: order.ascending ?? true });
        }
        if (limit) {
          query = query.limit(limit);
        }
        result = await query;
        break;
      }

      case "insert": {
        // Validate write access based on role
        const writeBlockedRoles: ExternalRole[] = ["partner"]; // Partners are read-only
        if (writeBlockedRoles.includes(role)) {
          return new Response(JSON.stringify({ error: "Keine Schreibberechtigung für diese Rolle" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const enrich = (d: any) => ({
          ...d,
          app_source: "hufiapp",
          [filterColumn]: effectiveEcosystemId,
        });
        const insertData = Array.isArray(data)
          ? data.map(enrich)
          : enrich(data);
        result = await hufmanager.from(table).insert(insertData).select();
        break;
      }

      case "update": {
        if (!id) {
          return new Response(JSON.stringify({ error: "id required for update" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const writeBlockedRolesUpd: ExternalRole[] = ["partner"];
        if (writeBlockedRolesUpd.includes(role)) {
          return new Response(JSON.stringify({ error: "Keine Schreibberechtigung für diese Rolle" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify ownership
        const { data: existing } = await hufmanager
          .from(table)
          .select("id")
          .eq("id", id)
          .eq(filterColumn, effectiveEcosystemId)
          .maybeSingle();

        if (!existing) {
          return new Response(JSON.stringify({ error: "Datensatz nicht gefunden oder kein Zugriff" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = await hufmanager.from(table).update({ ...data, app_source: "hufiapp" }).eq("id", id).select();
        break;
      }

      case "delete": {
        if (!id) {
          return new Response(JSON.stringify({ error: "id required for delete" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const writeBlockedRolesDel: ExternalRole[] = ["partner", "employee"];
        if (writeBlockedRolesDel.includes(role)) {
          return new Response(JSON.stringify({ error: "Keine Löschberechtigung für diese Rolle" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: existingDel } = await hufmanager
          .from(table)
          .select("id")
          .eq("id", id)
          .eq(filterColumn, effectiveEcosystemId)
          .maybeSingle();

        if (!existingDel) {
          return new Response(JSON.stringify({ error: "Datensatz nicht gefunden oder kein Zugriff" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = await hufmanager.from(table).delete().eq("id", id);
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action '${action}'` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (result.error) {
      console.error("HufManager proxy error:", result.error);
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: result.data, meta: { role, ecosystemId } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("hufmanager-proxy error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
