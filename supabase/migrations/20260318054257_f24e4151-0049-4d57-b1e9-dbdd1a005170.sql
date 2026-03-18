
-- Drop old tables
DROP TABLE IF EXISTS public.memory_facts CASCADE;
DROP TABLE IF EXISTS public.user_reminders CASCADE;

-- user_memory (replaces memory_facts)
CREATE TABLE public.user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fact TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'fact',
  importance INT DEFAULT 1,
  confidence FLOAT DEFAULT 0.8,
  source_conversation_id UUID REFERENCES public.conversations(id),
  source_message_id UUID REFERENCES public.messages(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  use_count INT DEFAULT 0
);
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own memory" ON public.user_memory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_reminders (new schema)
CREATE TABLE public.user_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_text TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'topic',
  trigger_topic VARCHAR(255),
  trigger_condition TEXT,
  due_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  reminded_count INT DEFAULT 0,
  last_reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reminders" ON public.user_reminders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- memory_snapshots
CREATE TABLE public.memory_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facts_count INT DEFAULT 0,
  top_categories TEXT[],
  snapshot_date TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.memory_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own snapshots" ON public.memory_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- conversation_memory_links
CREATE TABLE public.conversation_memory_links (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES public.user_memory(id) ON DELETE CASCADE,
  relevance_score FLOAT DEFAULT 0.5,
  PRIMARY KEY (conversation_id, memory_id)
);
ALTER TABLE public.conversation_memory_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own links" ON public.conversation_memory_links FOR ALL
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_memory_links.conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_memory_links.conversation_id AND c.user_id = auth.uid()));
