
-- 1) Extend messages table
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.messages(id),
  ADD COLUMN IF NOT EXISTS edit_count INT DEFAULT 0;

-- 2) Message versions table
CREATE TABLE IF NOT EXISTS public.message_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.message_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own message versions"
  ON public.message_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_versions.message_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_versions.message_id AND c.user_id = auth.uid()
    )
  );

-- 3) Chat exports table
CREATE TABLE IF NOT EXISTS public.chat_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  format VARCHAR(20) NOT NULL,
  file_url VARCHAR(500),
  exported_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exports"
  ON public.chat_exports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4) Chat splits table
CREATE TABLE IF NOT EXISTS public.chat_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  child_conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  split_message_id UUID REFERENCES public.messages(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own splits"
  ON public.chat_splits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = chat_splits.parent_conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = chat_splits.parent_conversation_id AND c.user_id = auth.uid()
    )
  );

-- 5) Extracted content table
CREATE TABLE IF NOT EXISTS public.extracted_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.extracted_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own extracted content"
  ON public.extracted_content FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
