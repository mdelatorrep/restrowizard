-- Add consultant role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consultant';

-- Add user_type column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'restaurant_owner' 
  CHECK (user_type IN ('restaurant_owner', 'consultant'));

-- Create restaurant_businesses table
CREATE TABLE IF NOT EXISTS public.restaurant_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  business_type TEXT,
  cuisine_type TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'México',
  phone TEXT,
  website TEXT,
  employee_count INTEGER,
  monthly_revenue_range TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_businesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_businesses
CREATE POLICY "Users can view their own businesses"
  ON public.restaurant_businesses
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own businesses"
  ON public.restaurant_businesses
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own businesses"
  ON public.restaurant_businesses
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own businesses"
  ON public.restaurant_businesses
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Consultants can view their clients' businesses
CREATE POLICY "Consultants can view client businesses"
  ON public.restaurant_businesses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultant_clients cc
      JOIN public.consultant_profiles cp ON cc.consultant_id = cp.id
      WHERE cc.client_user_id = restaurant_businesses.owner_id
      AND cp.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_restaurant_businesses_updated_at
  BEFORE UPDATE ON public.restaurant_businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();