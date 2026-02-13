
-- Training data logs table for future HufiAi model training
CREATE TABLE public.training_data_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  user_input text,
  ai_output text,
  file_context text,
  model_used text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_data_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read training data
CREATE POLICY "Admins can view all training data"
ON public.training_data_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own training data (when consent is active)
CREATE POLICY "Users can insert own training data"
ON public.training_data_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can delete training data
CREATE POLICY "Admins can delete training data"
ON public.training_data_logs
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Index for admin queries
CREATE INDEX idx_training_data_user ON public.training_data_logs(user_id);
CREATE INDEX idx_training_data_created ON public.training_data_logs(created_at DESC);
