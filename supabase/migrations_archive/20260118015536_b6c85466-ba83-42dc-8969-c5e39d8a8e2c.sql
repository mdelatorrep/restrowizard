-- First, delete duplicate analyses keeping only the most recent one
DELETE FROM public.opening_phase_analyses a
USING public.opening_phase_analyses b
WHERE a.project_id = b.project_id 
  AND a.phase = b.phase 
  AND a.created_at < b.created_at;

-- Now add the unique constraint
ALTER TABLE public.opening_phase_analyses 
DROP CONSTRAINT IF EXISTS opening_phase_analyses_project_phase_unique;

ALTER TABLE public.opening_phase_analyses 
ADD CONSTRAINT opening_phase_analyses_project_phase_unique 
UNIQUE (project_id, phase);

-- Enable realtime for opening_phase_analyses table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'opening_phase_analyses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.opening_phase_analyses;
  END IF;
END $$;