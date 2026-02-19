-- Add ecosystem_id to profiles for the Pascal-Schmid ID protocol
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ecosystem_id text;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_ecosystem_id ON public.profiles(ecosystem_id);