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

-- Public-readable tables (jobs board, services marketplace, courses, public menus/websites, etc.)
DO $$
DECLARE
    t text;
    anon_tables text[] := ARRAY[
        'jobs','candidate_profiles','candidate_experience',
        'service_providers','provider_portfolio','provider_reviews','service_requests','service_proposals',
        'training_courses','course_lessons','course_reviews','learning_tracks','learning_track_courses',
        'restaurant_menus','menu_categories','menu_items','menu_item_modifiers','menu_modifier_options','menu_item_modifier_links','menu_allergens','allergens',
        'restaurant_websites','restaurant_brands','restaurant_businesses',
        'event_quotations','quotation_gallery','quotation_menu_items','quotation_services',
        'venues','events','event_categories',
        'loyalty_customers','loyalty_tiers','loyalty_rewards_catalog',
        'growth_preregistrations','customer_feedback','feedback_campaigns',
        'measurement_units','website_templates','menu_templates','industry_benchmarks'
    ];
BEGIN
    FOREACH t IN ARRAY anon_tables LOOP
        IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=t AND c.relkind='r') THEN
            EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
        END IF;
    END LOOP;
END;
$$;

-- Default privileges so new tables also work going forward
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;