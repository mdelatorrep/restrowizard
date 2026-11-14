-- Trabajos programados (pg_cron), portables entre proyectos (B-04).
--
-- Requiere dos secretos en Vault:
--   project_url  → https://<ref>.supabase.co   (sin barra final)
--   CRON_SECRET  → el mismo valor que el secreto CRON_SECRET de las edge functions
-- Ver docs/operacion/base-reproducible.md.

DO $$
DECLARE
  j text;
BEGIN
  FOREACH j IN ARRAY ARRAY[
    'demo-restaurant-reset', 'demo-restaurant-tick', 'finance-materialize-recurring',
    'purge_ai_usage_daily', 'purge_audit_log', 'purge_debug_events', 'purge_notifications_log',
    'purge_pos_pin_attempts', 'purge_rappi_webhook_events',
    'rappi-orders-poll-every-minute', 'rappi-settlements-daily'
  ] LOOP
    PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname = j;
  END LOOP;

  -- Demo
  PERFORM cron.schedule('demo-restaurant-reset', '5 9 * * *', 'SELECT public.seed_demo_restaurant()');
  PERFORM cron.schedule('demo-restaurant-tick', '2 * * * *', 'SELECT public.demo_tick()');

  -- Finanzas
  PERFORM cron.schedule('finance-materialize-recurring', '20 10 * * *', 'SELECT public.finance_materialize_recurring()');

  -- Retención
  PERFORM cron.schedule('purge_debug_events', '15 3 * * *', $c$DELETE FROM public.debug_events WHERE created_at < now() - interval '90 days'$c$);
  PERFORM cron.schedule('purge_notifications_log', '20 3 * * *', $c$DELETE FROM public.notifications_log WHERE created_at < now() - interval '180 days'$c$);
  PERFORM cron.schedule('purge_rappi_webhook_events', '25 3 * * *', $c$DELETE FROM public.rappi_webhook_events WHERE received_at < now() - interval '365 days'$c$);
  PERFORM cron.schedule('purge_audit_log', '30 3 * * *', $c$DELETE FROM public.audit_log WHERE created_at < now() - interval '730 days'$c$);
  PERFORM cron.schedule('purge_pos_pin_attempts', '35 3 * * *', $c$DELETE FROM public.pos_pin_attempts WHERE created_at < now() - interval '30 days'$c$);
  PERFORM cron.schedule('purge_ai_usage_daily', '40 3 * * *', $c$DELETE FROM public.ai_usage_daily WHERE day < (now() AT TIME ZONE 'America/Bogota')::date - 90$c$);

  -- Rappi: solo si hay integraciones activas (B-25)
  PERFORM cron.schedule('rappi-orders-poll-every-minute', '* * * * *', $c$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/rappi-orders-poll',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{}'::jsonb)
    WHERE EXISTS (SELECT 1 FROM public.aggregator_integrations WHERE platform = 'rappi' AND is_active)
  $c$);
  PERFORM cron.schedule('rappi-settlements-daily', '0 4 * * *', $c$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/rappi-settlements-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{}'::jsonb)
    WHERE EXISTS (SELECT 1 FROM public.aggregator_integrations WHERE platform = 'rappi' AND is_active)
  $c$);
END $$;
