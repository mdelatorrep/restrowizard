
-- =============================================
-- Training Programs
-- =============================================
CREATE TABLE public.training_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  position TEXT,
  estimated_hours NUMERIC DEFAULT 0,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  content JSONB DEFAULT '{"modules": []}'::jsonb,
  passing_score INT DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own training programs"
  ON public.training_programs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Staff Training Progress
-- =============================================
CREATE TABLE public.staff_training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_member_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  training_program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  progress_percent INT NOT NULL DEFAULT 0,
  score INT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  modules_completed JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_member_id, training_program_id)
);

ALTER TABLE public.staff_training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own staff training progress"
  ON public.staff_training_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Staff Benefits (catalog)
-- =============================================
CREATE TABLE public.staff_benefits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  benefit_name TEXT NOT NULL,
  benefit_type TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  value NUMERIC DEFAULT 0,
  value_type TEXT NOT NULL DEFAULT 'fixed',
  eligibility_months INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  applicable_positions TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own staff benefits"
  ON public.staff_benefits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Staff Benefit Assignments
-- =============================================
CREATE TABLE public.staff_benefit_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_member_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  benefit_id UUID NOT NULL REFERENCES public.staff_benefits(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  usage_count INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_member_id, benefit_id)
);

ALTER TABLE public.staff_benefit_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own staff benefit assignments"
  ON public.staff_benefit_assignments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on progress
CREATE TRIGGER update_staff_training_progress_updated_at
  BEFORE UPDATE ON public.staff_training_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on assignments
CREATE TRIGGER update_staff_benefit_assignments_updated_at
  BEFORE UPDATE ON public.staff_benefit_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
