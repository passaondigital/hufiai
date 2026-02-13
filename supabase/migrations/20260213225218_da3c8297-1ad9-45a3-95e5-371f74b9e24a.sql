
-- Upload usage counters per user per month
CREATE TABLE public.upload_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month_year text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  upload_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

ALTER TABLE public.upload_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own usage
CREATE POLICY "Users can view own upload usage"
  ON public.upload_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own upload usage"
  ON public.upload_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own upload usage"
  ON public.upload_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can see and manage all usage
CREATE POLICY "Admins can view all upload usage"
  ON public.upload_usage FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all upload usage"
  ON public.upload_usage FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all upload usage"
  ON public.upload_usage FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all chat_attachments (metadata only)
-- Already have "Admins can view all attachments" policy from previous migration

-- Trigger for updated_at
CREATE TRIGGER update_upload_usage_updated_at
  BEFORE UPDATE ON public.upload_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
