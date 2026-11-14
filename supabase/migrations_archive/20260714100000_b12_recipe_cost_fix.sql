-- ============================================================================
-- B-12 — Fix de costeo de recetas (recalculate_recipe_cost)
--
-- Corrige TRES defectos (aplicado y verificado en producción vía query_database
-- el 2026-07-14; esta migración deja el repo consistente con la BD):
--
-- 1) BUG LATENTE (rompía todo el costeo): la función referenciaba
--    inventory_items.unit_id e inventory_items.average_cost, columnas que NO
--    existen. PL/pgSQL resuelve columnas en runtime, así que la función lanzaba
--    "column ii.unit_id does not exist" en CADA receta con ingrediente de
--    inventario. Columnas reales: ii.unit (texto) e ii.unit_cost.
--
-- 2) Sub-recetas se costeaban con el COSTO TOTAL DEL LOTE del sub (× cantidad),
--    en vez del COSTO POR PORCIÓN. Ahora se recalcula el sub y se consume su
--    cost_per_portion × quantity (quantity = número de porciones del sub).
--
-- 3) Rama de inventario multiplicaba el costo ×100 cuando yield_percentage era
--    NULL (GREATEST(NULL,1)=1 → /1*100). Se usa GREATEST(COALESCE(yield,100),1),
--    igual que el fallback.
--
-- Nota: recipe_ingredients usa unit_id (uuid) + unit (texto); inventory_items
-- usa unit (texto). La conversión inventario↔receta se hace por coincidencia de
-- unidad de texto y, si difieren, mapeando ambos textos a measurement_units para
-- usar convert_unit; si no hay mapeo, cae al fallback (cost_per_unit).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_recipe_cost(p_recipe_id uuid, p_depth integer DEFAULT 0)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_cost numeric := 0;
  v_portions numeric;
  v_per_portion numeric;
  v_ing record;
  v_sub record;
  v_converted numeric;
  v_sub_cost numeric;
  v_sub_pp numeric;
  v_ri_uid uuid;
  v_inv_uid uuid;
BEGIN
  IF p_depth > 5 THEN
    RAISE EXCEPTION 'Recipe nesting too deep (>5 levels) — possible cycle in recipe %', p_recipe_id;
  END IF;

  -- Suma ingredientes
  FOR v_ing IN
    SELECT ri.quantity, ri.unit_id, ri.unit AS ri_unit_text, ri.cost_per_unit, ri.yield_percentage,
           ri.inventory_item_id, ii.unit AS inv_unit_text, ii.unit_cost AS inv_unit_cost
    FROM public.recipe_ingredients ri
    LEFT JOIN public.inventory_items ii ON ii.id = ri.inventory_item_id
    WHERE ri.recipe_id = p_recipe_id
  LOOP
    -- Rama inventario: usa unit_cost real; convierte por unidad de texto o measurement_units
    IF v_ing.inventory_item_id IS NOT NULL AND v_ing.inv_unit_cost IS NOT NULL THEN
      IF lower(COALESCE(v_ing.ri_unit_text,'')) = lower(COALESCE(v_ing.inv_unit_text,'')) THEN
        v_converted := v_ing.quantity;
      ELSE
        v_ri_uid := COALESCE(v_ing.unit_id,
          (SELECT id FROM public.measurement_units
           WHERE lower(name)=lower(v_ing.ri_unit_text) OR lower(abbreviation)=lower(v_ing.ri_unit_text) LIMIT 1));
        v_inv_uid := (SELECT id FROM public.measurement_units
           WHERE lower(name)=lower(v_ing.inv_unit_text) OR lower(abbreviation)=lower(v_ing.inv_unit_text) LIMIT 1);
        IF v_ri_uid IS NOT NULL AND v_inv_uid IS NOT NULL THEN
          v_converted := public.convert_unit(v_ing.quantity, v_ri_uid, v_inv_uid, v_ing.inventory_item_id);
        ELSE
          v_converted := NULL;
        END IF;
      END IF;
      IF v_converted IS NOT NULL THEN
        v_total_cost := v_total_cost + (v_converted * v_ing.inv_unit_cost
                                        / GREATEST(COALESCE(v_ing.yield_percentage,100), 1) * 100);
        CONTINUE;
      END IF;
    END IF;
    -- Fallback: cost_per_unit directo del ingrediente
    v_total_cost := v_total_cost + (COALESCE(v_ing.quantity,0) * COALESCE(v_ing.cost_per_unit,0)
                                    / GREATEST(COALESCE(v_ing.yield_percentage,100), 1) * 100);
  END LOOP;

  -- Suma sub-recetas: costo POR PORCIÓN del sub (no total del lote)
  FOR v_sub IN
    SELECT sub_recipe_id, quantity FROM public.recipe_sub_recipes
    WHERE parent_recipe_id = p_recipe_id
  LOOP
    v_sub_cost := public.recalculate_recipe_cost(v_sub.sub_recipe_id, p_depth + 1);
    SELECT COALESCE(cost_per_portion, 0) INTO v_sub_pp FROM public.recipes WHERE id = v_sub.sub_recipe_id;
    v_total_cost := v_total_cost + COALESCE(v_sub_pp, 0) * COALESCE(v_sub.quantity, 1);
  END LOOP;

  SELECT GREATEST(portions, 1) INTO v_portions FROM public.recipes WHERE id = p_recipe_id;
  v_per_portion := v_total_cost / v_portions;

  UPDATE public.recipes
  SET total_cost = v_total_cost,
      cost_per_portion = v_per_portion,
      updated_at = now()
  WHERE id = p_recipe_id;

  RETURN v_total_cost;
END;
$function$;
