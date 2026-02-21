import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const META_APP_ID = "871587272370698";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const metaAppSecret = Deno.env.get("META_APP_SECRET");

  if (!metaAppSecret) {
    return new Response(JSON.stringify({ error: "META_APP_SECRET not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub;

  try {
    const { action, code, redirect_uri } = await req.json();

    if (action === "get_auth_url") {
      // Return the OAuth URL for the frontend to redirect to
      const scopes = "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement";
      const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${scopes}&response_type=code`;
      return new Response(JSON.stringify({ auth_url: authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange_code") {
      if (!code || !redirect_uri) {
        return new Response(JSON.stringify({ error: "Missing code or redirect_uri" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1. Exchange code for short-lived token
      const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${metaAppSecret}&code=${code}`;
      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        console.error("Token exchange error:", tokenData.error);
        return new Response(JSON.stringify({ error: tokenData.error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const shortLivedToken = tokenData.access_token;

      // 2. Exchange for long-lived token
      const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${metaAppSecret}&fb_exchange_token=${shortLivedToken}`;
      const longLivedRes = await fetch(longLivedUrl);
      const longLivedData = await longLivedRes.json();

      const accessToken = longLivedData.access_token || shortLivedToken;
      const expiresIn = longLivedData.expires_in || 3600;

      // 3. Get Facebook pages
      const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesRes.json();

      let pageId = null;
      let pageAccessToken = null;
      let igUserId = null;
      let igUsername = null;

      if (pagesData.data && pagesData.data.length > 0) {
        const page = pagesData.data[0];
        pageId = page.id;
        pageAccessToken = page.access_token;

        // 4. Get Instagram Business Account linked to this page
        const igRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`);
        const igData = await igRes.json();

        if (igData.instagram_business_account) {
          igUserId = igData.instagram_business_account.id;

          // 5. Get Instagram username
          const igProfileRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}?fields=username&access_token=${pageAccessToken}`);
          const igProfile = await igProfileRes.json();
          igUsername = igProfile.username;
        }
      }

      if (!igUserId) {
        return new Response(JSON.stringify({
          error: "Kein Instagram Business-Konto gefunden. Stelle sicher, dass dein Instagram-Konto als Business- oder Creator-Konto eingerichtet und mit einer Facebook-Seite verknüpft ist."
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 6. Store in database
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      const { error: upsertError } = await supabase
        .from("instagram_connections")
        .upsert({
          user_id: userId,
          instagram_user_id: igUserId,
          instagram_username: igUsername,
          access_token: pageAccessToken || accessToken,
          token_type: "long_lived",
          expires_at: expiresAt,
          page_id: pageId,
          page_access_token: pageAccessToken,
          scopes: ["instagram_basic", "instagram_manage_insights", "pages_show_list", "pages_read_engagement"],
          connected_at: new Date().toISOString(),
        }, { onConflict: "user_id,instagram_user_id" });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        return new Response(JSON.stringify({ error: upsertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        username: igUsername,
        instagram_user_id: igUserId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_connection") {
      const { data, error } = await supabase
        .from("instagram_connections")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ connection: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      const { error } = await supabase
        .from("instagram_connections")
        .delete()
        .eq("user_id", userId);

      return new Response(JSON.stringify({ success: !error }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Instagram OAuth error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
