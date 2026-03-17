
-- New prompt library table (replaces prompt_templates for system prompts)
CREATE TABLE public.prompt_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'business',
  use_cases TEXT[] DEFAULT '{}',
  difficulty VARCHAR(20) DEFAULT 'beginner',
  is_system BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User favorites (separate from prompt data)
CREATE TABLE public.user_favorite_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prompt_id UUID NOT NULL REFERENCES public.prompt_library(id) ON DELETE CASCADE,
  custom_name VARCHAR(255),
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

-- Usage tracking
CREATE TABLE public.prompt_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  prompt_id UUID REFERENCES public.prompt_library(id) ON DELETE SET NULL,
  conversation_id UUID,
  used_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.prompt_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_usage_logs ENABLE ROW LEVEL SECURITY;

-- prompt_library: anyone reads system, users read own
CREATE POLICY "Anyone can read system prompts" ON public.prompt_library
  FOR SELECT TO authenticated USING (is_system = true OR created_by = auth.uid());

CREATE POLICY "Users can create own prompts" ON public.prompt_library
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can update own prompts" ON public.prompt_library
  FOR UPDATE TO authenticated USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete own prompts" ON public.prompt_library
  FOR DELETE TO authenticated USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Admins can manage all prompts" ON public.prompt_library
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_favorite_prompts
CREATE POLICY "Users can manage own favorites" ON public.user_favorite_prompts
  FOR ALL TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- prompt_usage_logs
CREATE POLICY "Users can insert own usage" ON public.prompt_usage_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own usage" ON public.prompt_usage_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all usage" ON public.prompt_usage_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Migrate existing data from prompt_templates to prompt_library
INSERT INTO public.prompt_library (title, description, content, category, is_system, created_by, created_at)
SELECT title, description, prompt, category, is_system, user_id, created_at
FROM public.prompt_templates;

-- Updated_at trigger
CREATE TRIGGER update_prompt_library_updated_at
  BEFORE UPDATE ON public.prompt_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
