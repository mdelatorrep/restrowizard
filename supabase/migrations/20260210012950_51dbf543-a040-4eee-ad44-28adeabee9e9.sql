
-- Fix overly permissive policies - split FOR ALL into specific operations
DROP POLICY IF EXISTS "Users can manage own saved jobs" ON public.job_saved;
CREATE POLICY "Users can view own saved jobs" ON public.job_saved FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save jobs" ON public.job_saved FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave jobs" ON public.job_saved FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own experience" ON public.candidate_experience;
CREATE POLICY "Users can view own experience" ON public.candidate_experience FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.candidate_profiles cp WHERE cp.id = candidate_experience.candidate_id AND cp.user_id = auth.uid()));
CREATE POLICY "Users can insert own experience" ON public.candidate_experience FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.candidate_profiles cp WHERE cp.id = candidate_experience.candidate_id AND cp.user_id = auth.uid()));
CREATE POLICY "Users can update own experience" ON public.candidate_experience FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.candidate_profiles cp WHERE cp.id = candidate_experience.candidate_id AND cp.user_id = auth.uid()));
CREATE POLICY "Users can delete own experience" ON public.candidate_experience FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.candidate_profiles cp WHERE cp.id = candidate_experience.candidate_id AND cp.user_id = auth.uid()));
