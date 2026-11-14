
-- 1) SECURITY DEFINER helper to check consultant->client relationship (single seq-scan-free check)
CREATE OR REPLACE FUNCTION public.is_consultant_of(_consultant_user uuid, _client_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.consultant_clients cc
    JOIN public.consultant_profiles cp ON cp.id = cc.consultant_id
    WHERE cp.user_id = _consultant_user
      AND cc.client_user_id = _client_user
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_consultant_of(uuid, uuid) TO authenticated, anon, service_role;

-- 2) Replace per-row EXISTS in heavy SELECT policies with the helper (much cheaper for HEAD counts)
DROP POLICY IF EXISTS "Consultants can view client inventory" ON public.inventory_items;
CREATE POLICY "Consultants can view client inventory"
  ON public.inventory_items FOR SELECT
  USING (public.is_consultant_of(auth.uid(), user_id));

DROP POLICY IF EXISTS "Consultants can view client daily sales" ON public.daily_sales;
CREATE POLICY "Consultants can view client daily sales"
  ON public.daily_sales FOR SELECT
  USING (public.is_consultant_of(auth.uid(), user_id));

DROP POLICY IF EXISTS "Consultants can view client staff" ON public.staff_members;
CREATE POLICY "Consultants can view client staff"
  ON public.staff_members FOR SELECT
  USING (public.is_consultant_of(auth.uid(), user_id));

DROP POLICY IF EXISTS "Consultants can view client businesses" ON public.restaurant_businesses;
CREATE POLICY "Consultants can view client businesses"
  ON public.restaurant_businesses FOR SELECT
  USING (public.is_consultant_of(auth.uid(), owner_id));

-- 3) Supporting indexes for fast user_id lookups on the high-traffic tables
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_brands_user_id ON public.restaurant_brands(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_user_id ON public.staff_members(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_sales_user_id ON public.daily_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_consultant_clients_client_user_id ON public.consultant_clients(client_user_id);
CREATE INDEX IF NOT EXISTS idx_consultant_clients_consultant_id ON public.consultant_clients(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_profiles_user_id ON public.consultant_profiles(user_id);
