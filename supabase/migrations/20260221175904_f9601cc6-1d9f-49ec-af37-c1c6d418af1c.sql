
-- Table to store Instagram OAuth tokens per user
CREATE TABLE public.instagram_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instagram_user_id TEXT NOT NULL,
  instagram_username TEXT,
  access_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'long_lived',
  expires_at TIMESTAMP WITH TIME ZONE,
  page_id TEXT,
  page_access_token TEXT,
  scopes TEXT[] DEFAULT '{}',
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, instagram_user_id)
);

-- Enable RLS
ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own connections
CREATE POLICY "Users can view own instagram connections"
  ON public.instagram_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instagram connections"
  ON public.instagram_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instagram connections"
  ON public.instagram_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instagram connections"
  ON public.instagram_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_instagram_connections_updated_at
  BEFORE UPDATE ON public.instagram_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
