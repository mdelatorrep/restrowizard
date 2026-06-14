
-- Fix structural: grant Data-API privileges on every public base table.
-- RLS policies remain the gatekeeper for row-level access.
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r'
       AND n.nspname = 'public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
  END LOOP;
END;
$$;

-- Public-facing read access (anon) for tables whose RLS already exposes public rows.
DO $$
DECLARE
  t text;
  public_tables text[] := ARRAY[
    'restaurant_websites','restaurant_menus','menu_items','menu_categories',
    'menu_item_modifiers','menu_modifier_options','menu_item_modifier_links',
    'menu_allergens','allergens','measurement_units',
    'restaurant_brands','restaurant_businesses',
    'loyalty_tiers','loyalty_rewards','loyalty_rewards_catalog','loyalty_achievements',
    'event_quotations','quotation_menu_items','quotation_services','quotation_gallery',
    'jobs','service_providers','service_requests','provider_reviews','provider_portfolio',
    'venues','events','event_categories',
    'training_courses','course_lessons','learning_tracks','learning_track_courses','course_reviews',
    'website_templates','menu_templates','industry_benchmarks'
  ];
BEGIN
  FOREACH t IN ARRAY public_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=t AND c.relkind='r') THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    END IF;
  END LOOP;
  -- Pre-registration form needs anonymous insert
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='growth_preregistrations') THEN
    EXECUTE 'GRANT INSERT ON public.growth_preregistrations TO anon';
  END IF;
  -- Public feedback forms (slug-based)
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='customer_feedback') THEN
    EXECUTE 'GRANT INSERT ON public.customer_feedback TO anon';
  END IF;
  -- Public ordering (website)
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='restaurant_orders') THEN
    EXECUTE 'GRANT INSERT ON public.restaurant_orders TO anon';
  END IF;
  -- Public loyalty enrollment by slug
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='loyalty_customers') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.loyalty_customers TO anon';
  END IF;
  -- Public reservations from website
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='table_reservations') THEN
    EXECUTE 'GRANT INSERT ON public.table_reservations TO anon';
  END IF;
  -- Public job applications
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='job_applications') THEN
    EXECUTE 'GRANT INSERT ON public.job_applications TO anon';
  END IF;
END;
$$;

-- Also grant usage on sequences so INSERTs don't fail on serial/identity columns
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Future-proof: ensure new tables also inherit grants (best-effort)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
