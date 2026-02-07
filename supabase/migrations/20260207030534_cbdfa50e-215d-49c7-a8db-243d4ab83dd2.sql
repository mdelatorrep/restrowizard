
-- =============================================
-- 1. Add linked_user_id to staff_members to link employees to their auth accounts
-- =============================================
ALTER TABLE public.staff_members
ADD COLUMN linked_user_id UUID UNIQUE;

-- Index for fast lookup
CREATE INDEX idx_staff_members_linked_user_id ON public.staff_members(linked_user_id);

-- =============================================
-- 2. RLS: Allow team members to read their OWN training progress
-- =============================================
CREATE POLICY "Team members can view own training progress"
  ON public.staff_training_progress
  FOR SELECT
  USING (
    staff_member_id IN (
      SELECT id FROM public.staff_members
      WHERE linked_user_id = auth.uid()
    )
  );

-- Allow team members to update their own progress (complete modules)
CREATE POLICY "Team members can update own training progress"
  ON public.staff_training_progress
  FOR UPDATE
  USING (
    staff_member_id IN (
      SELECT id FROM public.staff_members
      WHERE linked_user_id = auth.uid()
    )
  );

-- =============================================
-- 3. RLS: Allow team members to read their OWN benefit assignments
-- =============================================
CREATE POLICY "Team members can view own benefit assignments"
  ON public.staff_benefit_assignments
  FOR SELECT
  USING (
    staff_member_id IN (
      SELECT id FROM public.staff_members
      WHERE linked_user_id = auth.uid()
    )
  );

-- =============================================
-- 4. RLS: Allow team members to read training programs they're assigned to
-- =============================================
CREATE POLICY "Team members can view assigned training programs"
  ON public.training_programs
  FOR SELECT
  USING (
    id IN (
      SELECT training_program_id FROM public.staff_training_progress
      WHERE staff_member_id IN (
        SELECT id FROM public.staff_members
        WHERE linked_user_id = auth.uid()
      )
    )
  );

-- =============================================
-- 5. RLS: Allow team members to read benefits they're assigned to
-- =============================================
CREATE POLICY "Team members can view assigned benefits"
  ON public.staff_benefits
  FOR SELECT
  USING (
    id IN (
      SELECT benefit_id FROM public.staff_benefit_assignments
      WHERE staff_member_id IN (
        SELECT id FROM public.staff_members
        WHERE linked_user_id = auth.uid()
      )
    )
  );

-- =============================================
-- 6. Benefit requests table for employees
-- =============================================
CREATE TABLE public.benefit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_member_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  benefit_id UUID NOT NULL REFERENCES public.staff_benefits(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.benefit_requests ENABLE ROW LEVEL SECURITY;

-- Owner can manage all requests for their restaurant
CREATE POLICY "Owners manage benefit requests"
  ON public.benefit_requests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Team members can view and create their own requests
CREATE POLICY "Team members can view own benefit requests"
  ON public.benefit_requests
  FOR SELECT
  USING (
    staff_member_id IN (
      SELECT id FROM public.staff_members
      WHERE linked_user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create benefit requests"
  ON public.benefit_requests
  FOR INSERT
  WITH CHECK (
    staff_member_id IN (
      SELECT id FROM public.staff_members
      WHERE linked_user_id = auth.uid()
    )
  );
