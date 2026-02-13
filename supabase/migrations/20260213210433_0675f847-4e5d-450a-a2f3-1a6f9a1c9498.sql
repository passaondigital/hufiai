
-- Content items table for the Social Media & Content Hub
CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'post' CHECK (content_type IN ('reel', 'linkedin', 'blog', 'podcast', 'post')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  content TEXT,
  hook TEXT,
  visual_ideas TEXT,
  hashtags TEXT[],
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  source_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content items"
  ON public.content_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content items"
  ON public.content_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content items"
  ON public.content_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content items"
  ON public.content_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for calendar queries
CREATE INDEX idx_content_items_user_scheduled ON public.content_items(user_id, scheduled_at);
CREATE INDEX idx_content_items_user_status ON public.content_items(user_id, status);

-- Usage tracking for tiered access
CREATE TABLE public.content_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  posts_this_month INTEGER NOT NULL DEFAULT 0,
  month_year TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  tier TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'power')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON public.content_usage FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON public.content_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON public.content_usage FOR UPDATE USING (auth.uid() = user_id);

-- Admin can read all for analytics
CREATE POLICY "Admins can view all content items"
  ON public.content_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
