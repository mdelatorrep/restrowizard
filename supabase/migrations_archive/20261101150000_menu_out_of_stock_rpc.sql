-- Platos agotados para el POS sin abrir el inventario al cajero.
--
-- useMenuAvailability leía inventory_items desde el cliente. El cajero no tiene
-- permiso de inventario (ni debe ver costos), así que cada ingrediente quedaba
-- con stock 0 y el POS marcaba toda la carta como agotada. Esta función hace el
-- mismo cálculo en el servidor y devuelve solo los ids de los platos agotados.
-- Misma regla que el cliente: ingrediente obligatorio de la receta principal,
-- cantidad ajustada por rendimiento (0 o vacío = 100%), track_stock=false nunca
-- agota.

CREATE OR REPLACE FUNCTION public.menu_out_of_stock_ids(p_owner uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH links AS (
    SELECT r.id AS recipe_id, r.menu_item_id
    FROM recipes r
    WHERE r.user_id = p_owner AND r.menu_item_id IS NOT NULL
    UNION
    SELECT l.recipe_id, l.menu_item_id
    FROM recipe_menu_items l
    JOIN recipes r ON r.id = l.recipe_id
    WHERE r.user_id = p_owner AND l.is_primary
  )
  SELECT DISTINCT links.menu_item_id
  FROM links
  JOIN recipe_ingredients ri ON ri.recipe_id = links.recipe_id
  JOIN inventory_items ii ON ii.id = ri.inventory_item_id
  WHERE p_owner IN (SELECT public.team_owner_ids(ARRAY['pos', 'orders', 'menus', 'inventory'], 'read'))
    AND NOT coalesce(ri.is_optional, false)
    AND coalesce(ii.track_stock, true)
    AND coalesce(ri.quantity, 0) > 0
    AND coalesce(ii.current_stock, 0) <
        ri.quantity * 100.0 / CASE WHEN coalesce(ri.yield_percentage, 0) > 0 THEN ri.yield_percentage ELSE 100 END;
$$;

REVOKE ALL ON FUNCTION public.menu_out_of_stock_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.menu_out_of_stock_ids(uuid) TO authenticated;
