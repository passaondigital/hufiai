
CREATE TABLE public.user_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT 'topic',
  trigger_topic TEXT,
  trigger_condition TEXT,
  trigger_date TIMESTAMPTZ,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ,
  conversation_id UUID REFERENCES public.conversations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders" ON public.user_reminders
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.memory_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fact TEXT NOT NULL,
  source TEXT DEFAULT 'auto',
  category TEXT DEFAULT 'general',
  conversation_id UUID REFERENCES public.conversations(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.memory_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own facts" ON public.memory_facts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
