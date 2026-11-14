-- Add AI analysis columns to maturity_diagnoses
ALTER TABLE public.maturity_diagnoses 
ADD COLUMN IF NOT EXISTS ai_analysis jsonb,
ADD COLUMN IF NOT EXISTS ai_action_plan jsonb,
ADD COLUMN IF NOT EXISTS ai_benchmark jsonb,
ADD COLUMN IF NOT EXISTS restaurant_context jsonb,
ADD COLUMN IF NOT EXISTS ai_generated_at timestamptz;

-- Create table for tracking action items progress
CREATE TABLE IF NOT EXISTS public.maturity_action_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id uuid NOT NULL REFERENCES public.maturity_diagnoses(id) ON DELETE CASCADE,
  action_id text NOT NULL,
  action_title text NOT NULL,
  pillar_id text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(diagnosis_id, action_id)
);

-- Enable RLS
ALTER TABLE public.maturity_action_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies for maturity_action_tracking
CREATE POLICY "Users can view their own action tracking"
ON public.maturity_action_tracking
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action tracking"
ON public.maturity_action_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action tracking"
ON public.maturity_action_tracking
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action tracking"
ON public.maturity_action_tracking
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_maturity_action_tracking_updated_at
BEFORE UPDATE ON public.maturity_action_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maturity_action_tracking_user ON public.maturity_action_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_maturity_action_tracking_diagnosis ON public.maturity_action_tracking(diagnosis_id);
CREATE INDEX IF NOT EXISTS idx_maturity_action_tracking_status ON public.maturity_action_tracking(status);