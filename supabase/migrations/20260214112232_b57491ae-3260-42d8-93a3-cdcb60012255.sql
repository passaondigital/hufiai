
-- Table to store ecosystem connections between apps
CREATE TABLE public.ecosystem_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  app_key text NOT NULL,
  external_id text,
  status text NOT NULL DEFAULT 'not_connected',
  data_sharing_enabled boolean NOT NULL DEFAULT false,
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_key)
);

ALTER TABLE public.ecosystem_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own links" ON public.ecosystem_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own links" ON public.ecosystem_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own links" ON public.ecosystem_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own links" ON public.ecosystem_links FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all links" ON public.ecosystem_links FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_ecosystem_links_updated_at
  BEFORE UPDATE ON public.ecosystem_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
