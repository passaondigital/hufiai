import { supabase } from "@/integrations/supabase/client";

export type HufManagerTable =
  | "horses"
  | "profiles"
  | "contacts"
  | "appointments"
  | "hoof_analyses"
  | "hoof_entries"
  | "hoof_history"
  | "hoof_photos"
  | "horse_documents"
  | "services"
  | "invoices";

interface SelectOptions {
  select?: string;
  filters?: Record<string, any>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

async function callProxy(body: Record<string, any>) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Nicht eingeloggt");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const resp = await fetch(
    `https://${projectId}.supabase.co/functions/v1/hufmanager-proxy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    }
  );

  const result = await resp.json();
  if (!resp.ok) throw new Error(result.error || "Proxy-Fehler");
  return result.data;
}

export const hufmanagerClient = {
  select: (table: HufManagerTable, options?: SelectOptions) =>
    callProxy({ action: "select", table, ...options }),

  insert: (table: HufManagerTable, data: Record<string, any> | Record<string, any>[]) =>
    callProxy({ action: "insert", table, data }),

  update: (table: HufManagerTable, id: string, data: Record<string, any>) =>
    callProxy({ action: "update", table, id, data }),

  delete: (table: HufManagerTable, id: string) =>
    callProxy({ action: "delete", table, id }),
};
