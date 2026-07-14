-- ============================================================================
-- B-13 — Deducción de inventario atómica + con conversión de unidad.
-- (Aplicada y verificada en prod vía query_database el 2026-07-14.)
-- Antes: useInventoryDeduction restaba receta.qty*orderQty directo de current_stock
-- SIN convertir unidad (g vs kg => error x1000) con read-modify-write no atómico
-- (lost update en ventas simultáneas). Ahora una RPC transaccional resuelve
-- receta->ingredientes, convierte por unidad (texto o measurement_units) y
-- descuenta atómicamente (UPDATE ... current_stock - x) registrando la deducción.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.deduct_inventory_for_order(p_order_id uuid, p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_item jsonb; v_menu_item_id uuid; v_qty numeric; v_recipe_id uuid;
  v_ing record; v_deduct numeric; v_converted numeric;
  v_ri_uid uuid; v_inv_uid uuid; v_new_stock numeric;
  v_low jsonb := '[]'::jsonb; v_count int := 0;
BEGIN
  SELECT user_id INTO v_owner FROM public.restaurant_orders WHERE id = p_order_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Orden no encontrada'; END IF;
  IF v_owner <> v_uid AND NOT EXISTS (
     SELECT 1 FROM public.restaurant_businesses b JOIN public.restaurant_team_members tm ON tm.business_id = b.id
     WHERE b.owner_id = v_owner AND tm.user_id = v_uid AND tm.status = 'active') THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_menu_item_id := (v_item->>'menu_item_id')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::numeric, 0);
    CONTINUE WHEN v_menu_item_id IS NULL OR v_qty <= 0;
    SELECT recipe_id INTO v_recipe_id FROM public.menu_items WHERE id = v_menu_item_id;
    IF v_recipe_id IS NULL THEN
      SELECT id INTO v_recipe_id FROM public.recipes WHERE menu_item_id = v_menu_item_id LIMIT 1;
    END IF;
    CONTINUE WHEN v_recipe_id IS NULL;

    FOR v_ing IN
      SELECT ri.inventory_item_id, ri.quantity, ri.unit AS ri_unit, ri.unit_id,
             ii.unit AS inv_unit, ii.min_stock_level, ii.item_name
      FROM public.recipe_ingredients ri
      JOIN public.inventory_items ii ON ii.id = ri.inventory_item_id
      WHERE ri.recipe_id = v_recipe_id AND ri.inventory_item_id IS NOT NULL
    LOOP
      v_deduct := COALESCE(v_ing.quantity,0) * v_qty;
      IF lower(COALESCE(v_ing.ri_unit,'')) = lower(COALESCE(v_ing.inv_unit,'')) THEN
        v_converted := v_deduct;
      ELSE
        v_ri_uid := COALESCE(v_ing.unit_id,
          (SELECT id FROM public.measurement_units WHERE lower(name)=lower(v_ing.ri_unit) OR lower(abbreviation)=lower(v_ing.ri_unit) LIMIT 1));
        v_inv_uid := (SELECT id FROM public.measurement_units WHERE lower(name)=lower(v_ing.inv_unit) OR lower(abbreviation)=lower(v_ing.inv_unit) LIMIT 1);
        v_converted := NULL;
        IF v_ri_uid IS NOT NULL AND v_inv_uid IS NOT NULL THEN
          v_converted := public.convert_unit(v_deduct, v_ri_uid, v_inv_uid, v_ing.inventory_item_id);
        END IF;
        IF v_converted IS NULL THEN v_converted := v_deduct; END IF;
      END IF;

      UPDATE public.inventory_items
      SET current_stock = GREATEST(0, COALESCE(current_stock,0) - v_converted), updated_at = now()
      WHERE id = v_ing.inventory_item_id
      RETURNING current_stock INTO v_new_stock;

      INSERT INTO public.inventory_deductions (user_id, order_id, inventory_item_id, recipe_id, quantity_deducted, unit)
      VALUES (v_owner, p_order_id, v_ing.inventory_item_id, v_recipe_id, v_converted, v_ing.inv_unit);

      v_count := v_count + 1;
      IF v_new_stock <= COALESCE(v_ing.min_stock_level, 0) THEN
        v_low := v_low || jsonb_build_object('name', v_ing.item_name, 'stock', v_new_stock, 'unit', v_ing.inv_unit);
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'deducted', v_count, 'low_stock', v_low);
END;
$function$;
GRANT EXECUTE ON FUNCTION public.deduct_inventory_for_order(uuid, jsonb) TO authenticated;
