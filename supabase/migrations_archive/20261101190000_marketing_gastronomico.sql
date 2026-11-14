-- Marketing gastronómico guiado por margen.
--
-- marketing_menu_opportunities: ingeniería de menú (Kasavana–Smith) de los
-- últimos N días. Margen de contribución = precio neto de impoconsumo − costo
-- por porción de la receta. Popularidad alta = vende ≥ 70 % del promedio por
-- plato. Margen alto = margen ≥ promedio ponderado por unidades.
--   estrella        margen alto, popular      → mantener visible, no tocar precio
--   caballo         margen bajo, popular      → subir precio o empacar en combo
--   rompecabezas    margen alto, poco vendido → el que hay que promocionar
--   perro           margen bajo, poco vendido → reformular o sacar de la carta
--
-- marketing_content: calendario de contenido (borrador → programado → publicado)
-- con el momento (partido, festivo, día flojo) y los platos que empuja.

CREATE OR REPLACE FUNCTION public.marketing_menu_opportunities(p_owner uuid, p_days integer DEFAULT 28)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_days integer := LEAST(GREATEST(coalesce(p_days, 28), 7), 120);
  v_rate numeric := 0;
  v_included boolean := true;
  v_result jsonb;
BEGIN
  IF p_owner IS NULL OR p_owner NOT IN (SELECT public.team_owner_ids(ARRAY['brand', 'menus', 'recipes'], 'read')) THEN
    RAISE EXCEPTION 'Sin acceso a este negocio' USING ERRCODE = '42501';
  END IF;

  SELECT CASE WHEN (tax_config->>'rate')::numeric > 1 THEN (tax_config->>'rate')::numeric / 100
              ELSE coalesce((tax_config->>'rate')::numeric, 0) END,
         coalesce((tax_config->>'included_in_price')::boolean, true)
    INTO v_rate, v_included
    FROM restaurant_businesses WHERE owner_id = p_owner ORDER BY created_at LIMIT 1;
  v_rate := coalesce(v_rate, 0);

  WITH sold AS (
    SELECT (li->>'menu_item_id')::uuid AS item_id,
           sum(coalesce((li->>'quantity')::numeric, 1)) AS units
    FROM restaurant_orders o
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(o.items) = 'array' THEN o.items ELSE '[]'::jsonb END) li
    WHERE o.user_id = p_owner AND o.status NOT IN ('cancelled', 'pending')
      AND o.created_at >= now() - make_interval(days => v_days)
      AND (li->>'menu_item_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    GROUP BY 1
  ), items AS (
    SELECT mi.id, mi.name, coalesce(mi.category, 'Sin categoría') AS category, mi.price,
           CASE WHEN v_included THEN mi.price / (1 + v_rate) ELSE mi.price END AS net_price,
           coalesce(nullif(r.cost_per_portion, 0), nullif(mi.cost, 0)) AS cost,
           coalesce(s.units, 0) AS units
    FROM menu_items mi
    JOIN restaurant_menus m ON m.id = mi.menu_id
    LEFT JOIN recipes r ON r.id = mi.recipe_id
    LEFT JOIN sold s ON s.item_id = mi.id
    WHERE m.user_id = p_owner AND coalesce(mi.is_available, true) AND coalesce(mi.price, 0) > 0
  ), calc AS (
    SELECT *, net_price - coalesce(cost, 0) AS margin,
           CASE WHEN net_price > 0 AND cost IS NOT NULL THEN (net_price - cost) / net_price END AS margin_pct
    FROM items
  ), cat_th AS (
    -- Popularidad contra los platos de su misma categoría (Kasavana–Smith): el
    -- brunch solo se vende el fin de semana y contra toda la carta salía "perro".
    SELECT category, 0.7 * coalesce(avg(units), 0) AS pop_threshold
    FROM calc GROUP BY category
  ), th AS (
    SELECT 0.7 * coalesce(avg(units), 0) AS pop_threshold,
           CASE WHEN sum(units) FILTER (WHERE cost IS NOT NULL) > 0
                THEN sum(margin * units) FILTER (WHERE cost IS NOT NULL) / sum(units) FILTER (WHERE cost IS NOT NULL)
                ELSE avg(margin) FILTER (WHERE cost IS NOT NULL) END AS margin_threshold
    FROM calc
  )
  SELECT jsonb_build_object(
    'days', v_days,
    'tax_rate_pct', round(v_rate * 100, 2),
    'popularity_threshold', round((SELECT pop_threshold FROM th), 1),
    'margin_threshold', round((SELECT margin_threshold FROM th)),
    'items', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'category', c.category, 'price', round(c.price),
        'net_price', round(c.net_price), 'cost', round(c.cost), 'margin', round(c.margin),
        'margin_pct', round(c.margin_pct * 100, 1), 'units', round(c.units),
        'revenue', round(c.price * c.units), 'contribution', round(c.margin * c.units),
        'has_cost', c.cost IS NOT NULL,
        'quadrant', CASE
          WHEN c.cost IS NULL THEN 'sin_costo'
          WHEN c.units >= ct.pop_threshold AND c.margin >= th.margin_threshold THEN 'estrella'
          WHEN c.units >= ct.pop_threshold THEN 'caballo'
          WHEN c.margin >= th.margin_threshold THEN 'rompecabezas'
          ELSE 'perro' END)
      ORDER BY c.margin * c.units DESC) FROM calc c JOIN cat_th ct ON ct.category = c.category, th), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.marketing_menu_opportunities(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_menu_opportunities(uuid, integer) TO authenticated;

CREATE TABLE IF NOT EXISTS public.marketing_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  moment_date date NOT NULL,
  moment_title text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('instagram', 'story', 'whatsapp', 'google', 'tiktok')),
  title text,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  publish_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'discarded')),
  menu_item_ids uuid[] NOT NULL DEFAULT '{}',
  offer jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marketing_content_user_date_idx ON public.marketing_content (user_id, moment_date);

ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_all ON public.marketing_content;
CREATE POLICY owner_all ON public.marketing_content FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS team_read ON public.marketing_content;
CREATE POLICY team_read ON public.marketing_content FOR SELECT TO authenticated
  USING (user_id IN (SELECT public.team_owner_ids(ARRAY['brand'], 'read')));
DROP POLICY IF EXISTS team_write ON public.marketing_content;
CREATE POLICY team_write ON public.marketing_content FOR ALL TO authenticated
  USING (user_id IN (SELECT public.team_owner_ids(ARRAY['brand'], 'write')))
  WITH CHECK (user_id IN (SELECT public.team_owner_ids(ARRAY['brand'], 'write')));
DROP TRIGGER IF EXISTS aa_team_owner_user_id ON public.marketing_content;
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.marketing_content
  FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();

-- El calendario de partidos y eventos (demand_events) alimenta el generador de
-- horarios y el marketing, pero no tenía pantalla para cargarlo: solo lo llenaba
-- el seed de la demo. La pantalla vive en Marketing; quien tenga permiso de marca
-- también puede editarlo.
ALTER POLICY team_write ON public.demand_events
  USING (user_id IN (SELECT public.team_owner_ids(ARRAY['talent', 'reservations', 'brand'], 'write')))
  WITH CHECK (user_id IN (SELECT public.team_owner_ids(ARRAY['talent', 'reservations', 'brand'], 'write')));
DROP TRIGGER IF EXISTS aa_team_owner_user_id ON public.demand_events;
CREATE TRIGGER aa_team_owner_user_id BEFORE INSERT ON public.demand_events
  FOR EACH ROW EXECUTE FUNCTION public.assign_team_owner_user_id();
