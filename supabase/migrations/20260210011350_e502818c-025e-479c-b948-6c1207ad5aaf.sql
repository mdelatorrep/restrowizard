
-- Fix RLS policies to use owner_id instead of user_id
DROP POLICY IF EXISTS "Authenticated users can create providers" ON public.service_providers;
DROP POLICY IF EXISTS "Users can update own providers" ON public.service_providers;
DROP POLICY IF EXISTS "Users can delete own providers" ON public.service_providers;

-- Add missing columns if they don't exist
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS specialty TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Recreate policies with owner_id
CREATE POLICY "Authenticated users can create providers"
ON public.service_providers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own providers"
ON public.service_providers FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own providers"
ON public.service_providers FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- Ensure public read exists
DROP POLICY IF EXISTS "Service providers are publicly readable" ON public.service_providers;
CREATE POLICY "Service providers are publicly readable"
ON public.service_providers FOR SELECT
USING (true);
