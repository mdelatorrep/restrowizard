-- Create business_opening_projects table
CREATE TABLE public.business_opening_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  cuisine_type TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'México',
  neighborhood TEXT,
  estimated_budget NUMERIC,
  target_opening_date DATE,
  current_phase TEXT DEFAULT 'planning',
  progress_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opening_phase_analyses table
CREATE TABLE public.opening_phase_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.business_opening_projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  analysis_data JSONB,
  sources JSONB,
  recommendations JSONB,
  estimated_cost NUMERIC,
  estimated_time_days INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opening_checklist_items table
CREATE TABLE public.opening_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.business_opening_projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.business_opening_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_phase_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_opening_projects
CREATE POLICY "Users can view their own projects"
ON public.business_opening_projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.business_opening_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.business_opening_projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.business_opening_projects FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for opening_phase_analyses
CREATE POLICY "Users can view analyses of their projects"
ON public.opening_phase_analyses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.business_opening_projects
  WHERE id = project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create analyses for their projects"
ON public.opening_phase_analyses FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.business_opening_projects
  WHERE id = project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update analyses of their projects"
ON public.opening_phase_analyses FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.business_opening_projects
  WHERE id = project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete analyses of their projects"
ON public.opening_phase_analyses FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.business_opening_projects
  WHERE id = project_id AND user_id = auth.uid()
));

-- RLS Policies for opening_checklist_items
CREATE POLICY "Users can view checklist of their projects"
ON public.opening_checklist_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.business_opening_projects
  WHERE id = project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create checklist items for their projects"
ON public.opening_checklist_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.business_opening_projects
  WHERE id = project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update checklist of their projects"
ON public.opening_checklist_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.business_opening_projects
  WHERE id = project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete checklist items of their projects"
ON public.opening_checklist_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.business_opening_projects
  WHERE id = project_id AND user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_business_opening_projects_updated_at
BEFORE UPDATE ON public.business_opening_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();