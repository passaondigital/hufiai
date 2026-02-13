
-- Add metadata columns for training pipeline
ALTER TABLE public.training_data_logs 
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'lovable_gateway',
  ADD COLUMN IF NOT EXISTS tone text DEFAULT 'empathic_professional',
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
