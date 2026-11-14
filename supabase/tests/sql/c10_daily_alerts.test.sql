-- C-10: las alertas diarias se generan una sola vez por día y tipo.
BEGIN;
DO $$
DECLARE n1 int; n2 int; v_owner uuid := (SELECT user_id FROM public.restaurant_websites WHERE slug = 'clutch-sports-bar');
BEGIN
  -- Fuerza un insumo bajo mínimo en la demo.
  UPDATE public.inventory_items SET min_stock_level = 10, current_stock = 1, track_stock = true
   WHERE id = (SELECT id FROM public.inventory_items WHERE user_id = v_owner LIMIT 1);
  n1 := public.generate_daily_alerts();
  n2 := public.generate_daily_alerts();
  IF n1 < 1 THEN RAISE EXCEPTION 'no generó alertas (n1=%)', n1; END IF;
  IF n2 <> 0 THEN RAISE EXCEPTION 'duplicó alertas (n2=%)', n2; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.copilot_alerts WHERE user_id = v_owner AND alert_type = 'low_stock') THEN
    RAISE EXCEPTION 'falta la alerta de inventario';
  END IF;
END $$;
ROLLBACK;
\echo 'ok c10_daily_alerts'
