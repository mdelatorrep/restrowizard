
-- ============================================================
-- SUPER ADMIN: Platform-level admin using existing user_roles table
-- ============================================================

-- The user_roles table and has_role function already exist.
-- We just need admin-read policies on key tables.

-- 1. Admin read policies for platform management

-- Profiles: admins can read all profiles
CREATE POLICY "Platform admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Restaurant businesses: admins can read all
CREATE POLICY "Platform admins can read all businesses"
ON public.restaurant_businesses FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Jobs: admins can read all
CREATE POLICY "Platform admins can read all jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Job applications: admins can read all
CREATE POLICY "Platform admins can read all applications"
ON public.job_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service providers: admins can read all
CREATE POLICY "Platform admins can read all providers"
ON public.service_providers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service requests: admins can read all
CREATE POLICY "Platform admins can read all service requests"
ON public.service_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service proposals: admins can read all
CREATE POLICY "Platform admins can read all proposals"
ON public.service_proposals FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Provider reviews: admins can read all
CREATE POLICY "Platform admins can read all provider reviews"
ON public.provider_reviews FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Training courses: admins can read all
CREATE POLICY "Platform admins can read all courses"
ON public.training_courses FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Course enrollments: admins can read all
CREATE POLICY "Platform admins can read all enrollments"
ON public.course_enrollments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Course certificates: admins can read all
CREATE POLICY "Platform admins can read all certificates"
ON public.course_certificates FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Consultant profiles: admins can read all
CREATE POLICY "Platform admins can read all consultants"
ON public.consultant_profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Candidate profiles: admins can read all
CREATE POLICY "Platform admins can read all candidates"
ON public.candidate_profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Growth preregistrations: admins can read all
CREATE POLICY "Platform admins can read all preregistrations"
ON public.growth_preregistrations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Admin write policies for moderation

-- Service providers: admins can update (verify, moderate)
CREATE POLICY "Platform admins can update providers"
ON public.service_providers FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service requests: admins can update (moderate)
CREATE POLICY "Platform admins can update service requests"
ON public.service_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Jobs: admins can update (moderate)
CREATE POLICY "Platform admins can update jobs"
ON public.jobs FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Provider reviews: admins can update/delete (moderate)
CREATE POLICY "Platform admins can update reviews"
ON public.provider_reviews FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can delete reviews"
ON public.provider_reviews FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User roles: admins can manage roles
CREATE POLICY "Platform admins can read all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Function to get platform-wide stats (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_restaurants', (SELECT COUNT(*) FROM restaurant_businesses),
    'total_consultants', (SELECT COUNT(*) FROM consultant_profiles),
    'active_jobs', (SELECT COUNT(*) FROM jobs WHERE status = 'active'),
    'total_candidates', (SELECT COUNT(*) FROM candidate_profiles),
    'total_applications', (SELECT COUNT(*) FROM job_applications),
    'active_providers', (SELECT COUNT(*) FROM service_providers WHERE is_verified = true),
    'open_requests', (SELECT COUNT(*) FROM service_requests WHERE status = 'open'),
    'total_proposals', (SELECT COUNT(*) FROM service_proposals),
    'total_reviews', (SELECT COUNT(*) FROM provider_reviews),
    'published_courses', (SELECT COUNT(*) FROM training_courses WHERE is_published = true),
    'total_enrollments', (SELECT COUNT(*) FROM course_enrollments),
    'total_certificates', (SELECT COUNT(*) FROM course_certificates),
    'growth_preregistrations', (SELECT COUNT(*) FROM growth_preregistrations)
  ) INTO result;

  RETURN result;
END;
$$;

-- 4. Function to seed initial admin by email
CREATE OR REPLACE FUNCTION public.seed_platform_admin(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only allow existing admins or if no admins exist yet
  IF EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') 
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Find user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Insert admin role (ignore if already exists)
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$;
