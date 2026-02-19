import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTERNAL_URL = "https://vnschgjxkzzwzefqlrji.supabase.co";

// Mapping: which column in each HufManager table links to the ecosystem_id
const OWNER_COLUMN: Record<string, string> = {
  horses: "owner_id",
  profiles: "id",
  contacts: "provider_id",
  appointments: "provider_id",
  hoof_analyses: "provider_id",
  hoof_entries: "provider_id",
  hoof_history: "provider_id",
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
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the calling user via HufiAi JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const localUrl = Deno.env.get("SUPABASE_URL")!;
    const localAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const localServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify JWT with anon client
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

    // Fetch user's ecosystem_id from local profiles using service role (bypasses RLS)
    const localAdmin = createClient(localUrl, localServiceKey, {
      auth: { persistSession: false },
    });

    const { data: profileData, error: profileError } = await localAdmin
      .from("profiles")
      .select("ecosystem_id")
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

    // Create external HufManager client with service role key (full access)
    const externalServiceKey = Deno.env.get("HUFMANAGER_SERVICE_ROLE_KEY");
    if (!externalServiceKey) {
      throw new Error("HUFMANAGER_SERVICE_ROLE_KEY not configured");
    }

    const hufmanager = createClient(EXTERNAL_URL, externalServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const { action, table, data, filters, select, id, order, limit } = body;

    // Allowed tables for security
    const ALLOWED_TABLES = Object.keys(OWNER_COLUMN);

    if (!ALLOWED_TABLES.includes(table)) {
      return new Response(JSON.stringify({ error: `Table '${table}' is not allowed` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerCol = OWNER_COLUMN[table];
    let result: any;

    switch (action) {
      case "select": {
        let query = hufmanager.from(table).select(select || "*");

        // STRICT: Always filter by ecosystem_id
        query = query.eq(ownerCol, ecosystemId);

        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            // Prevent overriding the owner filter
            if (key === ownerCol) continue;
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
        // Auto-inject app_source + owner reference
        const enrich = (d: any) => ({
          ...d,
          app_source: "hufiapp",
          [ownerCol]: ecosystemId,
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
        // Verify the record belongs to this user before updating
        const { data: existing } = await hufmanager
          .from(table)
          .select("id")
          .eq("id", id)
          .eq(ownerCol, ecosystemId)
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
        // Verify ownership before deleting
        const { data: existingDel } = await hufmanager
          .from(table)
          .select("id")
          .eq("id", id)
          .eq(ownerCol, ecosystemId)
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

    return new Response(JSON.stringify({ data: result.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("hufmanager-proxy error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
