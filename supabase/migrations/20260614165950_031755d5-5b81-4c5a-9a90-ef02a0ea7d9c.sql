
-- Optimize SELECT RLS on hot tables: consolidate dual permissive policies into one,
-- wrap auth.uid() in subselect for per-statement caching, and put cheap owner check first
-- so the planner can short-circuit and use the user_id index for HEAD count queries.

-- inventory_items
DROP POLICY IF EXISTS "Consultants can view client inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can manage their own inventory" ON public.inventory_items;

CREATE POLICY "inventory_items_select"
  ON public.inventory_items FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_consultant_of((SELECT auth.uid()), user_id)
  );

CREATE POLICY "inventory_items_insert"
  ON public.inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "inventory_items_update"
  ON public.inventory_items FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "inventory_items_delete"
  ON public.inventory_items FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- daily_sales
DROP POLICY IF EXISTS "Consultants can view client daily sales" ON public.daily_sales;
DROP POLICY IF EXISTS "Users can manage their own daily sales" ON public.daily_sales;

CREATE POLICY "daily_sales_select"
  ON public.daily_sales FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_consultant_of((SELECT auth.uid()), user_id)
  );

CREATE POLICY "daily_sales_modify"
  ON public.daily_sales FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- staff_members
DROP POLICY IF EXISTS "Consultants can view client staff" ON public.staff_members;
DROP POLICY IF EXISTS "Users can manage their own staff" ON public.staff_members;

CREATE POLICY "staff_members_select"
  ON public.staff_members FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_consultant_of((SELECT auth.uid()), user_id)
  );

CREATE POLICY "staff_members_modify"
  ON public.staff_members FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- restaurant_businesses (keep owner_id semantic)
DROP POLICY IF EXISTS "Consultants can view client businesses" ON public.restaurant_businesses;

CREATE POLICY "restaurant_businesses_consultant_select"
  ON public.restaurant_businesses FOR SELECT
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR public.is_consultant_of((SELECT auth.uid()), owner_id)
  );

-- Helper indexes used by is_consultant_of and hot count queries
CREATE INDEX IF NOT EXISTS idx_consultant_clients_client_user_id_v2
  ON public.consultant_clients (client_user_id);

CREATE INDEX IF NOT EXISTS idx_consultant_profiles_user_id_v2
  ON public.consultant_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_daily_sales_user_id
  ON public.daily_sales (user_id);

CREATE INDEX IF NOT EXISTS idx_staff_members_user_id
  ON public.staff_members (user_id);
