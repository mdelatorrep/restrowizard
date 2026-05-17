-- FASE 1 (P0): auditoría + índices + retención

-- 1. AUDIT LOG
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  business_id uuid,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  request_id text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_business ON public.audit_log(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_recent ON public.audit_log(created_at DESC);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read all audit" ON public.audit_log;
CREATE POLICY "Admins read all audit" ON public.audit_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Business owners read their audit" ON public.audit_log;
CREATE POLICY "Business owners read their audit" ON public.audit_log
  FOR SELECT USING (
    business_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.restaurant_businesses rb
      WHERE rb.id = audit_log.business_id AND rb.owner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Service role inserts audit" ON public.audit_log;
CREATE POLICY "Service role inserts audit" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- 2. TEAM PERMISSIONS HISTORY
CREATE TABLE IF NOT EXISTS public.team_permissions_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.restaurant_team_members(id) ON DELETE CASCADE,
  business_id uuid,
  user_id uuid,
  changed_by uuid,
  old_role text,
  new_role text,
  old_permissions jsonb,
  new_permissions jsonb,
  old_status text,
  new_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_perm_hist_member ON public.team_permissions_history(team_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_perm_hist_business ON public.team_permissions_history(business_id, created_at DESC);
ALTER TABLE public.team_permissions_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners and admins read team permission history" ON public.team_permissions_history;
CREATE POLICY "Owners and admins read team permission history" ON public.team_permissions_history
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.is_business_owner(auth.uid(), business_id)
  );

CREATE OR REPLACE FUNCTION public.log_team_member_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'UPDATE' AND (
       OLD.role IS DISTINCT FROM NEW.role
    OR OLD.permissions IS DISTINCT FROM NEW.permissions
    OR OLD.status IS DISTINCT FROM NEW.status
  ) THEN
    INSERT INTO public.team_permissions_history (
      team_member_id, business_id, user_id, changed_by,
      old_role, new_role, old_permissions, new_permissions, old_status, new_status
    ) VALUES (
      NEW.id, NEW.business_id, NEW.user_id, auth.uid(),
      OLD.role::text, NEW.role::text, OLD.permissions, NEW.permissions, OLD.status, NEW.status
    );
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS trg_log_team_member_change ON public.restaurant_team_members;
CREATE TRIGGER trg_log_team_member_change
AFTER UPDATE ON public.restaurant_team_members
FOR EACH ROW EXECUTE FUNCTION public.log_team_member_change();

-- 3. IMPERSONATION LOG
CREATE TABLE IF NOT EXISTS public.consultant_impersonation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid NOT NULL,
  client_user_id uuid NOT NULL,
  client_business_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  ip text,
  user_agent text
);
CREATE INDEX IF NOT EXISTS idx_imp_consultant ON public.consultant_impersonation_log(consultant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_imp_client ON public.consultant_impersonation_log(client_user_id, started_at DESC);
ALTER TABLE public.consultant_impersonation_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Consultants log their own impersonation" ON public.consultant_impersonation_log;
CREATE POLICY "Consultants log their own impersonation" ON public.consultant_impersonation_log
  FOR INSERT WITH CHECK (auth.uid() = consultant_id);
DROP POLICY IF EXISTS "Consultants read their own impersonation" ON public.consultant_impersonation_log;
CREATE POLICY "Consultants read their own impersonation" ON public.consultant_impersonation_log
  FOR SELECT USING (auth.uid() = consultant_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Consultants close their session" ON public.consultant_impersonation_log;
CREATE POLICY "Consultants close their session" ON public.consultant_impersonation_log
  FOR UPDATE USING (auth.uid() = consultant_id);

-- 4. PAYMENT WEBHOOK EVENTS
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  provider text NOT NULL,
  external_event_id text,
  event_type text,
  signature_valid boolean,
  payload jsonb,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, external_event_id)
);
CREATE INDEX IF NOT EXISTS idx_pwe_user ON public.payment_webhook_events(user_id, created_at DESC);
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read their payment webhooks" ON public.payment_webhook_events;
CREATE POLICY "Users read their payment webhooks" ON public.payment_webhook_events
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 5. FK INDEXES (117)
CREATE INDEX IF NOT EXISTS idx_aggregator_integrations_brand_id ON public.aggregator_integrations(brand_id);
CREATE INDEX IF NOT EXISTS idx_aggregator_orders_brand_id ON public.aggregator_orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_benefit_requests_benefit_id ON public.benefit_requests(benefit_id);
CREATE INDEX IF NOT EXISTS idx_benefit_requests_staff_member_id ON public.benefit_requests(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_brand_id ON public.brand_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_menus_brand_id ON public.brand_menus(brand_id);
CREATE INDEX IF NOT EXISTS idx_candidate_experience_candidate_id ON public.candidate_experience(candidate_id);
CREATE INDEX IF NOT EXISTS idx_chain_locations_chain_id ON public.chain_locations(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_master_menus_chain_id ON public.chain_master_menus(chain_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checklists_chain_id ON public.compliance_checklists(chain_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_checklist_id ON public.compliance_records(checklist_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_location_id ON public.compliance_records(location_id);
CREATE INDEX IF NOT EXISTS idx_consultant_clients_consultant_id ON public.consultant_clients(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_reports_client_id ON public.consultant_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_consultant_reports_consultant_id ON public.consultant_reports(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consulting_invoices_client_id ON public.consulting_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_consulting_invoices_consultant_id ON public.consulting_invoices(consultant_id);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation_id ON public.copilot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_course_id ON public.course_certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_track_id ON public.course_certificates(track_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_certificate_id ON public.course_enrollments(certificate_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_campaign_id ON public.customer_feedback(campaign_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_order_id ON public.customer_feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_event_quotations_consultant_id ON public.event_quotations(consultant_id);
CREATE INDEX IF NOT EXISTS idx_event_quotations_restaurant_id ON public.event_quotations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_event_quotations_zone_id ON public.event_quotations(zone_id);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON public.events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON public.events(venue_id);
CREATE INDEX IF NOT EXISTS idx_inventory_count_items_count_id ON public.inventory_count_items(count_id);
CREATE INDEX IF NOT EXISTS idx_inventory_count_items_inventory_item_id ON public.inventory_count_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_storage_location_id ON public.inventory_counts(storage_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_deductions_inventory_item_id ON public.inventory_deductions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_deductions_order_id ON public.inventory_deductions(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_deductions_recipe_id ON public.inventory_deductions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item_suppliers_supplier_id ON public.inventory_item_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_from_location_id ON public.inventory_movements(from_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_to_location_id ON public.inventory_movements(to_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_price_history_inventory_item_id ON public.inventory_price_history(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_price_history_supplier_id ON public.inventory_price_history(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_chain_id ON public.inventory_transfers(chain_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_from_location_id ON public.inventory_transfers(from_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_to_location_id ON public.inventory_transfers(to_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_waste_inventory_item_id ON public.inventory_waste(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_waste_storage_location_id ON public.inventory_waste(storage_location_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate_profile_id ON public.job_applications(candidate_profile_id);
CREATE INDEX IF NOT EXISTS idx_job_saved_job_id ON public.job_saved(job_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_production_queue_brand_id ON public.kitchen_production_queue(brand_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_production_queue_order_id ON public.kitchen_production_queue(order_id);
CREATE INDEX IF NOT EXISTS idx_learning_track_courses_course_id ON public.learning_track_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id ON public.lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customer_achievements_achievement_id ON public.loyalty_customer_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_catalog_item_id ON public.loyalty_rewards(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_catalog_min_tier_id ON public.loyalty_rewards_catalog(min_tier_id);
CREATE INDEX IF NOT EXISTS idx_measurement_units_base_unit_id ON public.measurement_units(base_unit_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_id ON public.menu_categories(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_modifier_links_modifier_id ON public.menu_item_modifier_links(modifier_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_modifiers_menu_id ON public.menu_item_modifiers(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_recipe_id ON public.menu_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_menu_modifier_options_modifier_id ON public.menu_modifier_options(modifier_id);
CREATE INDEX IF NOT EXISTS idx_opening_checklist_items_project_id ON public.opening_checklist_items(project_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_pos_cash_movements_session_id ON public.pos_cash_movements(session_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_payment_method_id ON public.pos_transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_pre_opening_tasks_project_id ON public.pre_opening_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_provider_portfolio_provider_id ON public.provider_portfolio(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider_id ON public.provider_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_request_id ON public.provider_reviews(request_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_inventory_item_id ON public.purchase_order_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_quotation_gallery_quotation_id ON public.quotation_gallery(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_menu_items_menu_item_id ON public.quotation_menu_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_quotation_menu_items_quotation_id ON public.quotation_menu_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_services_quotation_id ON public.quotation_services(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_services_service_provider_id ON public.quotation_services(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_rappi_menu_sync_menu_item_id ON public.rappi_menu_sync(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_rappi_webhook_events_integration_id ON public.rappi_webhook_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_inventory_item_id ON public.recipe_ingredients(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_unit_id ON public.recipe_ingredients(unit_id);
CREATE INDEX IF NOT EXISTS idx_recipe_versions_recipe_id ON public.recipe_versions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_menu_item_id ON public.recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_brand_id ON public.restaurant_menus(brand_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_template_id ON public.restaurant_menus(template_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_discount_id ON public.restaurant_orders(discount_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_split_from_order_id ON public.restaurant_orders(split_from_order_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_zone_id ON public.restaurant_tables(zone_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_team_members_staff_member_id ON public.restaurant_team_members(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_websites_template_id ON public.restaurant_websites(template_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_websites_user_id ON public.restaurant_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_zones_consultant_id ON public.restaurant_zones(consultant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_zones_restaurant_id ON public.restaurant_zones(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_event_id ON public.service_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_proposal_id ON public.service_bookings(proposal_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_request_id ON public.service_bookings(request_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_review_id ON public.service_bookings(review_id);
CREATE INDEX IF NOT EXISTS idx_service_proposals_provider_id ON public.service_proposals(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_proposals_request_id ON public.service_proposals(request_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_owner_id ON public.service_providers(owner_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_requesting_staff_id ON public.shift_swap_requests(requesting_staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_target_shift_id ON public.shift_swap_requests(target_shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_target_staff_id ON public.shift_swap_requests(target_staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_benefit_assignments_benefit_id ON public.staff_benefit_assignments(benefit_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_template_id ON public.staff_shifts(template_id);
CREATE INDEX IF NOT EXISTS idx_staff_training_progress_training_program_id ON public.staff_training_progress(training_program_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_order_id ON public.support_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_table_reservations_loyalty_customer_id ON public.table_reservations(loyalty_customer_id);
CREATE INDEX IF NOT EXISTS idx_table_reservations_user_id ON public.table_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_training_courses_instructor_id ON public.training_courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_venue_bookings_event_id ON public.venue_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_venues_owner_id ON public.venues(owner_id);

-- 6. COMPOSITE INDEXES
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_user_created ON public.restaurant_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aggregator_orders_user_created ON public.aggregator_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aggregator_orders_user_platform_status ON public.aggregator_orders(user_id, platform, order_status);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_session_created ON public.pos_transactions(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_order_created ON public.pos_transactions(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_created ON public.inventory_movements(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id_sort ON public.menu_items(menu_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_restaurant_team_members_user_status ON public.restaurant_team_members(user_id, status);

-- 7. RETENTION CRON
DO $body$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobname) FROM cron.job
      WHERE jobname IN ('purge_debug_events', 'purge_notifications_log', 'purge_rappi_webhook_events', 'purge_audit_log');

    PERFORM cron.schedule('purge_debug_events', '15 3 * * *',
      $cron$ DELETE FROM public.debug_events WHERE created_at < now() - interval '90 days' $cron$);
    PERFORM cron.schedule('purge_notifications_log', '20 3 * * *',
      $cron$ DELETE FROM public.notifications_log WHERE created_at < now() - interval '180 days' $cron$);
    PERFORM cron.schedule('purge_rappi_webhook_events', '25 3 * * *',
      $cron$ DELETE FROM public.rappi_webhook_events WHERE received_at < now() - interval '365 days' $cron$);
    PERFORM cron.schedule('purge_audit_log', '30 3 * * *',
      $cron$ DELETE FROM public.audit_log WHERE created_at < now() - interval '730 days' $cron$);
  END IF;
END
$body$;