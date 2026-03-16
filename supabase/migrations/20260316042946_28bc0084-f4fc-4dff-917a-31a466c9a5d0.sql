-- =============================================
-- FIX 1: Replace recursive RLS policies on restaurant_team_members
-- =============================================

-- Create helper functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_business_owner(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_businesses
    WHERE id = _business_id AND owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_team_members
    WHERE user_id = _user_id
      AND business_id = _business_id
      AND role = 'admin'
      AND status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_team_lead(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_team_members
    WHERE user_id = _user_id
      AND business_id = _business_id
      AND role IN ('admin', 'manager')
      AND status = 'active'
  )
$$;

-- Drop recursive policies
DROP POLICY IF EXISTS "Admins can manage non-admin members" ON restaurant_team_members;
DROP POLICY IF EXISTS "Team leads can view team members" ON restaurant_team_members;
DROP POLICY IF EXISTS "Members can view own record" ON restaurant_team_members;
DROP POLICY IF EXISTS "Owners can manage all team members" ON restaurant_team_members;

-- Recreate policies using SECURITY DEFINER functions (no recursion)
CREATE POLICY "Owners can manage all team members"
  ON restaurant_team_members FOR ALL
  USING (public.is_business_owner(auth.uid(), business_id))
  WITH CHECK (public.is_business_owner(auth.uid(), business_id));

CREATE POLICY "Members can view own record"
  ON restaurant_team_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Team leads can view team members"
  ON restaurant_team_members FOR SELECT
  USING (public.is_team_lead(auth.uid(), business_id));

CREATE POLICY "Admins can manage non-admin members"
  ON restaurant_team_members FOR ALL
  USING (
    public.is_team_admin(auth.uid(), business_id)
    AND role NOT IN ('owner', 'admin')
  )
  WITH CHECK (
    public.is_team_admin(auth.uid(), business_id)
    AND role NOT IN ('owner', 'admin')
  );