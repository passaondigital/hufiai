
-- Professional profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS certificates text[],
  ADD COLUMN IF NOT EXISTS service_area text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS public_profile boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website text;

-- Horse sharing table for client-expert linking
CREATE TABLE public.horse_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id uuid NOT NULL REFERENCES public.user_horses(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  expert_id uuid,
  expert_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, revoked
  permissions text NOT NULL DEFAULT 'read', -- read, read_write
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(horse_id, expert_email)
);

ALTER TABLE public.horse_shares ENABLE ROW LEVEL SECURITY;

-- Owners can manage their shares
CREATE POLICY "Owners can manage own shares"
  ON public.horse_shares FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Experts can view shares assigned to them (by email or user_id)
CREATE POLICY "Experts can view assigned shares"
  ON public.horse_shares FOR SELECT
  USING (auth.uid() = expert_id);

-- Experts can update shares assigned to them (accept/decline)
CREATE POLICY "Experts can update assigned shares"
  ON public.horse_shares FOR UPDATE
  USING (auth.uid() = expert_id);

-- Allow anyone authenticated to view public professional profiles
CREATE POLICY "Anyone can view public profiles"
  ON public.profiles FOR SELECT
  USING (public_profile = true);

-- Trigger for updated_at
CREATE TRIGGER update_horse_shares_updated_at
  BEFORE UPDATE ON public.horse_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
