DO $$
DECLARE
  tbl record;
  has_priv boolean;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r' AND n.nspname = 'public'
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
       WHERE grantee='authenticated' AND table_schema='public' AND table_name=tbl.table_name
         AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')
    ) INTO has_priv;
    IF NOT has_priv THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
       WHERE grantee='service_role' AND table_schema='public' AND table_name=tbl.table_name
         AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')
    ) INTO has_priv;
    IF NOT has_priv THEN
      EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
    END IF;
  END LOOP;
END;
$$;

-- Public-readable tables (anon read)
DO $$
DECLARE
  t text;
  public_read_tables text[] := ARRAY[
    'jobs','training_courses','course_lessons','course_reviews',
    'learning_tracks','learning_track_courses','service_providers',
    'provider_portfolio','provider_reviews','growth_preregistrations',
    'restaurant_websites','restaurant_menus','menu_categories','menu_items',
    'menu_item_modifiers','menu_modifier_options','menu_item_modifier_links',
    'menu_allergens','allergens','event_categories','venues','venue_bookings',
    'restaurant_brands','brand_menus','brand_assets'
  ];
BEGIN
  FOREACH t IN ARRAY public_read_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=t) THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    END IF;
  END LOOP;
END;
$$;