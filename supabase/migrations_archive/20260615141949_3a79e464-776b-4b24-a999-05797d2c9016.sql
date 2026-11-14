
-- TK-25: Auto-aggregate loyalty customer totals from completed orders
CREATE OR REPLACE FUNCTION public.recompute_loyalty_customer_for(_user_id uuid, _email text, _phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid;
  _total_spent numeric := 0;
  _total_orders integer := 0;
  _first_at timestamptz;
  _last_at timestamptz;
  _avg numeric := 0;
BEGIN
  SELECT id INTO _customer_id
  FROM public.loyalty_customers
  WHERE user_id = _user_id
    AND (
      (_email IS NOT NULL AND customer_email = _email)
      OR (_phone IS NOT NULL AND customer_phone = _phone)
    )
  ORDER BY created_at ASC
  LIMIT 1;

  IF _customer_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(SUM(total), 0),
    COUNT(*),
    MIN(created_at),
    MAX(created_at)
  INTO _total_spent, _total_orders, _first_at, _last_at
  FROM public.restaurant_orders
  WHERE user_id = _user_id
    AND status IN ('completed','paid','served','closed','delivered')
    AND (
      (_email IS NOT NULL AND customer_email = _email)
      OR (_phone IS NOT NULL AND customer_phone = _phone)
    );

  IF _total_orders > 0 THEN
    _avg := _total_spent / _total_orders;
  END IF;

  UPDATE public.loyalty_customers
  SET total_spent = _total_spent,
      total_orders = _total_orders,
      avg_order_value = _avg,
      first_order_at = COALESCE(first_order_at, _first_at),
      last_order_at = _last_at,
      predicted_ltv = _avg * GREATEST(_total_orders, 1) * 1.5,
      updated_at = now()
  WHERE id = _customer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_loyalty_from_orders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_email IS NOT NULL OR NEW.customer_phone IS NOT NULL THEN
    PERFORM public.recompute_loyalty_customer_for(NEW.user_id, NEW.customer_email, NEW.customer_phone);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_loyalty_from_orders ON public.restaurant_orders;
CREATE TRIGGER sync_loyalty_from_orders
AFTER INSERT OR UPDATE OF status, total, customer_email, customer_phone
ON public.restaurant_orders
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_loyalty_from_orders();

-- BL-19: Effective stock by location derived from movements
CREATE OR REPLACE VIEW public.inventory_stock_by_location
WITH (security_invoker=on) AS
WITH inflow AS (
  SELECT inventory_item_id, to_location_id AS location_id, user_id, SUM(quantity_change) AS qty
  FROM public.inventory_movements
  WHERE to_location_id IS NOT NULL
  GROUP BY inventory_item_id, to_location_id, user_id
),
outflow AS (
  SELECT inventory_item_id, from_location_id AS location_id, user_id, SUM(quantity_change) AS qty
  FROM public.inventory_movements
  WHERE from_location_id IS NOT NULL
  GROUP BY inventory_item_id, from_location_id, user_id
),
combined AS (
  SELECT inventory_item_id, location_id, user_id, qty FROM inflow
  UNION ALL
  SELECT inventory_item_id, location_id, user_id, -qty FROM outflow
)
SELECT
  c.user_id,
  c.inventory_item_id,
  c.location_id,
  COALESCE(SUM(c.qty), 0) AS stock_on_hand,
  l.location_name,
  i.item_name,
  i.unit
FROM combined c
LEFT JOIN public.storage_locations l ON l.id = c.location_id
LEFT JOIN public.inventory_items i ON i.id = c.inventory_item_id
GROUP BY c.user_id, c.inventory_item_id, c.location_id, l.location_name, i.item_name, i.unit;

GRANT SELECT ON public.inventory_stock_by_location TO authenticated;
GRANT SELECT ON public.inventory_stock_by_location TO service_role;
