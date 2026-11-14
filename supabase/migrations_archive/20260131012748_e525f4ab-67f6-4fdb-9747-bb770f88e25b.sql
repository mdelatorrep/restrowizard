-- Create table to track background analysis job runs
CREATE TABLE public.opening_analysis_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.business_opening_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  current_phase TEXT,
  phases_completed TEXT[] DEFAULT '{}',
  phases_failed TEXT[] DEFAULT '{}',
  total_phases INTEGER NOT NULL DEFAULT 7,
  error_message TEXT,
  include_checklist BOOLEAN DEFAULT true,
  checklist_generated BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.opening_analysis_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own runs"
ON public.opening_analysis_runs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own runs"
ON public.opening_analysis_runs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own runs"
ON public.opening_analysis_runs
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_opening_analysis_runs_project ON public.opening_analysis_runs(project_id);
CREATE INDEX idx_opening_analysis_runs_status ON public.opening_analysis_runs(status) WHERE status IN ('pending', 'processing');

-- Add updated_at trigger
CREATE TRIGGER update_opening_analysis_runs_updated_at
BEFORE UPDATE ON public.opening_analysis_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();