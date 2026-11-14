-- B-13: estado de salud para monitoreo externo (GET /functions/v1/health).
CREATE OR REPLACE FUNCTION public.ops_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  v_failed jsonb := '[]'::jsonb;
BEGIN
  IF to_regclass('cron.job_run_details') IS NOT NULL THEN
    SELECT coalesce(jsonb_agg(DISTINCT j.jobname), '[]'::jsonb) INTO v_failed
      FROM cron.job_run_details d JOIN cron.job j USING (jobid)
     WHERE d.status = 'failed' AND d.start_time > now() - interval '24 hours';
  END IF;
  RETURN jsonb_build_object(
    'db', true,
    'cron_failed_24h', v_failed,
    'migrations_latest', (SELECT max(version) FROM supabase_migrations.schema_migrations)
  );
EXCEPTION WHEN undefined_table THEN
  RETURN jsonb_build_object('db', true, 'cron_failed_24h', v_failed, 'migrations_latest', NULL);
END;
$$;
REVOKE ALL ON FUNCTION public.ops_health() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ops_health() TO service_role;
