-- Escrituras del equipo a nombre del dueño (B-05, segunda parte).
--
-- Los datos operativos se indexan por el user_id del dueño. Varias pantallas
-- (POS, mesas, reservas, descuentos) insertaban con el id de quien está
-- conectado, o sin user_id y ensure_user_id_for_rls ponía auth.uid(). Con un
-- cajero eso deja la venta, la caja y el descuento de inventario fuera del
-- negocio: el dueño no la ve en ningún reporte.
--
-- Este trigger corre antes que ensure_user_id_for_rls (orden alfabético) solo en
-- tablas operativas: si quien inserta es miembro activo de un equipo y no es
-- dueño de un negocio, la fila queda a nombre del dueño. Un miembro del equipo
-- nunca es dueño legítimo de filas en estas tablas.

CREATE OR REPLACE FUNCTION public.team_member_owner_id(_uid uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT b.owner_id
  FROM restaurant_team_members m
  JOIN restaurant_businesses b ON b.id = m.business_id
  WHERE m.user_id = _uid AND m.status = 'active'
    AND NOT EXISTS (SELECT 1 FROM restaurant_businesses o WHERE o.owner_id = _uid)
  ORDER BY m.created_at
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.team_member_owner_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_member_owner_id(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.assign_team_owner_user_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS NULL OR NEW.user_id = auth.uid() THEN
    _owner := public.team_member_owner_id(auth.uid());
    IF _owner IS NOT NULL THEN
      NEW.user_id := _owner;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'restaurant_orders', 'pos_sessions', 'inventory_deductions', 'table_reservations',
    'pos_discounts', 'pos_payment_methods', 'restaurant_tables', 'restaurant_menus',
    'kitchen_production_queue', 'inventory_movements', 'inventory_waste', 'loyalty_customers'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS aa_team_owner_user_id ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id()', t);
    END IF;
  END LOOP;
END $$;
