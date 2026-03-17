
CREATE TABLE public.user_system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  system_prompt TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own system prompt"
ON public.user_system_prompts FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own system prompt"
ON public.user_system_prompts FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own system prompt"
ON public.user_system_prompts FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own system prompt"
ON public.user_system_prompts FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all system prompts"
ON public.user_system_prompts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
