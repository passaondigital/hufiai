import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[ECOSYSTEM-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

/**
 * Webhook endpoint for external Pascal-Schmid apps to report their connection status back to HufiAi.
 *
 * Expected POST body:
 * {
 *   "source_app": "hufmanager" | "hufiapp" | "memberhorse",
 *   "ecosystem_user_id": "<uuid>",       // user_id in HufiAi
 *   "external_id": "<string>",           // user's ID in the source app
 *   "event": "connected" | "disconnected" | "updated",
 *   "app_version"?: "<string>",
 *   "data_payload"?: { ... }             // optional sync data
 * }
 */

const VALID_APPS = ["hufmanager", "hufiapp", "memberhorse"];
const VALID_EVENTS = ["connected", "disconnected", "updated", "partner_accepted", "partner_rejected"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    const { source_app, ecosystem_user_id, external_id, event, app_version, data_payload } = body;

    logStep("Received webhook", { source_app, event, ecosystem_user_id });

    // Validate required fields
    if (!source_app || !ecosystem_user_id || !external_id || !event) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: source_app, ecosystem_user_id, external_id, event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!VALID_APPS.includes(source_app)) {
      return new Response(
        JSON.stringify({ error: `Invalid source_app. Must be one of: ${VALID_APPS.join(", ")}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!VALID_EVENTS.includes(event)) {
      return new Response(
        JSON.stringify({ error: `Invalid event. Must be one of: ${VALID_EVENTS.join(", ")}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify the user exists
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(ecosystem_user_id);
    if (userError || !userData?.user) {
      logStep("User not found", { ecosystem_user_id });
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Handle partner invitation responses
    if (event === "partner_accepted" || event === "partner_rejected") {
      const partnerName = data_payload?.partner_name || data_payload?.partner_email || "Ein Partner";
      const accepted = event === "partner_accepted";

      // Create in-app notification for the inviter
      const { error: notifError } = await supabaseClient
        .from("notifications")
        .insert({
          title: accepted
            ? `${partnerName} hat die Einladung angenommen`
            : `${partnerName} hat die Einladung abgelehnt`,
          message: accepted
            ? `${partnerName} ist jetzt als Partner (#prid) in deinem Ökosystem aktiv und kann auf die freigegebenen Daten zugreifen.`
            : `${partnerName} hat deine Partner-Einladung abgelehnt. Die Zugriffsrechte wurden nicht aktiviert.`,
          type: accepted ? "success" : "warning",
          created_by: ecosystem_user_id,
          is_global: false,
        });

      if (notifError) {
        logStep("Notification insert error", notifError);
      }

      // Update access_grant status if grant_id provided
      if (data_payload?.grant_id) {
        const hufmanagerClient = createClient(
          "https://vnschgjxkzzwzefqlrji.supabase.co",
          Deno.env.get("HUFMANAGER_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        await hufmanagerClient
          .from("access_grants")
          .update({
            status: accepted ? "active" : "rejected",
            is_active: accepted,
          })
          .eq("id", data_payload.grant_id);
      }

      logStep("Partner event processed", { event, partnerName });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Partner ${event} notification created`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map event to status
    const statusMap: Record<string, string> = {
      connected: "connected",
      disconnected: "not_connected",
      updated: "connected",
    };
    const newStatus = statusMap[event];

    // Upsert ecosystem link
    const upsertData: Record<string, unknown> = {
      user_id: ecosystem_user_id,
      app_key: source_app,
      external_id,
      status: newStatus,
    };

    if (event === "connected") {
      upsertData.connected_at = new Date().toISOString();
    }

    const { error: upsertError } = await supabaseClient
      .from("ecosystem_links")
      .upsert(upsertData, { onConflict: "user_id,app_key" });

    if (upsertError) {
      logStep("Upsert error", upsertError);
      throw new Error(`Database error: ${upsertError.message}`);
    }

    logStep("Link updated", { source_app, event, newStatus });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Status for ${source_app} updated to ${newStatus}`,
        app_key: source_app,
        status: newStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
