
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'inventory_items','restaurant_brands','restaurant_menus','daily_sales','staff_members',
    'customer_feedback','loyalty_customers','suppliers','recipes','sales_goals','support_tickets',
    'maturity_diagnoses','pos_payment_methods','pos_discounts','menu_categories','restaurant_tables',
    'storage_locations','inventory_suppliers','menu_item_modifiers','loyalty_tiers','loyalty_rewards',
    'loyalty_rewards_catalog','loyalty_campaigns','loyalty_achievements','loyalty_points_transactions',
    'brand_assets','inventory_counts','inventory_count_items','inventory_waste','purchase_orders',
    'pre_opening_tasks','opening_checklist_items','opening_phase_analyses','opening_analysis_runs',
    'business_opening_projects','staff_shifts','recipe_steps','recipe_nutrition','recipe_sub_recipes',
    'inventory_item_suppliers','knowledge_sources','payment_gateway_credentials','provider_portfolio',
    'service_bookings','service_proposals','service_requests','course_reviews','course_enrollments',
    'reviews','restaurant_websites','consultant_clients','staff_benefits','benefit_requests','debug_events'
  ]) LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT auth.uid()', t);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'skip %: %', t, SQLERRM;
    END;
  END LOOP;
END $$;
