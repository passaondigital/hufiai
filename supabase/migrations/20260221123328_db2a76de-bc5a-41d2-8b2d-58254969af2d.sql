
-- Video Jobs table for HufiAi Video Engine
CREATE TABLE public.video_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  optimized_prompt TEXT,
  model TEXT NOT NULL DEFAULT 'wan-2.2',
  input_type TEXT NOT NULL DEFAULT 'text',
  input_file_url TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  duration INTEGER NOT NULL DEFAULT 5,
  motion_intensity NUMERIC NOT NULL DEFAULT 50,
  seed INTEGER,
  coherence NUMERIC NOT NULL DEFAULT 70,
  stylization NUMERIC NOT NULL DEFAULT 50,
  hd_upscaling BOOLEAN NOT NULL DEFAULT false,
  preset TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  video_url TEXT,
  thumbnail_url TEXT,
  format TEXT NOT NULL DEFAULT 'mp4',
  feedback TEXT,
  is_hufi_relevant BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

-- Users can manage their own video jobs
CREATE POLICY "Users can view own video jobs" ON public.video_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own video jobs" ON public.video_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own video jobs" ON public.video_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own video jobs" ON public.video_jobs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all video jobs" ON public.video_jobs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_video_jobs_updated_at BEFORE UPDATE ON public.video_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_jobs;
