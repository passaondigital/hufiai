
-- User horses table for Horse Memory feature
CREATE TABLE public.user_horses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  color TEXT,
  known_issues TEXT,
  notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_horses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own horses" ON public.user_horses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own horses" ON public.user_horses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own horses" ON public.user_horses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own horses" ON public.user_horses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all horses" ON public.user_horses FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_horses_updated_at
  BEFORE UPDATE ON public.user_horses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_horses_user ON public.user_horses(user_id);

-- User subscriptions table for modular pricing
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
  social_media_addon BOOLEAN NOT NULL DEFAULT false,
  granted_by UUID,
  grant_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all subscriptions" ON public.user_subscriptions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert subscriptions" ON public.user_subscriptions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
