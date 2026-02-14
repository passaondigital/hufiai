
-- Create table for generated image metadata
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  preset TEXT NOT NULL DEFAULT 'realistic',
  storage_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
CREATE POLICY "Admins can manage all generated images"
ON public.generated_images FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view own
CREATE POLICY "Users can view own generated images"
ON public.generated_images FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own
CREATE POLICY "Users can insert own generated images"
ON public.generated_images FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete own
CREATE POLICY "Users can delete own generated images"
ON public.generated_images FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true);

-- Storage policies
CREATE POLICY "Anyone can view generated images"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-images');

CREATE POLICY "Authenticated users can upload generated images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own generated images"
ON storage.objects FOR DELETE
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
