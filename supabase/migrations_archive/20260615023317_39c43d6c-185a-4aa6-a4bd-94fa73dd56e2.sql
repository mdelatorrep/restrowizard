-- ============================================================
-- BL-03 / BL-06 — Recetas M:N + Conversión de Unidades
-- ============================================================

-- 1. Tabla pivote recipe_menu_items
CREATE TABLE IF NOT EXISTS public.recipe_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  variant_name text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipe_id, menu_item_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS recipe_menu_items_one_primary_per_item
  ON public.recipe_menu_items(menu_item_id) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS recipe_menu_items_recipe_idx ON public.recipe_menu_items(recipe_id);
CREATE INDEX IF NOT EXISTS recipe_menu_items_menu_item_idx ON public.recipe_menu_items(menu_item_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_menu_items TO authenticated;
GRANT ALL ON public.recipe_menu_items TO service_role;

ALTER TABLE public.recipe_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view recipe-menu links"
  ON public.recipe_menu_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Recipe owner can manage links"
  ON public.recipe_menu_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()));

-- Migrar datos existentes
INSERT INTO public.recipe_menu_items (recipe_id, menu_item_id, is_primary)
SELECT id, menu_item_id, true
FROM public.recipes
WHERE menu_item_id IS NOT NULL
ON CONFLICT (recipe_id, menu_item_id) DO NOTHING;

-- ============================================================
-- 2. Tabla unit_conversions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.unit_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_unit_id uuid NOT NULL REFERENCES public.measurement_units(id) ON DELETE CASCADE,
  to_unit_id uuid NOT NULL REFERENCES public.measurement_units(id) ON DELETE CASCADE,
  conversion_factor numeric NOT NULL CHECK (conversion_factor > 0),
  ingredient_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS unit_conversions_unique_specific
  ON public.unit_conversions(from_unit_id, to_unit_id, ingredient_id)
  WHERE ingredient_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unit_conversions_unique_generic
  ON public.unit_conversions(from_unit_id, to_unit_id)
  WHERE ingredient_id IS NULL;

CREATE INDEX IF NOT EXISTS unit_conversions_lookup_idx
  ON public.unit_conversions(from_unit_id, to_unit_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_conversions TO authenticated;
GRANT ALL ON public.unit_conversions TO service_role;

ALTER TABLE public.unit_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read conversions"
  ON public.unit_conversions FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert their own conversions"
  ON public.unit_conversions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversions"
  ON public.unit_conversions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversions"
  ON public.unit_conversions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_unit_conversions_updated_at ON public.unit_conversions;
CREATE TRIGGER update_unit_conversions_updated_at
  BEFORE UPDATE ON public.unit_conversions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: equivalencias genéricas comunes (volumen ↔ ml, peso ↔ g)
-- Insertamos por nombre/abreviatura ya que los IDs son dinámicos.
INSERT INTO public.unit_conversions (from_unit_id, to_unit_id, conversion_factor, user_id, notes)
SELECT f.id, t.id, x.factor, NULL, 'seed:' || x.label
FROM (VALUES
  ('tsp', 'ml',  5,     'cucharadita ↔ ml'),
  ('tbsp', 'ml', 15,    'cucharada ↔ ml'),
  ('cup', 'ml',  240,   'taza ↔ ml'),
  ('fl_oz', 'ml', 29.5735, 'oz fluida ↔ ml'),
  ('lb', 'g',    453.592, 'libra ↔ g'),
  ('oz', 'g',    28.3495, 'onza ↔ g')
) AS x(from_abbr, to_abbr, factor, label)
JOIN public.measurement_units f ON f.abbreviation = x.from_abbr
JOIN public.measurement_units t ON t.abbreviation = x.to_abbr
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Función convert_unit
-- ============================================================
CREATE OR REPLACE FUNCTION public.convert_unit(
  p_amount numeric,
  p_from_unit_id uuid,
  p_to_unit_id uuid,
  p_ingredient_id uuid DEFAULT NULL
) RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_factor numeric;
  v_from_base uuid;
  v_to_base uuid;
  v_from_factor numeric;
  v_to_factor numeric;
BEGIN
  IF p_from_unit_id = p_to_unit_id THEN
    RETURN p_amount;
  END IF;

  -- 1. Conversión específica por ingrediente
  IF p_ingredient_id IS NOT NULL THEN
    SELECT conversion_factor INTO v_factor
    FROM public.unit_conversions
    WHERE from_unit_id = p_from_unit_id AND to_unit_id = p_to_unit_id
      AND ingredient_id = p_ingredient_id
    LIMIT 1;
    IF v_factor IS NOT NULL THEN RETURN p_amount * v_factor; END IF;

    SELECT 1.0 / conversion_factor INTO v_factor
    FROM public.unit_conversions
    WHERE from_unit_id = p_to_unit_id AND to_unit_id = p_from_unit_id
      AND ingredient_id = p_ingredient_id
    LIMIT 1;
    IF v_factor IS NOT NULL THEN RETURN p_amount * v_factor; END IF;
  END IF;

  -- 2. Conversión genérica directa
  SELECT conversion_factor INTO v_factor
  FROM public.unit_conversions
  WHERE from_unit_id = p_from_unit_id AND to_unit_id = p_to_unit_id
    AND ingredient_id IS NULL
  LIMIT 1;
  IF v_factor IS NOT NULL THEN RETURN p_amount * v_factor; END IF;

  SELECT 1.0 / conversion_factor INTO v_factor
  FROM public.unit_conversions
  WHERE from_unit_id = p_to_unit_id AND to_unit_id = p_from_unit_id
    AND ingredient_id IS NULL
  LIMIT 1;
  IF v_factor IS NOT NULL THEN RETURN p_amount * v_factor; END IF;

  -- 3. Vía unidad base (measurement_units.base_unit_id + conversion_factor)
  SELECT COALESCE(base_unit_id, id), COALESCE(conversion_factor, 1)
    INTO v_from_base, v_from_factor
  FROM public.measurement_units WHERE id = p_from_unit_id;

  SELECT COALESCE(base_unit_id, id), COALESCE(conversion_factor, 1)
    INTO v_to_base, v_to_factor
  FROM public.measurement_units WHERE id = p_to_unit_id;

  IF v_from_base = v_to_base AND v_to_factor > 0 THEN
    RETURN p_amount * v_from_factor / v_to_factor;
  END IF;

  -- 4. Sin cadena de conversión
  RETURN NULL;
END;
$$;

-- ============================================================
-- 4. Función recalculate_recipe_cost (recursiva con límite)
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalculate_recipe_cost(
  p_recipe_id uuid,
  p_depth int DEFAULT 0
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_cost numeric := 0;
  v_portions numeric;
  v_per_portion numeric;
  v_ing record;
  v_sub record;
  v_converted numeric;
  v_sub_cost numeric;
BEGIN
  IF p_depth > 5 THEN
    RAISE EXCEPTION 'Recipe nesting too deep (>5 levels) — possible cycle in recipe %', p_recipe_id;
  END IF;

  -- Suma ingredientes
  FOR v_ing IN
    SELECT ri.quantity, ri.unit_id, ri.cost_per_unit, ri.yield_percentage, ri.inventory_item_id,
           ii.unit_id AS inv_unit_id, ii.average_cost, ii.purchase_unit
    FROM public.recipe_ingredients ri
    LEFT JOIN public.inventory_items ii ON ii.id = ri.inventory_item_id
    WHERE ri.recipe_id = p_recipe_id
  LOOP
    -- Si tiene ingrediente de inventario, intenta convertir y usar costo promedio
    IF v_ing.inventory_item_id IS NOT NULL AND v_ing.inv_unit_id IS NOT NULL
       AND v_ing.unit_id IS NOT NULL AND v_ing.average_cost IS NOT NULL THEN
      v_converted := public.convert_unit(v_ing.quantity, v_ing.unit_id, v_ing.inv_unit_id, v_ing.inventory_item_id);
      IF v_converted IS NOT NULL THEN
        v_total_cost := v_total_cost + (v_converted * v_ing.average_cost / GREATEST(v_ing.yield_percentage, 1) * 100);
        CONTINUE;
      END IF;
    END IF;
    -- Fallback: cost_per_unit directo
    v_total_cost := v_total_cost + (COALESCE(v_ing.quantity,0) * COALESCE(v_ing.cost_per_unit,0)
                                    / GREATEST(COALESCE(v_ing.yield_percentage,100), 1) * 100);
  END LOOP;

  -- Suma sub-recetas
  FOR v_sub IN
    SELECT sub_recipe_id, quantity FROM public.recipe_sub_recipes
    WHERE parent_recipe_id = p_recipe_id
  LOOP
    v_sub_cost := public.recalculate_recipe_cost(v_sub.sub_recipe_id, p_depth + 1);
    v_total_cost := v_total_cost + COALESCE(v_sub_cost, 0) * COALESCE(v_sub.quantity, 1);
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
$$;