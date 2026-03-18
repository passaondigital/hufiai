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
  | "invoices"
  | "access_grants"
  | "safe_horses"
  | "safe_appointments"
  | "safe_reviews"
  | "ecosystem_links"
  | "ecosystem_apps"
  | "employee_profiles"
  | "offers"
  | "daily_tours"
  | "work_sessions"
  | "inventory_items"
  | "office_documents"
  | "office_templates"
  | "provider_documents"
  | "conversations";

interface SelectOptions {
  select?: string;
  filters?: Record<string, any>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

interface RetryOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_RETRY: RetryOptions = {
  maxRetries: 3,
  retryDelayMs: 1000,
};

function isRetryable(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function logSync(
  userId: string,
  action: string,
  table: string,
  status: "success" | "failed",
  durationMs: number,
  errorMessage?: string,
  recordCount?: number
) {
  try {
    await supabase.from("ecosystem_sync_log").insert({
      user_id: userId,
      sync_type: `${action}:${table}`,
      direction: action === "select" ? "download" : "upload",
      status,
      duration_ms: durationMs,
      record_count: recordCount ?? 0,
      error_message: errorMessage ?? null,
      metadata: { table, action },
    });
  } catch (e) {
    console.warn("[ecosystem] Failed to log sync:", e);
  }
}

async function logError(
  userId: string,
  errorType: string,
  errorMessage: string,
  requestPayload?: Record<string, any>
) {
  try {
    await supabase.from("ecosystem_errors").insert({
      user_id: userId,
      error_type: errorType,
      error_message: errorMessage,
      request_payload: requestPayload ?? null,
      auto_retry_scheduled: false,
      user_notified: true,
    });
  } catch (e) {
    console.warn("[ecosystem] Failed to log error:", e);
  }
}

async function callProxy(
  body: Record<string, any>,
  retry: RetryOptions = DEFAULT_RETRY
) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const userId = sessionData?.session?.user?.id;
  if (!token || !userId) throw new Error("Nicht eingeloggt");

  const { maxRetries = 3, retryDelayMs = 1000, onRetry } = retry;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/hufmanager-proxy`;

  let lastError: Error = new Error("Unknown error");
  const startTime = performance.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });

      const result = await resp.json();
      const durationMs = Math.round(performance.now() - startTime);

      if (!resp.ok) {
        const error = new Error(result.error || `HTTP ${resp.status}`);

        // Non-retryable client errors (4xx except 429)
        if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) {
          await logSync(userId, body.action, body.table, "failed", durationMs, error.message);
          await logError(userId, "api_error", error.message, body);
          throw error;
        }

        lastError = error;
        if (attempt < maxRetries && isRetryable(error)) {
          const delay = retryDelayMs * Math.pow(2, attempt); // Exponential backoff
          onRetry?.(attempt + 1, error);
          console.warn(`[ecosystem] Retry ${attempt + 1}/${maxRetries} in ${delay}ms:`, error.message);
          await sleep(delay);
          continue;
        }

        await logSync(userId, body.action, body.table, "failed", durationMs, error.message);
        await logError(userId, "api_error", error.message, body);
        throw error;
      }

      // Success
      const recordCount = Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0;
      await logSync(userId, body.action, body.table, "success", durationMs, undefined, recordCount);
      return result.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      // Already thrown non-retryable errors
      if (!isRetryable(err) || attempt >= maxRetries) {
        const durationMs = Math.round(performance.now() - startTime);
        if (err.name !== "AbortError" || attempt >= maxRetries) {
          await logSync(userId, body.action, body.table, "failed", durationMs, err.message);
          await logError(userId, err.name === "AbortError" ? "timeout" : "network_error", err.message, body);
        }
        throw err;
      }

      const delay = retryDelayMs * Math.pow(2, attempt);
      onRetry?.(attempt + 1, err);
      console.warn(`[ecosystem] Retry ${attempt + 1}/${maxRetries} in ${delay}ms:`, err.message);
      await sleep(delay);
    }
  }

  throw lastError;
}

export const hufmanagerClient = {
  select: (table: HufManagerTable, options?: SelectOptions, retry?: RetryOptions) =>
    callProxy({ action: "select", table, ...options }, retry),

  insert: (table: HufManagerTable, data: Record<string, any> | Record<string, any>[], retry?: RetryOptions) =>
    callProxy({ action: "insert", table, data }, retry),

  update: (table: HufManagerTable, id: string, data: Record<string, any>, retry?: RetryOptions) =>
    callProxy({ action: "update", table, id, data }, retry),

  delete: (table: HufManagerTable, id: string, retry?: RetryOptions) =>
    callProxy({ action: "delete", table, id }, retry),
};
