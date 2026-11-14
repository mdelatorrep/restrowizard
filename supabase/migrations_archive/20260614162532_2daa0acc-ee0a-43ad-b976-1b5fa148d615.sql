CREATE OR REPLACE FUNCTION public.ensure_user_id_for_rls()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.user_id := COALESCE(NEW.user_id, auth.uid());
  ELSE
    NEW.user_id := COALESCE(NEW.user_id, OLD.user_id, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  r RECORD;
  trigger_name TEXT;
BEGIN
  FOR r IN
    SELECT DISTINCT c.table_schema, c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'user_id'
      AND t.table_type = 'BASE TABLE'
  LOOP
    trigger_name := format('ensure_user_id_%s', r.table_name);

    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I.%I',
      trigger_name,
      r.table_schema,
      r.table_name
    );

    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls()',
      trigger_name,
      r.table_schema,
      r.table_name
    );
  END LOOP;
END;
$$;