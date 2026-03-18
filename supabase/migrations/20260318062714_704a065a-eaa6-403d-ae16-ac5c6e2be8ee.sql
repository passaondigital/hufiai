
-- Gamification: User Levels
CREATE TABLE public.user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level INT NOT NULL DEFAULT 1,
  current_xp INT NOT NULL DEFAULT 0,
  xp_for_next_level INT NOT NULL DEFAULT 100,
  total_xp INT NOT NULL DEFAULT 0,
  level_up_count INT NOT NULL DEFAULT 0,
  last_level_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Achievement definitions (system table)
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon_emoji VARCHAR(10),
  xp_reward INT NOT NULL DEFAULT 0,
  level_required INT NOT NULL DEFAULT 1,
  unlock_condition JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User unlocked achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_public BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- XP activity log
CREATE TABLE public.xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  xp_earned INT NOT NULL DEFAULT 0,
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Learning paths (system table)
CREATE TABLE public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon_emoji VARCHAR(10),
  difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner',
  estimated_time_minutes INT,
  order_position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Learning modules within paths
CREATE TABLE public.learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  order_position INT NOT NULL DEFAULT 0,
  title VARCHAR(100) NOT NULL,
  content_type VARCHAR(20) NOT NULL DEFAULT 'article',
  content_url VARCHAR(500),
  duration_minutes INT,
  xp_reward INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User progress per learning path
CREATE TABLE public.user_learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  progress_percentage INT NOT NULL DEFAULT 0,
  completed_modules INT NOT NULL DEFAULT 0,
  total_modules INT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, learning_path_id)
);

-- Public shared achievements
CREATE TABLE public.public_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  share_message TEXT,
  social_platforms TEXT[],
  share_url VARCHAR(500)
);

-- RLS
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_achievements ENABLE ROW LEVEL SECURITY;

-- user_levels: users manage own
CREATE POLICY "Users can manage own levels" ON public.user_levels
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- achievements: anyone authenticated can read
CREATE POLICY "Anyone can read achievements" ON public.achievements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage achievements" ON public.achievements
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_achievements: users see own
CREATE POLICY "Users can manage own achievements" ON public.user_achievements
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- xp_logs: users see and insert own
CREATE POLICY "Users can manage own xp logs" ON public.xp_logs
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- learning_paths: public read
CREATE POLICY "Anyone can read learning paths" ON public.learning_paths
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage learning paths" ON public.learning_paths
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- learning_modules: public read
CREATE POLICY "Anyone can read learning modules" ON public.learning_modules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage learning modules" ON public.learning_modules
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_learning_progress: users manage own
CREATE POLICY "Users can manage own learning progress" ON public.user_learning_progress
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- public_achievements: public read, users manage own
CREATE POLICY "Anyone can read public achievements" ON public.public_achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own public achievements" ON public.public_achievements
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Updated_at trigger for user_levels
CREATE TRIGGER update_user_levels_updated_at
  BEFORE UPDATE ON public.user_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
