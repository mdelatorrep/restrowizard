-- B-25: topes al costo de IA y crons ociosos. También lleva al repo los dos
-- trabajos de Rappi que vivían solo en producción (parte de B-04).

-- 1. Uso diario de IA por usuario y función --------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  user_id    uuid        NOT NULL,
  fn         text        NOT NULL,
  day        date        NOT NULL DEFAULT (now() AT TIME ZONE 'America/Bogota')::date,
  calls      integer     NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, fn, day)
);
ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo service_role (edge functions) la lee y escribe.

-- Suma una llamada y devuelve el total del día. La edge function decide el tope.
CREATE OR REPLACE FUNCTION public.ai_usage_bump(p_user uuid, p_fn text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.ai_usage_daily AS u (user_id, fn, day, calls, updated_at)
  VALUES (p_user, p_fn, (now() AT TIME ZONE 'America/Bogota')::date, 1, now())
  ON CONFLICT (user_id, fn, day)
  DO UPDATE SET calls = u.calls + 1, updated_at = now()
  RETURNING calls;
$$;
REVOKE ALL ON FUNCTION public.ai_usage_bump(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_usage_bump(uuid, text) TO service_role;

-- Retención: 90 días.
DO $$
BEGIN
  PERFORM cron.unschedule('purge_ai_usage_daily')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_ai_usage_daily');
  PERFORM cron.schedule('purge_ai_usage_daily', '40 3 * * *',
    $c$DELETE FROM public.ai_usage_daily WHERE day < (now() AT TIME ZONE 'America/Bogota')::date - 90$c$);
END $$;

-- 2. Crons de Rappi: solo llaman a la función si hay integraciones activas --
DO $$
BEGIN
  PERFORM cron.unschedule(jobname) FROM cron.job
   WHERE jobname IN ('rappi-orders-poll-every-minute', 'rappi-settlements-daily');

  PERFORM cron.schedule('rappi-orders-poll-every-minute', '* * * * *', $c$
    SELECT net.http_post(
      url := 'https://jeqmnulrerilwixohvgw.functions.supabase.co/rappi-orders-poll',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')
      ),
      body := '{}'::jsonb
    )
    WHERE EXISTS (SELECT 1 FROM public.aggregator_integrations WHERE platform = 'rappi' AND is_active);
  $c$);

  PERFORM cron.schedule('rappi-settlements-daily', '0 4 * * *', $c$
    SELECT net.http_post(
      url := 'https://jeqmnulrerilwixohvgw.functions.supabase.co/rappi-settlements-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')
      ),
      body := '{}'::jsonb
    )
    WHERE EXISTS (SELECT 1 FROM public.aggregator_integrations WHERE platform = 'rappi' AND is_active);
  $c$);
END $$;
