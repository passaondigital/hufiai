
-- 1. ecosystem_sync_log: Audit trail for all sync operations
CREATE TABLE public.ecosystem_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.ecosystem_links(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL DEFAULT 'general',
  direction TEXT NOT NULL DEFAULT 'download' CHECK (direction IN ('upload', 'download', 'bidirectional')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'partial')),
  record_count INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ecosystem_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs" ON public.ecosystem_sync_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs" ON public.ecosystem_sync_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all sync logs" ON public.ecosystem_sync_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ecosystem_sync_log_user ON public.ecosystem_sync_log(user_id);
CREATE INDEX idx_ecosystem_sync_log_status ON public.ecosystem_sync_log(status);
CREATE INDEX idx_ecosystem_sync_log_created ON public.ecosystem_sync_log(created_at DESC);

-- 2. ecosystem_errors: Persistent error tracking with retry scheduling
CREATE TABLE public.ecosystem_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.ecosystem_links(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL DEFAULT 'api_error',
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  request_payload JSONB,
  auto_retry_scheduled BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  user_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ecosystem_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own errors" ON public.ecosystem_errors
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own errors" ON public.ecosystem_errors
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all errors" ON public.ecosystem_errors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ecosystem_errors_user ON public.ecosystem_errors(user_id);
CREATE INDEX idx_ecosystem_errors_unresolved ON public.ecosystem_errors(resolved_at) WHERE resolved_at IS NULL;

-- 3. ecosystem_settings: Per-user sync preferences
CREATE TABLE public.ecosystem_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval TEXT DEFAULT 'manual' CHECK (sync_interval IN ('realtime', 'hourly', 'daily', 'manual')),
  retry_max_count INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 5,
  shared_data_types TEXT[] DEFAULT '{}'::text[],
  notifications_enabled BOOLEAN DEFAULT true,
  last_full_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ecosystem_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" ON public.ecosystem_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all settings" ON public.ecosystem_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. ecosystem_mappings: Local ID ↔ External ID translation
CREATE TABLE public.ecosystem_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_system TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_system TEXT NOT NULL DEFAULT 'hufmanager',
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_system, source_type, source_id, target_system)
);

ALTER TABLE public.ecosystem_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mappings" ON public.ecosystem_mappings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all mappings" ON public.ecosystem_mappings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ecosystem_mappings_lookup ON public.ecosystem_mappings(source_system, source_type, source_id);
CREATE INDEX idx_ecosystem_mappings_reverse ON public.ecosystem_mappings(target_system, target_type, target_id);

-- 5. Add synced_at + error_message to existing ecosystem_links
ALTER TABLE public.ecosystem_links ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
ALTER TABLE public.ecosystem_links ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.ecosystem_links ADD COLUMN IF NOT EXISTS sync_count INTEGER DEFAULT 0;

-- 6. Enable realtime for sync_log (for live dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.ecosystem_sync_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ecosystem_errors;
