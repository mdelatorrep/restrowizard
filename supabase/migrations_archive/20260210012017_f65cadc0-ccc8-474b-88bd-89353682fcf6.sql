
-- Create growth_preregistrations table
CREATE TABLE public.growth_preregistrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  interest_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.growth_preregistrations ENABLE ROW LEVEL SECURITY;

-- Public insert (for the landing page form)
CREATE POLICY "Anyone can submit a pre-registration"
  ON public.growth_preregistrations
  FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY "Authenticated users can read pre-registrations"
  ON public.growth_preregistrations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete pre-registrations"
  ON public.growth_preregistrations
  FOR DELETE
  USING (auth.uid() IS NOT NULL);
