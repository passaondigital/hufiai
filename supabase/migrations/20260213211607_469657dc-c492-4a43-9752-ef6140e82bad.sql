
-- Extend user_horses with professional hoof-care fields
ALTER TABLE public.user_horses
  ADD COLUMN IF NOT EXISTS keeping_type TEXT CHECK (keeping_type IN ('box', 'offenstall', 'paddock', 'weide', 'mixed')),
  ADD COLUMN IF NOT EXISTS hoof_type TEXT CHECK (hoof_type IN ('barefoot', 'shod', 'alternative')),
  ADD COLUMN IF NOT EXISTS last_trim_date DATE,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS horse_id TEXT;

-- Add horse_id to conversations for linking chats to specific horses
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS horse_id UUID REFERENCES public.user_horses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_horse ON public.conversations(horse_id);
