-- B-05 · Acceso real del equipo a los datos del dueño
--
-- Problema: el RBAC (has_module_access, roles por negocio) solo se aplicaba en la
-- interfaz. Las políticas RLS de 158 de 165 tablas solo dejaban leer al dueño
-- (user_id = auth.uid()). useDataUserId resolvía el owner_id para un gerente o
-- cajero, pero la base le devolvía cero filas: el gerente veía todo vacío.
--
-- Solución: políticas ADITIVAS (permisivas, se suman con OR a las existentes)
-- que dejan leer/escribir los datos del dueño a un miembro activo del equipo
-- SOLO si su rol tiene acceso al módulo correspondiente. No se toca ninguna
-- política existente.

CREATE OR REPLACE FUNCTION public.team_can(_owner uuid, _modules text[], _level text DEFAULT 'read')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _owner IS NOT NULL AND (
    _owner = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM restaurant_businesses b
      JOIN restaurant_team_members m ON m.business_id = b.id
      WHERE b.owner_id = _owner
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND EXISTS (
          SELECT 1 FROM unnest(_modules) mod
          WHERE public.has_module_access(auth.uid(), b.id, mod, _level)
        )
    )
  );
$$;

REVOKE ALL ON FUNCTION public.team_can(uuid, text[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_can(uuid, text[], text) TO authenticated;

-- Tablas con columna user_id = dueño. (tabla, módulos de lectura, módulos de escritura)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('restaurant_orders',    ARRAY['orders','pos','pos_reports','dashboard','finances','kitchen_display'], ARRAY['orders','pos']),
    ('pos_sessions',         ARRAY['pos','pos_reports','pos_audit','finances'],                           ARRAY['pos']),
    ('pos_payment_methods',  ARRAY['pos','pos_reports'],                                                  ARRAY['settings']),
    ('pos_discounts',        ARRAY['pos','pos_reports'],                                                  ARRAY['settings']),
    ('pos_session_closures', ARRAY['pos','pos_reports','pos_audit'],                                      ARRAY['pos']),
    ('restaurant_tables',    ARRAY['pos','reservations','orders'],                                        ARRAY['pos']),
    ('table_reservations',   ARRAY['reservations','pos','dashboard'],                                     ARRAY['reservations']),
    ('restaurant_menus',     ARRAY['menus','pos','orders','recipes','kitchen_display'],                   ARRAY['menus']),
    ('staff_members',        ARRAY['talent','dashboard','finances','pos'],                                ARRAY['talent']),
    ('staff_shifts',         ARRAY['talent','dashboard','finances'],                                      ARRAY['talent']),
    ('staff_availability',   ARRAY['talent'],                                                             ARRAY['talent']),
    ('shift_templates',      ARRAY['talent'],                                                             ARRAY['talent']),
    ('recipes',              ARRAY['recipes','menus','inventory'],                                        ARRAY['recipes']),
    ('inventory_items',      ARRAY['inventory','recipes'],                                                ARRAY['inventory']),
    ('suppliers',            ARRAY['inventory','suppliers','invoices'],                                   ARRAY['inventory']),
    ('inventory_suppliers',  ARRAY['inventory','suppliers','invoices'],                                   ARRAY['inventory']),
    ('inventory_deductions', ARRAY['inventory','finances','dashboard','recipes'],                         ARRAY['inventory','pos']),
    ('purchase_orders',      ARRAY['inventory','suppliers'],                                              ARRAY['inventory']),
    ('supplier_invoices',    ARRAY['invoices','finances','inventory'],                                    ARRAY['invoices']),
    ('daily_sales',          ARRAY['finances','dashboard'],                                               ARRAY['finances']),
    ('sales_goals',          ARRAY['pos_reports','dashboard','finances'],                                 ARRAY['pos_reports']),
    ('loyalty_customers',    ARRAY['loyalty','pos','dashboard'],                                          ARRAY['loyalty','pos'])
  ) AS t(tbl, read_mods, write_mods)
  LOOP
    IF to_regclass('public.' || r.tbl) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS team_read ON public.%I', r.tbl);
    EXECUTE format('DROP POLICY IF EXISTS team_write ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY team_read ON public.%I FOR SELECT TO authenticated USING (public.team_can(user_id, %L::text[]))',
      r.tbl, r.read_mods);
    EXECUTE format(
      'CREATE POLICY team_write ON public.%I FOR ALL TO authenticated USING (public.team_can(user_id, %L::text[], ''write'')) WITH CHECK (public.team_can(user_id, %L::text[], ''write''))',
      r.tbl, r.write_mods, r.write_mods);
  END LOOP;
END $$;

-- Tablas hijas sin user_id: se resuelve el dueño por la tabla padre.
DROP POLICY IF EXISTS team_read ON public.menu_categories;
CREATE POLICY team_read ON public.menu_categories FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM restaurant_menus m WHERE m.id = menu_categories.menu_id
                 AND public.team_can(m.user_id, ARRAY['menus','pos','orders','recipes','kitchen_display'])));

DROP POLICY IF EXISTS team_read ON public.menu_items;
CREATE POLICY team_read ON public.menu_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM restaurant_menus m WHERE m.id = menu_items.menu_id
                 AND public.team_can(m.user_id, ARRAY['menus','pos','orders','recipes','kitchen_display'])));

DROP POLICY IF EXISTS team_read ON public.recipe_ingredients;
CREATE POLICY team_read ON public.recipe_ingredients FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_ingredients.recipe_id
                 AND public.team_can(r.user_id, ARRAY['recipes','menus','inventory'])));

DROP POLICY IF EXISTS team_read ON public.recipe_sub_recipes;
CREATE POLICY team_read ON public.recipe_sub_recipes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_sub_recipes.parent_recipe_id
                 AND public.team_can(r.user_id, ARRAY['recipes','menus','inventory'])));

DROP POLICY IF EXISTS team_read ON public.pos_transactions;
CREATE POLICY team_read ON public.pos_transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pos_sessions s WHERE s.id = pos_transactions.session_id
                 AND public.team_can(s.user_id, ARRAY['pos','pos_reports','pos_audit','finances'])));

DROP POLICY IF EXISTS team_write ON public.pos_transactions;
CREATE POLICY team_write ON public.pos_transactions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM pos_sessions s WHERE s.id = pos_transactions.session_id
                      AND public.team_can(s.user_id, ARRAY['pos'], 'write')));

DROP POLICY IF EXISTS team_read ON public.order_status_history;
CREATE POLICY team_read ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM restaurant_orders o WHERE o.id = order_status_history.order_id
                 AND public.team_can(o.user_id, ARRAY['orders','pos','kitchen_display'])));

DROP POLICY IF EXISTS team_write ON public.order_status_history;
CREATE POLICY team_write ON public.order_status_history FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM restaurant_orders o WHERE o.id = order_status_history.order_id
                      AND public.team_can(o.user_id, ARRAY['orders','pos','kitchen_display'], 'write')));

DROP POLICY IF EXISTS team_read ON public.purchase_order_items;
CREATE POLICY team_read ON public.purchase_order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id
                 AND public.team_can(po.user_id, ARRAY['inventory','suppliers'])));
