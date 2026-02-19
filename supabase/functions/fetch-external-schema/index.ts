import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const EXTERNAL_URL = "https://vnschgjxkzzwzefqlrji.supabase.co";
  const EXTERNAL_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc2NoZ2p4a3p6d3plZnFscmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDQ0MDEsImV4cCI6MjA4MDMyMDQwMX0.DMeqIJjj99sl-Rlo5dRyBmVD1WZWaayxeppa51reocs";

  const resp = await fetch(`${EXTERNAL_URL}/rest/v1/`, {
    headers: {
      apikey: EXTERNAL_ANON,
      Authorization: `Bearer ${EXTERNAL_ANON}`,
    },
  });

  const data = await resp.json();
  
  // Extract table definitions from OpenAPI spec
  const definitions = data?.definitions || {};
  const tables: Record<string, any> = {};
  
  for (const [name, def] of Object.entries(definitions)) {
    const props = (def as any)?.properties || {};
    tables[name] = Object.entries(props).map(([col, info]: [string, any]) => ({
      column: col,
      type: info.type || info.format || "unknown",
      format: info.format,
      description: info.description,
    }));
  }

  return new Response(JSON.stringify({ tables: Object.keys(tables), details: tables }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
