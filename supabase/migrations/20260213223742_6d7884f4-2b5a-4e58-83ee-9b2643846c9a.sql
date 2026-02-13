
-- Table for chat file attachments with strict user scoping
CREATE TABLE public.chat_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_type text,
  file_size bigint,
  storage_path text NOT NULL,
  extracted_text text,
  extraction_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own attachments
CREATE POLICY "Users can view own attachments"
  ON public.chat_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attachments"
  ON public.chat_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attachments"
  ON public.chat_attachments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments"
  ON public.chat_attachments FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all attachments
CREATE POLICY "Admins can view all attachments"
  ON public.chat_attachments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false);

-- Storage RLS: users can only access their own folder (user_id prefix)
CREATE POLICY "Users can upload own chat attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own chat attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own chat attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Service role needs access for the extraction edge function
CREATE POLICY "Service role full access to chat attachments"
  ON storage.objects FOR ALL
  USING (bucket_id = 'chat-attachments' AND auth.role() = 'service_role');
