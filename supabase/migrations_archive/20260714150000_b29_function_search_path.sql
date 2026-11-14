-- ============================================================================
-- B-29 — Fijar search_path en funciones propias (aplicado y verificado por MCP).
-- Cierra el warning "Function Search Path Mutable" de los advisors para NUESTRAS
-- funciones. Excluye funciones de extensiones (pgvector/pgcrypto/etc., no nos
-- pertenecen). Idempotente. Verificado: redeem_loyalty_reward sigue operando.
-- ============================================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prokind='f'
      AND coalesce(array_to_string(p.proconfig,','),'') NOT LIKE '%search_path%'
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    BEGIN
      EXECUTE 'ALTER FUNCTION ' || r.sig || ' SET search_path = public, extensions';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
  END LOOP;
END $$;
