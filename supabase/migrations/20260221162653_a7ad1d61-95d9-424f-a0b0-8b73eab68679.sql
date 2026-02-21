
-- Asset tags for media library
CREATE TABLE public.asset_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'video', -- video, image, document
  asset_id UUID NOT NULL,
  horse_name TEXT,
  project_name TEXT,
  custom_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own asset tags" ON public.asset_tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_asset_tags_user ON public.asset_tags(user_id);
CREATE INDEX idx_asset_tags_asset ON public.asset_tags(asset_id);

-- Video export performance tracking
CREATE TABLE public.video_export_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_job_id UUID REFERENCES public.video_jobs(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- reels, youtube, linkedin, post, story
  export_format TEXT NOT NULL DEFAULT '9:16',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  watch_time_seconds INTEGER DEFAULT 0,
  exported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metrics_updated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.video_export_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own export analytics" ON public.video_export_analytics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_export_analytics_user ON public.video_export_analytics(user_id);
CREATE INDEX idx_export_analytics_video ON public.video_export_analytics(video_job_id);

-- Content calendar / editorial plan
CREATE TABLE public.content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  planned_date DATE NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  content_type TEXT NOT NULL DEFAULT 'reel', -- reel, post, story, youtube, blog
  status TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, produced, published
  video_job_id UUID REFERENCES public.video_jobs(id) ON DELETE SET NULL,
  prompt_suggestion TEXT,
  aspect_ratio TEXT DEFAULT '9:16',
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar" ON public.content_calendar FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_content_calendar_user_date ON public.content_calendar(user_id, planned_date);
