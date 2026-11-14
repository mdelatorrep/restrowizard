
-- =====================================================================
-- TK-A: Inventory deduction triggered by completed orders (server-side)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.process_order_inventory_deduction(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item  jsonb;
  v_menu_item_id uuid;
  v_qty numeric;
  v_recipe_id uuid;
  v_ing RECORD;
  v_deduct numeric;
  v_inv RECORD;
BEGIN
  SELECT id, user_id, items, status
    INTO v_order
  FROM public.restaurant_orders
  WHERE id = p_order_id;

  IF v_order IS NULL THEN RETURN; END IF;

  -- Idempotencia: si ya hay deducciones para esta orden, no repetir
  IF EXISTS (SELECT 1 FROM public.inventory_deductions WHERE order_id = p_order_id) THEN
    RETURN;
  END IF;

  IF v_order.items IS NULL THEN RETURN; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items::jsonb)
  LOOP
    v_menu_item_id := NULLIF(v_item->>'menu_item_id','')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::numeric, 1);

    IF v_menu_item_id IS NULL OR v_qty <= 0 THEN CONTINUE; END IF;

    -- recipe link (menu_items first, then recipes side)
    SELECT recipe_id INTO v_recipe_id FROM public.menu_items WHERE id = v_menu_item_id;
    IF v_recipe_id IS NULL THEN
      SELECT id INTO v_recipe_id FROM public.recipes WHERE menu_item_id = v_menu_item_id LIMIT 1;
    END IF;
    IF v_recipe_id IS NULL THEN CONTINUE; END IF;

    FOR v_ing IN
      SELECT inventory_item_id, quantity, unit
        FROM public.recipe_ingredients
       WHERE recipe_id = v_recipe_id
         AND inventory_item_id IS NOT NULL
    LOOP
      v_deduct := COALESCE(v_ing.quantity, 0) * v_qty;
      IF v_deduct <= 0 THEN CONTINUE; END IF;

      SELECT id, current_stock, unit_cost
        INTO v_inv
      FROM public.inventory_items
      WHERE id = v_ing.inventory_item_id;

      IF v_inv IS NULL THEN CONTINUE; END IF;

      UPDATE public.inventory_items
         SET current_stock = GREATEST(0, COALESCE(current_stock,0) - v_deduct),
             updated_at = now()
       WHERE id = v_ing.inventory_item_id;

      INSERT INTO public.inventory_deductions
        (user_id, order_id, inventory_item_id, recipe_id, quantity_deducted, unit, deducted_at)
      VALUES
        (v_order.user_id, p_order_id, v_ing.inventory_item_id, v_recipe_id,
         v_deduct, v_ing.unit, now());
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_order_inventory_deduction(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT inventory_item_id, quantity_deducted FROM public.inventory_deductions WHERE order_id = p_order_id
  LOOP
    UPDATE public.inventory_items
       SET current_stock = COALESCE(current_stock,0) + r.quantity_deducted,
           updated_at = now()
     WHERE id = r.inventory_item_id;
  END LOOP;
  DELETE FROM public.inventory_deductions WHERE order_id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_order_inventory_deduction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('completed','delivered','paid') THEN
      PERFORM public.process_order_inventory_deduction(NEW.id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- transición hacia completada
    IF NEW.status IN ('completed','delivered','paid')
       AND (OLD.status IS DISTINCT FROM NEW.status)
       AND OLD.status NOT IN ('completed','delivered','paid') THEN
      PERFORM public.process_order_inventory_deduction(NEW.id);
    END IF;
    -- transición a anulada/refund
    IF NEW.status IN ('cancelled','refunded','voided')
       AND OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.reverse_order_inventory_deduction(NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_inventory_deduction ON public.restaurant_orders;
CREATE TRIGGER trg_order_inventory_deduction
AFTER INSERT OR UPDATE OF status ON public.restaurant_orders
FOR EACH ROW EXECUTE FUNCTION public.trg_order_inventory_deduction();

-- Backfill: órdenes completadas históricas que aún no tienen deducciones.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT o.id
      FROM public.restaurant_orders o
     WHERE o.status IN ('completed','delivered','paid')
       AND NOT EXISTS (SELECT 1 FROM public.inventory_deductions d WHERE d.order_id = o.id)
  LOOP
    PERFORM public.process_order_inventory_deduction(r.id);
  END LOOP;
END $$;
