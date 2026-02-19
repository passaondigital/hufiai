import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("display_name, company_name, user_type, ecosystem_id")
      .eq("user_id", userId)
      .single();

    const { partner_email, partner_name, permissions } = await req.json();

    if (!partner_email) {
      return new Response(
        JSON.stringify({ error: "partner_email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const senderName =
      senderProfile?.company_name ||
      senderProfile?.display_name ||
      "Ein HufiAi-Nutzer";
    const isProvider = senderProfile?.user_type === "gewerbe";
    const roleLabel = isProvider ? "Provider" : "Pferdebesitzer";

    const permList: string[] = [];
    if (permissions?.can_view_basic) permList.push("📋 Basisdaten (Name, Rasse, Standort)");
    if (permissions?.can_view_medical)
      permList.push("🩺 Medizinische Daten (Hufanalysen, Gesundheit)");
    if (permissions?.can_create_appointments)
      permList.push("📅 Termine erstellen");

    const permissionsHtml =
      permList.length > 0
        ? `<ul style="margin:12px 0;padding-left:20px;">${permList.map((p) => `<li style="margin:4px 0;">${p}</li>`).join("")}</ul>`
        : "<p>Keine spezifischen Berechtigungen vergeben.</p>";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#16a34a;font-size:24px;margin:0;">🐴 HufiAi</h1>
    <p style="color:#666;font-size:14px;margin-top:4px;">Ecosystem Partner-Einladung</p>
  </div>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:20px;">
    <h2 style="margin:0 0 12px 0;font-size:18px;">Hallo ${partner_name || "Partner"},</h2>
    <p style="margin:0 0 16px 0;line-height:1.6;">
      <strong>${senderName}</strong> (${roleLabel}) hat dich als Partner (#prid) im HufiAi-Ökosystem eingeladen.
    </p>

    <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="font-weight:600;margin:0 0 8px 0;">Freigegebene Berechtigungen:</p>
      ${permissionsHtml}
    </div>

    <p style="margin:16px 0 0 0;line-height:1.6;color:#666;font-size:14px;">
      Als Partner erhältst du Lesezugriff auf die freigegebenen Daten. Du kannst die Einladung annehmen, indem du dich bei HufiAi anmeldest.
    </p>
  </div>

  <div style="text-align:center;margin:24px 0;">
    <a href="https://hufiai.lovable.app/auth" style="background:#16a34a;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
      Einladung annehmen
    </a>
  </div>

  <div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">
      Diese E-Mail wurde automatisch von HufiAi gesendet.<br>
      Bei Fragen wende dich an den Absender oder besuche
      <a href="https://hufiai.lovable.app" style="color:#16a34a;">hufiai.lovable.app</a>.
    </p>
  </div>
</body>
</html>`;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "HufiAi Ecosystem <noreply@hufmanager.de>",
        to: [partner_email],
        subject: `${senderName} hat dich als Partner eingeladen – HufiAi`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResp.json();

    if (!resendResp.ok) {
      console.error("Resend error:", resendData);
      return new Response(
        JSON.stringify({
          error: "E-Mail konnte nicht gesendet werden",
          details: resendData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, email_id: resendData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("send-partner-invite error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
