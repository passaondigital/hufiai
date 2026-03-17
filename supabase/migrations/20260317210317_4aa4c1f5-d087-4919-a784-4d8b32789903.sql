
-- Table: generated_content
CREATE TABLE public.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  original_prompt TEXT,
  file_url VARCHAR(500),
  file_size INT,
  dimensions VARCHAR(20),
  format VARCHAR(10),
  preview_url VARCHAR(500),
  social_platform VARCHAR(50),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content" ON public.generated_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content" ON public.generated_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content" ON public.generated_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content" ON public.generated_content FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all content" ON public.generated_content FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table: design_templates
CREATE TABLE public.design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'social',
  preview_url VARCHAR(500),
  template_data JSONB,
  is_system BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.design_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system templates" ON public.design_templates FOR SELECT USING (is_system = true);
CREATE POLICY "Users can manage own templates" ON public.design_templates FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can manage all templates" ON public.design_templates FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
