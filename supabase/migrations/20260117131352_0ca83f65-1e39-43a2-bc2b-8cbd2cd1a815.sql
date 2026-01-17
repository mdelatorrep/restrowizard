-- Create table for persistent pre-opening tasks
CREATE TABLE public.pre_opening_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.business_opening_projects(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('operations', 'marketing', 'team', 'legal')),
  days_before_opening INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_key)
);

-- Enable RLS
ALTER TABLE public.pre_opening_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pre-opening tasks"
ON public.pre_opening_tasks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pre-opening tasks"
ON public.pre_opening_tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pre-opening tasks"
ON public.pre_opening_tasks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pre-opening tasks"
ON public.pre_opening_tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Add opening_date column to restaurant_businesses if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'restaurant_businesses' 
    AND column_name = 'opening_date'
  ) THEN
    ALTER TABLE public.restaurant_businesses ADD COLUMN opening_date DATE;
  END IF;
END $$;

-- Create trigger for updated_at
CREATE TRIGGER update_pre_opening_tasks_updated_at
BEFORE UPDATE ON public.pre_opening_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();