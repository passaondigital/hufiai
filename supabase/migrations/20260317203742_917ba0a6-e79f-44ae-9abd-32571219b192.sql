
-- Prompt Library table
CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read system prompts
CREATE POLICY "Anyone can read system prompts"
ON public.prompt_templates FOR SELECT
TO authenticated
USING (is_system = true);

-- Users can manage own prompts
CREATE POLICY "Users can manage own prompts"
ON public.prompt_templates FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all prompts
CREATE POLICY "Admins can manage all prompts"
ON public.prompt_templates FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add ai_memory to profiles for Memory System MVP
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_memory TEXT DEFAULT NULL;
