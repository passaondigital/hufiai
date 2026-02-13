
-- Create storage bucket for horse photos
INSERT INTO storage.buckets (id, name, public) VALUES ('horse-photos', 'horse-photos', true);

-- Allow authenticated users to upload their own horse photos
CREATE POLICY "Users can upload horse photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'horse-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own horse photos
CREATE POLICY "Users can update horse photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'horse-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own horse photos
CREATE POLICY "Users can delete horse photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'horse-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to horse photos
CREATE POLICY "Horse photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'horse-photos');
