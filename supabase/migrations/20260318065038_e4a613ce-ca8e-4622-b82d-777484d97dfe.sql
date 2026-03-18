
-- Create user_education_settings table (user_learning_progress already exists)
CREATE TABLE IF NOT EXISTS public.user_education_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  education_mode_enabled BOOLEAN DEFAULT true,
  dismissed_hints TEXT[] DEFAULT '{}',
  hint_frequency VARCHAR(20) DEFAULT 'smart',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_education_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own education settings" ON public.user_education_settings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Add description column to learning_modules if missing
ALTER TABLE public.learning_modules ADD COLUMN IF NOT EXISTS description TEXT;
