-- Fix consultant onboarding loop by ensuring consultant_profiles is readable/updatable by its owner

ALTER TABLE public.consultant_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: consultant can read own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'consultant_profiles' 
      AND policyname = 'Consultants can view own profile'
  ) THEN
    CREATE POLICY "Consultants can view own profile"
    ON public.consultant_profiles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- INSERT: consultant can create own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'consultant_profiles' 
      AND policyname = 'Consultants can create own profile'
  ) THEN
    CREATE POLICY "Consultants can create own profile"
    ON public.consultant_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- UPDATE: consultant can update own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'consultant_profiles' 
      AND policyname = 'Consultants can update own profile'
  ) THEN
    CREATE POLICY "Consultants can update own profile"
    ON public.consultant_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- DELETE (optional): consultant can delete own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'consultant_profiles' 
      AND policyname = 'Consultants can delete own profile'
  ) THEN
    CREATE POLICY "Consultants can delete own profile"
    ON public.consultant_profiles
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;