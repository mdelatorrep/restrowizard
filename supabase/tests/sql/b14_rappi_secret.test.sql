-- B-14: una integración de Rappi activa sin secreto de webhook se rechaza.
BEGIN;
DO $$
BEGIN
  BEGIN
    INSERT INTO public.aggregator_integrations (user_id, platform, is_active, webhook_secret)
    VALUES ((SELECT owner_id FROM public.restaurant_businesses LIMIT 1), 'rappi', true, NULL);
    RAISE EXCEPTION 'se aceptó Rappi activo sin secreto';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;
ROLLBACK;
\echo 'ok b14_rappi_secret'
