
-- Create storage bucket for PDF exports
INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-exports', 'pdf-exports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for pdf-exports bucket
CREATE POLICY "Users can upload own PDFs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pdf-exports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own PDFs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'pdf-exports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own PDFs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'pdf-exports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all PDFs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'pdf-exports' AND public.has_role(auth.uid(), 'admin'));
