DO $$
DECLARE
  t text;
  excluded text[] := ARRAY[
    'user_roles','profiles','knowledge_chunks','knowledge_sources',
    'payment_webhook_events','rappi_menu_sync','rappi_settlements','rappi_store_status',
    'team_permissions_history','notifications_log','push_subscriptions',
    'inventory_movements','inventory_deductions','order_status_history',
    'lesson_progress','course_certificates','course_enrollments',
    'kitchen_production_queue','aggregator_orders','rappi_webhook_events',
    'inventory_price_history'
  ];
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_name = c.table_name AND tb.table_schema = c.table_schema
    WHERE c.table_schema = 'public'
      AND c.column_name = 'user_id'
      AND tb.table_type = 'BASE TABLE'
      AND c.table_name <> ALL (excluded)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS ensure_user_id_for_rls ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER ensure_user_id_for_rls
         BEFORE INSERT OR UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_for_rls()',
      t
    );
  END LOOP;
END $$;