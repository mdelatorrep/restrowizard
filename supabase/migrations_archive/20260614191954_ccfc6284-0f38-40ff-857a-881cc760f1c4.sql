-- Ensure Spanish cuisine enum values exist (idempotent), then reload PostgREST schema cache
DO $$
DECLARE v text;
BEGIN
  FOREACH v IN ARRAY ARRAY['mexicana','italiana','japonesa','china','coreana','tailandesa','india','americana','francesa','española','peruana','colombiana','argentina','arabe','mediterranea','mariscos','vegetariana','fusion','cafeteria','otra']
  LOOP
    BEGIN
      EXECUTE format('ALTER TYPE public.cuisine_type ADD VALUE IF NOT EXISTS %L', v);
    EXCEPTION WHEN others THEN NULL;
    END;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';