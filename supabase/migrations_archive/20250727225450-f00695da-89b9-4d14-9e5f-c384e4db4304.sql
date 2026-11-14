-- Add missing maturity_diagnoses table
CREATE TABLE IF NOT EXISTS public.maturity_diagnoses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL DEFAULT 1,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maturity_diagnoses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own diagnoses" 
ON public.maturity_diagnoses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diagnoses" 
ON public.maturity_diagnoses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnoses" 
ON public.maturity_diagnoses 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_maturity_diagnoses_updated_at
  BEFORE UPDATE ON public.maturity_diagnoses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();