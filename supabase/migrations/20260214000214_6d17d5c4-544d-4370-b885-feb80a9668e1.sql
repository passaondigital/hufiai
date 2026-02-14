
-- Create system_documentation table for dynamic manuals
CREATE TABLE public.system_documentation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  module_name TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft',
  ai_summary TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_documentation ENABLE ROW LEVEL SECURITY;

-- Admins can manage all docs
CREATE POLICY "Admins can manage documentation"
  ON public.system_documentation FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read published public docs
CREATE POLICY "Anyone can read public documentation"
  ON public.system_documentation FOR SELECT
  USING (is_public = true AND status = 'published');

-- Trigger for updated_at
CREATE TRIGGER update_system_documentation_updated_at
  BEFORE UPDATE ON public.system_documentation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
