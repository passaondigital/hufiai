import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Ecosystem app registry — each app exposes a /api/ecosystem/status endpoint
const ECOSYSTEM_APPS: Record<string, { baseUrl: string; idLabel: string }> = {
  hufmanager: { baseUrl: "https://hufmanager.de", idLabel: "#pid" },
  hufiai: { baseUrl: "", idLabel: "#kid" }, // self — handled internally
  hufiapp: { baseUrl: "https://hufiapp.de", idLabel: "#eqid" },
  memberhorse: { baseUrl: "https://memberhorse.de", idLabel: "#mid" },
};

interface AppStatus {
  app_key: string;
  status: "connected" | "not_connected" | "update_required" | "error";
  external_id: string | null;
  data_sharing_enabled: boolean;
  app_version?: string | null;
  message?: string;
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[CHECK-ECOSYSTEM] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Fetch existing ecosystem links
    const { data: existingLinks } = await supabaseClient
      .from("ecosystem_links")
      .select("*")
      .eq("user_id", user.id);

    const linksMap: Record<string, any> = {};
    (existingLinks ?? []).forEach((l: any) => { linksMap[l.app_key] = l; });

    const results: AppStatus[] = [];

    for (const [appKey, appConfig] of Object.entries(ECOSYSTEM_APPS)) {
      const existingLink = linksMap[appKey];

      // Self-check for HufiAi
      if (appKey === "hufiai") {
        const status: AppStatus = {
          app_key: appKey,
          status: existingLink?.status === "connected" ? "connected" : "not_connected",
          external_id: existingLink?.external_id ?? user.id,
          data_sharing_enabled: existingLink?.data_sharing_enabled ?? false,
        };

        // Auto-connect HufiAi if not yet connected
        if (status.status === "not_connected") {
          await supabaseClient.from("ecosystem_links").upsert({
            user_id: user.id,
            app_key: "hufiai",
            external_id: user.id,
            status: "connected",
            connected_at: new Date().toISOString(),
          }, { onConflict: "user_id,app_key" });
          status.status = "connected";
          status.external_id = user.id;
        }

        results.push(status);
        continue;
      }

      // For external apps, call their ecosystem status endpoint
      if (!existingLink || existingLink.status === "not_connected") {
        results.push({
          app_key: appKey,
          status: "not_connected",
          external_id: null,
          data_sharing_enabled: false,
        });
        continue;
      }

      // Check remote status
      try {
        const statusUrl = `${appConfig.baseUrl}/api/ecosystem/status`;
        logStep(`Checking ${appKey}`, { url: statusUrl });

        const response = await fetch(statusUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ecosystem_user_id: user.id,
            external_id: existingLink.external_id,
            source_app: "hufiai",
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          logStep(`${appKey} responded`, data);

          const newStatus = data.active ? "connected" : "update_required";

          // Sync status back to ecosystem_links
          if (existingLink.status !== newStatus) {
            await supabaseClient
              .from("ecosystem_links")
              .update({ status: newStatus })
              .eq("user_id", user.id)
              .eq("app_key", appKey);
          }

          results.push({
            app_key: appKey,
            status: newStatus,
            external_id: existingLink.external_id,
            data_sharing_enabled: existingLink.data_sharing_enabled,
            app_version: data.app_version ?? null,
            message: data.message ?? null,
          });
        } else {
          logStep(`${appKey} returned error`, { status: response.status });
          await response.text(); // consume body
          results.push({
            app_key: appKey,
            status: "error",
            external_id: existingLink.external_id,
            data_sharing_enabled: existingLink.data_sharing_enabled,
            message: `App returned HTTP ${response.status}`,
          });
        }
      } catch (fetchErr) {
        logStep(`${appKey} unreachable`, { error: String(fetchErr) });
        results.push({
          app_key: appKey,
          status: existingLink.status === "connected" ? "update_required" : "not_connected",
          external_id: existingLink.external_id,
          data_sharing_enabled: existingLink.data_sharing_enabled,
          message: "App nicht erreichbar",
        });
      }
    }

    logStep("Results", results);
    return new Response(JSON.stringify({ apps: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
