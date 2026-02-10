
-- 1. Create candidate_profiles table
CREATE TABLE public.candidate_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  headline text,
  bio text,
  phone text,
  city text,
  country text DEFAULT 'Colombia',
  years_experience integer DEFAULT 0,
  desired_salary_min integer,
  desired_salary_max integer,
  desired_job_types text[],
  desired_categories text[],
  skills text[],
  certifications text[],
  languages text[],
  availability text DEFAULT 'immediate',
  resume_url text,
  photo_url text,
  is_actively_looking boolean DEFAULT true,
  profile_completeness integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX candidate_profiles_user_id_idx ON public.candidate_profiles(user_id);

CREATE POLICY "Users can view own profile" ON public.candidate_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.candidate_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.candidate_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.candidate_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_candidate_profiles_updated_at
  BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create candidate_experience table
CREATE TABLE public.candidate_experience (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  position text NOT NULL,
  city text,
  start_date date,
  end_date date,
  description text,
  is_current boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own experience" ON public.candidate_experience FOR ALL
  USING (EXISTS (SELECT 1 FROM public.candidate_profiles cp WHERE cp.id = candidate_experience.candidate_id AND cp.user_id = auth.uid()));

-- 3. Create job_saved table
CREATE TABLE public.job_saved (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);
ALTER TABLE public.job_saved ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved jobs" ON public.job_saved FOR ALL USING (auth.uid() = user_id);

-- 4. ALTER jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_logo_url text,
  ADD COLUMN IF NOT EXISTS urgent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS remote_option text DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS responsibilities text,
  ADD COLUMN IF NOT EXISTS skills_required text[],
  ADD COLUMN IF NOT EXISTS perks text[];

-- 5. ALTER job_applications table (BEFORE policies that reference new columns)
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS candidate_profile_id uuid REFERENCES public.candidate_profiles(id),
  ADD COLUMN IF NOT EXISTS applicant_name text,
  ADD COLUMN IF NOT EXISTS applicant_email text,
  ADD COLUMN IF NOT EXISTS applicant_phone text,
  ADD COLUMN IF NOT EXISTS ai_match_score integer,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS interview_date timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS employer_notes text;

-- 6. NOW add employer-facing RLS policies (columns exist now)
CREATE POLICY "Employers can view applicant profiles" ON public.candidate_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.jobs j ON j.id = ja.job_id
    WHERE ja.candidate_profile_id = candidate_profiles.id
    AND j.employer_id = auth.uid()
  ));

CREATE POLICY "Employers can view applicant experience" ON public.candidate_experience FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.jobs j ON j.id = ja.job_id
    WHERE ja.candidate_profile_id = candidate_experience.candidate_id
    AND j.employer_id = auth.uid()
  ));

-- 7. Profile completeness trigger
CREATE OR REPLACE FUNCTION public.calculate_profile_completeness()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  score integer := 0;
  total integer := 10;
BEGIN
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN score := score + 1; END IF;
  IF NEW.headline IS NOT NULL AND NEW.headline != '' THEN score := score + 1; END IF;
  IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN score := score + 1; END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN score := score + 1; END IF;
  IF NEW.city IS NOT NULL AND NEW.city != '' THEN score := score + 1; END IF;
  IF NEW.years_experience IS NOT NULL AND NEW.years_experience > 0 THEN score := score + 1; END IF;
  IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN score := score + 1; END IF;
  IF NEW.resume_url IS NOT NULL AND NEW.resume_url != '' THEN score := score + 1; END IF;
  IF NEW.photo_url IS NOT NULL AND NEW.photo_url != '' THEN score := score + 1; END IF;
  IF NEW.languages IS NOT NULL AND array_length(NEW.languages, 1) > 0 THEN score := score + 1; END IF;
  NEW.profile_completeness := (score * 100) / total;
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_candidate_completeness
  BEFORE INSERT OR UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.calculate_profile_completeness();

-- 8. Increment applications_count trigger
CREATE OR REPLACE FUNCTION public.increment_job_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.jobs SET applications_count = COALESCE(applications_count, 0) + 1 WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_job_apps_on_insert
  AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.increment_job_applications();
