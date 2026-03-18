-- PDF Templates table
CREATE TABLE public.pdf_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'report',
  template_html TEXT,
  preview_url VARCHAR(500),
  brand_kit_compatible BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system templates" ON public.pdf_templates
  FOR SELECT TO authenticated
  USING (is_system = true OR created_by = auth.uid());

CREATE POLICY "Users can manage own templates" ON public.pdf_templates
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can manage all templates" ON public.pdf_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PDF Exports table
CREATE TABLE public.pdf_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id),
  pdf_title VARCHAR(255),
  template_id UUID REFERENCES public.pdf_templates(id),
  file_url VARCHAR(500),
  file_size INT,
  page_count INT,
  format_options JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  downloaded_count INT DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ
);

ALTER TABLE public.pdf_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pdf exports" ON public.pdf_exports
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all pdf exports" ON public.pdf_exports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- PDF Batch Exports table
CREATE TABLE public.pdf_batch_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_ids UUID[] DEFAULT '{}',
  export_status VARCHAR(20) DEFAULT 'pending',
  output_format VARCHAR(20) DEFAULT 'separate_pdfs',
  zip_file_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.pdf_batch_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own batch exports" ON public.pdf_batch_exports
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);