-- C-10: alertas diarias. Cada mañana se revisa el día de negocio anterior de
-- cada restaurante y se crean alertas cuando algo se sale de rango. El correo
-- lo envía la edge function send-daily-alerts.

CREATE TABLE IF NOT EXISTS public.alert_settings (
  user_id         uuid PRIMARY KEY,
  email_enabled   boolean     NOT NULL DEFAULT true,
  sales_drop_pct  integer     NOT NULL DEFAULT 25 CHECK (sales_drop_pct BETWEEN 5 AND 90),
  low_stock       boolean     NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alert_settings: el dueño lee" ON public.alert_settings;
CREATE POLICY "alert_settings: el dueño lee" ON public.alert_settings
  FOR SELECT TO authenticated USING (user_id IN (SELECT public.team_owner_ids(ARRAY['dashboard'], 'read')));
DROP POLICY IF EXISTS "alert_settings: el dueño escribe" ON public.alert_settings;
CREATE POLICY "alert_settings: el dueño escribe" ON public.alert_settings
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE ON public.alert_settings TO authenticated;
GRANT ALL ON public.alert_settings TO service_role;

-- Día de negocio en Bogotá con corte a las 6 a. m.
CREATE OR REPLACE FUNCTION public.business_day_of(ts timestamptz)
RETURNS date LANGUAGE sql IMMUTABLE AS
$$ SELECT ((ts AT TIME ZONE 'America/Bogota') - interval '6 hours')::date $$;

CREATE OR REPLACE FUNCTION public.generate_daily_alerts(p_day date DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day date := coalesce(p_day, public.business_day_of(now()) - 1);
  r record;
  v_sales numeric;
  v_avg numeric;
  v_drop int;
  v_low int;
  v_names text;
  v_created int := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT b.owner_id AS uid
      FROM restaurant_businesses b
     WHERE EXISTS (SELECT 1 FROM restaurant_orders o
                    WHERE o.user_id = b.owner_id AND o.created_at > now() - interval '35 days')
        OR EXISTS (SELECT 1 FROM inventory_items i WHERE i.user_id = b.owner_id)
  LOOP
    SELECT coalesce(s.sales_drop_pct, 25), coalesce(s.low_stock, true)::int
      INTO v_drop, v_low
      FROM (SELECT 1) x LEFT JOIN alert_settings s ON s.user_id = r.uid;

    -- 1. Caída de ventas frente al mismo día de las cuatro semanas anteriores
    SELECT coalesce(sum(total), 0) INTO v_sales
      FROM restaurant_orders
     WHERE user_id = r.uid AND public.business_day_of(created_at) = v_day
       AND coalesce(status, '') NOT IN ('cancelled', 'canceled', 'void', 'rejected');
    SELECT avg(t) INTO v_avg FROM (
      SELECT sum(total) t FROM restaurant_orders
       WHERE user_id = r.uid
         AND public.business_day_of(created_at) IN (v_day - 7, v_day - 14, v_day - 21, v_day - 28)
         AND coalesce(status, '') NOT IN ('cancelled', 'canceled', 'void', 'rejected')
       GROUP BY public.business_day_of(created_at)) w;

    IF v_avg > 0 AND v_sales < v_avg * (1 - v_drop / 100.0)
       AND NOT EXISTS (SELECT 1 FROM copilot_alerts WHERE user_id = r.uid AND alert_type = 'daily_sales_drop'
                         AND data->>'day' = v_day::text) THEN
      INSERT INTO copilot_alerts (user_id, alert_type, priority, title, message, data, action_url)
      VALUES (r.uid, 'daily_sales_drop', 'high',
        format('Ventas %s %% por debajo de lo normal', round((1 - v_sales / v_avg) * 100)),
        format('El %s vendiste $%s; un %s normal vendes $%s.',
               to_char(v_day, 'DD/MM'), to_char(round(v_sales), 'FM999G999G999'),
               trim(to_char(v_day, 'TMDay')), to_char(round(v_avg), 'FM999G999G999')),
        jsonb_build_object('day', v_day, 'sales', round(v_sales), 'baseline', round(v_avg), 'threshold_pct', v_drop),
        '/r/pos-reports');
      v_created := v_created + 1;
    END IF;

    -- 2. Insumos en o por debajo del mínimo
    IF v_low = 1 THEN
      SELECT count(*), string_agg(item_name, ', ' ORDER BY current_stock / nullif(min_stock_level, 0))
        INTO v_low, v_names
        FROM (SELECT item_name, current_stock, min_stock_level FROM inventory_items
               WHERE user_id = r.uid AND coalesce(track_stock, true)
                 AND coalesce(min_stock_level, 0) > 0 AND current_stock <= min_stock_level
               ORDER BY current_stock / nullif(min_stock_level, 0) LIMIT 50) li;
      IF v_low > 0 AND NOT EXISTS (SELECT 1 FROM copilot_alerts WHERE user_id = r.uid AND alert_type = 'low_stock'
                                     AND data->>'day' = v_day::text) THEN
        INSERT INTO copilot_alerts (user_id, alert_type, priority, title, message, data, action_url)
        VALUES (r.uid, 'low_stock', CASE WHEN v_low >= 5 THEN 'high' ELSE 'medium' END::copilot_alert_priority,
          format('%s insumos en el mínimo', v_low),
          'Revisa y pide: ' || left(v_names, 300),
          jsonb_build_object('day', v_day, 'count', v_low),
          '/r/inventory');
        v_created := v_created + 1;
      END IF;
    END IF;
  END LOOP;
  RETURN v_created;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_daily_alerts(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_daily_alerts(date) TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('daily-alerts-generate', 'daily-alerts-email');
  -- 6:50 a. m. en Bogotá: genera; 7:00 a. m.: envía el correo.
  PERFORM cron.schedule('daily-alerts-generate', '50 11 * * *', 'SELECT public.generate_daily_alerts()');
  PERFORM cron.schedule('daily-alerts-email', '0 12 * * *', $c$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/send-daily-alerts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{}'::jsonb)
  $c$);
END $$;
