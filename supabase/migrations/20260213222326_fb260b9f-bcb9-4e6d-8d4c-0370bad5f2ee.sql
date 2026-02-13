
-- Add founder_flow columns to user_subscriptions
ALTER TABLE public.user_subscriptions 
  ADD COLUMN IF NOT EXISTS founder_flow_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founder_flow_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS founder_flow_expires_at timestamptz;

-- Update plan enum options in user_subscriptions (plan is text, so no enum change needed)
-- Plans: 'free', 'privat_plus', 'gewerbe_pro', 'gewerbe_team'
