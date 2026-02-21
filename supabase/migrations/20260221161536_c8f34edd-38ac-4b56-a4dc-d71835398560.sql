
-- Social Media Accounts
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  account_name TEXT NOT NULL,
  account_url TEXT,
  followers INTEGER DEFAULT 0,
  avg_engagement NUMERIC DEFAULT 0,
  avg_views INTEGER DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own social accounts" ON public.social_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Social Metrics (KPI tracking)
CREATE TABLE public.social_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  followers INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  top_post_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own social metrics" ON public.social_metrics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Content Templates  
CREATE TABLE public.content_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  template_type TEXT NOT NULL DEFAULT 'video',
  prompt_template TEXT,
  aspect_ratio TEXT DEFAULT '9:16',
  duration INTEGER DEFAULT 5,
  style TEXT DEFAULT 'realistic',
  thumbnail_url TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system templates" ON public.content_templates FOR SELECT USING (is_system = true);
CREATE POLICY "Users can manage own templates" ON public.content_templates FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can manage all templates" ON public.content_templates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default Pferde-Profis templates
INSERT INTO public.content_templates (title, description, category, template_type, prompt_template, aspect_ratio, duration, style, is_system) VALUES
('Vorher-Nachher Vergleich', 'Der perfekte Vorher-Nachher-Vergleich für Hufbearbeitung', 'hufpflege', 'video', 'Split-screen comparison of a horse hoof before and after professional trimming. Left side shows overgrown, neglected hoof. Right side shows perfectly trimmed, balanced hoof. Clean white background, professional lighting, 4K detail, text overlay: VORHER | NACHHER', '9:16', 8, 'realistic', true),
('Hufpflege-Routine-Check', 'Schritt-für-Schritt Hufpflege-Anleitung als Reel', 'hufpflege', 'video', 'Professional farrier performing step-by-step hoof care routine on a calm horse. Close-up shots of rasping, trimming, and balancing. Warm golden light, barn setting, educational style, smooth camera movement', '9:16', 10, 'realistic', true),
('Stall-Vlog', 'Authentischer Stall-Alltag als Kurzfilm', 'lifestyle', 'video', 'Day-in-the-life at a modern horse stable. Morning feeding, grooming, turnout, sunset pasture. Warm cinematic tones, gentle camera movements, peaceful atmosphere, golden hour lighting', '16:9', 15, 'realistic', true),
('Produkt-Spotlight', 'Hufpflege-Produkt elegant in Szene gesetzt', 'marketing', 'video', 'Product showcase of horse hoof care tools on dark premium background. Elegant rotating display, studio lighting, professional product photography style, brand color accent #F47B20', '1:1', 5, 'realistic', true),
('Kundenstimme', 'Testimonial-Style Video für zufriedene Kunden', 'marketing', 'video', 'Happy horse owner with their well-groomed horse, testimonial style. Outdoor setting, natural light, warm smile, professional but authentic feel, text space at bottom for quote', '9:16', 8, 'realistic', true),
('Wissens-Nugget', 'Kurzes Fach-Info-Video für Social Media', 'education', 'video', 'Educational infographic style animation about horse hoof anatomy. Clean modern design, orange accent color #F47B20, professional typography, smooth transitions, white background', '9:16', 6, '3d', true);
