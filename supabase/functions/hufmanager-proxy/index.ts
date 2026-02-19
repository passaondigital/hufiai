import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTERNAL_URL = "https://vnschgjxkzzwzefqlrji.supabase.co";

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
    const ALLOWED_TABLES = [
      "horses", "profiles", "contacts", "appointments",
      "hoof_analyses", "hoof_entries", "hoof_history", "hoof_photos",
      "horse_documents", "services", "invoices", "access_grants",
      "safe_horses", "safe_appointments", "safe_reviews",
      "ecosystem_links", "ecosystem_apps",
    ];

    if (!ALLOWED_TABLES.includes(table)) {
      return new Response(JSON.stringify({ error: `Table '${table}' is not allowed` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any;

    switch (action) {
      case "select": {
        let query = hufmanager.from(table).select(select || "*");
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
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
        // Auto-inject app_source for traceability
        const insertData = Array.isArray(data)
          ? data.map((d: any) => ({ ...d, app_source: "hufiapp" }))
          : { ...data, app_source: "hufiapp" };
        result = await hufmanager.from(table).insert(insertData).select();
        break;
      }

      case "update": {
        if (!id) {
          return new Response(JSON.stringify({ error: "id required for update" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
