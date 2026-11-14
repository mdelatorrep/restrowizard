# Lógica que vive en la base

Generado por `scripts/gen-reference-docs.py` el 2026-11-14 desde `supabase/migrations/`. No editar a mano.

112 funciones en `public` (91 SECURITY DEFINER) y 293 triggers. Varias reglas de negocio que mueven dinero (inventario por venta, propinas, puntos de lealtad, auditoría inmutable del POS) se ejecutan aquí y no en el código de la app; cualquier cambio en ellas va por migración y con prueba en `supabase/tests/sql/`. El criterio de qué va en la base y qué en la app está en [ADR-0001](../adr/0001-logica-en-base.md).


## POS y caja

| Tabla | Trigger | Momento | Evento | Función | SECURITY DEFINER |
| --- | --- | --- | --- | --- | --- |
| aggregator_orders | ensure_user_id_aggregator_orders | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| aggregator_orders | update_aggregator_orders_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| kitchen_production_queue | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| kitchen_production_queue | ensure_user_id_kitchen_production_queue | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| pos_audit_log | trg_pos_audit_no_delete | BEFORE | DELETE | `pos_audit_immutable` |  |
| pos_audit_log | trg_pos_audit_no_update | BEFORE | UPDATE | `pos_audit_immutable` |  |
| pos_discounts | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| pos_discounts | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| pos_discounts | ensure_user_id_pos_discounts | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| pos_discounts | update_pos_discounts_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| pos_payment_methods | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| pos_payment_methods | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| pos_payment_methods | ensure_user_id_pos_payment_methods | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| pos_payment_methods | update_pos_payment_methods_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| pos_sessions | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| pos_sessions | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| pos_sessions | ensure_user_id_pos_sessions | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| pos_sessions | trg_pos_audit_session | AFTER | INSERT / UPDATE | `pos_audit_session` | Sí |
| pos_sessions | update_pos_sessions_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| pos_transactions | trg_pos_audit_transaction | AFTER | INSERT / UPDATE | `pos_audit_transaction` | Sí |
| purchase_orders | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| purchase_orders | ensure_user_id_purchase_orders | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| purchase_orders | trigger_generate_po_number | BEFORE | INSERT | `generate_po_number` | Sí |
| restaurant_orders | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| restaurant_orders | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_orders | ensure_user_id_restaurant_orders | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_orders | sync_loyalty_from_orders | AFTER | INSERT / UPDATE OF status, total, customer_email, customer_phone | `trg_sync_loyalty_from_orders` | Sí |
| restaurant_orders | trg_log_order_status_change | AFTER | INSERT / UPDATE OF status | `log_order_status_change` | Sí |
| restaurant_orders | trg_order_inventory_deduction | AFTER | INSERT / UPDATE OF status | `trg_order_inventory_deduction` | Sí |
| restaurant_orders | trg_pos_audit_order | AFTER | INSERT / UPDATE | `pos_audit_order_change` | Sí |
| restaurant_orders | trigger_menu_scores_on_order | AFTER | INSERT / UPDATE | `trigger_update_menu_scores_on_order` |  |
| restaurant_orders | update_restaurant_orders_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| restaurant_tables | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| restaurant_tables | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_tables | ensure_user_id_restaurant_tables | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_tables | update_restaurant_tables_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| table_reservations | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| table_reservations | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| table_reservations | ensure_user_id_table_reservations | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| table_reservations | generate_reservation_code | BEFORE | INSERT | `generate_reservation_confirmation_code` |  |
| table_reservations | update_table_reservations_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| tip_allocations | trg_tip_allocations_locked | BEFORE | INSERT / DELETE / UPDATE | `tg_tip_allocations_locked` |  |

## Inventario y recetas

| Tabla | Trigger | Momento | Evento | Función | SECURITY DEFINER |
| --- | --- | --- | --- | --- | --- |
| inventory_counts | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| inventory_counts | ensure_user_id_inventory_counts | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| inventory_deductions | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| inventory_deductions | ensure_user_id_inventory_deductions | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| inventory_items | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| inventory_items | ensure_user_id_inventory_items | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| inventory_items | trigger_record_inventory_movement | AFTER | UPDATE | `record_inventory_movement` | Sí |
| inventory_items | trigger_record_price_change | AFTER | UPDATE | `record_price_change` | Sí |
| inventory_items | update_inventory_items_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| inventory_movements | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| inventory_movements | ensure_user_id_inventory_movements | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| inventory_suppliers | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| inventory_suppliers | ensure_user_id_inventory_suppliers | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| inventory_waste | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| inventory_waste | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| inventory_waste | ensure_user_id_inventory_waste | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| menu_items | trg_sync_menu_item_to_recipe | AFTER | UPDATE OF recipe_id | `sync_menu_item_to_recipe` | Sí |
| recipe_nutrition | update_recipe_nutrition_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| recipe_steps | update_recipe_steps_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| recipes | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| recipes | ensure_user_id_recipes | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| recipes | trg_sync_recipe_to_menu_item | AFTER | UPDATE OF menu_item_id | `sync_recipe_to_menu_item` | Sí |
| recipes | update_recipes_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| supplier_analysis | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| supplier_analysis | ensure_user_id_supplier_analysis | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| supplier_analysis | update_supplier_analysis_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| supplier_invoices | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| supplier_invoices | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| supplier_invoices | ensure_user_id_supplier_invoices | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| supplier_invoices | trg_supplier_invoices_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| suppliers | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| suppliers | ensure_user_id_suppliers | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| suppliers | update_suppliers_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |

## Finanzas

| Tabla | Trigger | Momento | Evento | Función | SECURITY DEFINER |
| --- | --- | --- | --- | --- | --- |
| finance_accounts | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| finance_settings | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| finance_settlements | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| rappi_settlements | ensure_user_id_rappi_settlements | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_expenses | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| social_accounts | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| social_accounts | ensure_user_id_social_accounts | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |

## Fidelización y feedback

| Tabla | Trigger | Momento | Evento | Función | SECURITY DEFINER |
| --- | --- | --- | --- | --- | --- |
| course_reviews | ensure_user_id_course_reviews | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| course_reviews | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| course_reviews | trg_update_course_avg_rating | AFTER | INSERT / DELETE / UPDATE | `update_course_avg_rating` | Sí |
| customer_feedback | ensure_user_id_customer_feedback | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| customer_feedback | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| feedback_campaigns | ensure_user_id_feedback_campaigns | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| feedback_campaigns | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_achievements | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_achievements | ensure_user_id_loyalty_achievements | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_campaigns | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_campaigns | ensure_user_id_loyalty_campaigns | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_campaigns | update_loyalty_campaigns_updated_at | BEFORE | UPDATE | `update_loyalty_updated_at` |  |
| loyalty_customers | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| loyalty_customers | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_customers | ensure_user_id_loyalty_customers | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_customers | sync_loyalty_customer_restaurant_name | BEFORE | INSERT / UPDATE OF user_id | `sync_restaurant_name_to_loyalty_customer` | Sí |
| loyalty_customers | trigger_generate_loyalty_code | BEFORE | INSERT | `generate_loyalty_code` |  |
| loyalty_customers | update_loyalty_customers_updated_at | BEFORE | UPDATE | `update_loyalty_updated_at` |  |
| loyalty_points_transactions | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_points_transactions | ensure_user_id_loyalty_points_transactions | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_points_transactions | trigger_update_customer_tier | AFTER | INSERT | `update_customer_tier` | Sí |
| loyalty_rewards | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_rewards | ensure_user_id_loyalty_rewards | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_rewards_catalog | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_rewards_catalog | ensure_user_id_loyalty_rewards_catalog | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_rewards_catalog | update_loyalty_rewards_catalog_updated_at | BEFORE | UPDATE | `update_loyalty_updated_at` |  |
| loyalty_tiers | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_tiers | ensure_user_id_loyalty_tiers | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| loyalty_tiers | update_loyalty_tiers_updated_at | BEFORE | UPDATE | `update_loyalty_updated_at` |  |
| provider_reviews | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| provider_reviews | ensure_user_id_provider_reviews | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| provider_reviews | trg_update_provider_review_stats | AFTER | INSERT / DELETE / UPDATE | `update_provider_review_stats` | Sí |
| reviews | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| reviews | ensure_user_id_reviews | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| reviews | update_reviews_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |

## Equipo y permisos

| Tabla | Trigger | Momento | Evento | Función | SECURITY DEFINER |
| --- | --- | --- | --- | --- | --- |
| demand_events | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| marketing_content | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| restaurant_businesses | trg_seed_roles_on_business_insert | AFTER | INSERT | `tg_seed_roles_for_new_business` | Sí |
| restaurant_custom_roles | trg_custom_roles_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| restaurant_menus | aa_team_owner_user_id | BEFORE | INSERT | `assign_team_owner_user_id` |  |
| restaurant_team_members | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_team_members | ensure_user_id_restaurant_team_members | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_team_members | trg_log_team_member_change | AFTER | UPDATE | `log_team_member_change` | Sí |
| restaurant_team_members | update_restaurant_team_members_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| shift_swap_requests | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| shift_swap_requests | ensure_user_id_shift_swap_requests | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| shift_templates | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| shift_templates | ensure_user_id_shift_templates | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_availability | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_availability | ensure_user_id_staff_availability | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_benefit_assignments | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_benefit_assignments | ensure_user_id_staff_benefit_assignments | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_benefit_assignments | update_staff_benefit_assignments_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| staff_benefits | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_benefits | ensure_user_id_staff_benefits | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_certifications | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_certifications | ensure_user_id_staff_certifications | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_members | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_members | ensure_user_id_staff_members | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_members | update_staff_members_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| staff_shifts | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_shifts | ensure_user_id_staff_shifts | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_shifts | update_staff_shifts_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| staff_training_progress | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_training_progress | ensure_user_id_staff_training_progress | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| staff_training_progress | update_staff_training_progress_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| team_permissions_history | ensure_user_id_team_permissions_history | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| user_roles | ensure_user_id_user_roles | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |

## Sitio, menú y reservas

| Tabla | Trigger | Momento | Evento | Función | SECURITY DEFINER |
| --- | --- | --- | --- | --- | --- |
| brand_menus | update_brand_menus_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| chain_master_menus | update_chain_master_menus_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| delivery_zones | ensure_user_id_delivery_zones | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| delivery_zones | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| menu_categories | update_menu_categories_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| menu_items | update_menu_items_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| rappi_menu_sync | ensure_user_id_rappi_menu_sync | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| rappi_menu_sync | update_rappi_menu_sync_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| restaurant_menus | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_menus | ensure_user_id_restaurant_menus | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_menus | update_restaurant_menus_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| restaurant_websites | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_websites | ensure_user_id_restaurant_websites | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_websites | update_restaurant_websites_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |

## Rappi y agregadores

| Tabla | Trigger | Momento | Evento | Función | SECURITY DEFINER |
| --- | --- | --- | --- | --- | --- |
| aggregator_integrations | ensure_user_id_aggregator_integrations | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| aggregator_integrations | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| aggregator_integrations | update_aggregator_integrations_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| rappi_store_status | ensure_user_id_rappi_store_status | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |

## Auditoría y registros

| Tabla | Trigger | Momento | Evento | Función | SECURITY DEFINER |
| --- | --- | --- | --- | --- | --- |
| copilot_alerts | ensure_user_id_copilot_alerts | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| copilot_alerts | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| debug_events | ensure_user_id_debug_events | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| debug_events | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| food_waste_logs | ensure_user_id_food_waste_logs | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| food_waste_logs | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| notification_preferences | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| notification_preferences | ensure_user_id_notification_preferences | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| notification_preferences | update_notification_preferences_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| notifications_log | ensure_user_id_notifications_log | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |

## IA y conocimiento

| Tabla | Trigger | Momento | Evento | Función | SECURITY DEFINER |
| --- | --- | --- | --- | --- | --- |
| copilot_conversations | ensure_user_id_copilot_conversations | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| copilot_conversations | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| knowledge_chunks | ensure_user_id_knowledge_chunks | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| knowledge_sources | ensure_user_id_knowledge_sources | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| knowledge_sources | trg_knowledge_sources_updated | BEFORE | UPDATE | `update_updated_at_column` |  |

## Otros

| Tabla | Trigger | Momento | Evento | Función | SECURITY DEFINER |
| --- | --- | --- | --- | --- | --- |
| applicant_profiles | ensure_user_id_applicant_profiles | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| applicant_profiles | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| applicant_profiles | update_applicant_profiles_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| benefit_requests | ensure_user_id_benefit_requests | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| benefit_requests | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| business_opening_projects | ensure_user_id_business_opening_projects | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| business_opening_projects | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| business_opening_projects | update_business_opening_projects_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| candidate_profiles | calculate_candidate_completeness | BEFORE | INSERT / UPDATE | `calculate_profile_completeness` |  |
| candidate_profiles | ensure_user_id_candidate_profiles | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| candidate_profiles | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| candidate_profiles | update_candidate_profiles_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| carbon_footprint_items | ensure_user_id_carbon_footprint_items | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| carbon_footprint_items | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| carbon_footprint_items | update_carbon_footprint_items_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| chain_locations | update_chain_locations_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| compliance_checklists | update_compliance_checklists_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| consultant_clients | update_consultant_clients_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| consultant_profiles | ensure_user_id_consultant_profiles | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| consultant_profiles | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| consultant_profiles | update_consultant_profiles_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| course_certificates | ensure_user_id_course_certificates | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| course_enrollments | ensure_user_id_course_enrollments | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| course_enrollments | update_course_enrollments_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| course_lessons | trg_update_course_lesson_stats | AFTER | INSERT / DELETE / UPDATE | `update_course_lesson_stats` | Sí |
| daily_briefings | ensure_user_id_daily_briefings | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| daily_briefings | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| daily_sales | ensure_user_id_daily_sales | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| daily_sales | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| daily_sales | update_daily_sales_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| event_quotations | set_quotation_slug | BEFORE | INSERT | `generate_quotation_slug` |  |
| event_quotations | update_event_quotations_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| events | update_events_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| job_applications | increment_job_apps_on_insert | AFTER | INSERT | `increment_job_applications` | Sí |
| job_applications | update_job_applications_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| job_saved | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| job_saved | ensure_user_id_job_saved | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| jobs | update_jobs_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| learning_track_courses | trg_update_track_course_count | AFTER | INSERT / DELETE / UPDATE | `update_track_course_count` | Sí |
| lesson_progress | ensure_user_id_lesson_progress | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| lesson_progress | trg_check_course_completion | AFTER | INSERT / UPDATE | `check_course_completion_certificate` | Sí |
| maturity_action_tracking | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| maturity_action_tracking | ensure_user_id_maturity_action_tracking | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| maturity_action_tracking | update_maturity_action_tracking_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| maturity_diagnoses | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| maturity_diagnoses | ensure_user_id_maturity_diagnoses | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| maturity_diagnoses | update_maturity_diagnoses_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| opening_analysis_runs | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| opening_analysis_runs | ensure_user_id_opening_analysis_runs | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| opening_analysis_runs | update_opening_analysis_runs_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| payment_gateway_credentials | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| payment_gateway_credentials | ensure_user_id_payment_gateway_credentials | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| payment_gateway_credentials | update_payment_gateway_credentials_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| payment_webhook_events | ensure_user_id_payment_webhook_events | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| pre_opening_tasks | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| pre_opening_tasks | ensure_user_id_pre_opening_tasks | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| pre_opening_tasks | update_pre_opening_tasks_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| profiles | ensure_user_id_profiles | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| profiles | update_profiles_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| push_subscriptions | ensure_user_id_push_subscriptions | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_brands | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_brands | ensure_user_id_restaurant_brands | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| restaurant_brands | update_restaurant_brands_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| restaurant_businesses | update_restaurant_businesses_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| restaurant_chains | update_restaurant_chains_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| restaurant_zones | update_restaurant_zones_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| sales_goals | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| sales_goals | ensure_user_id_sales_goals | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| sales_goals | update_sales_goals_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| sales_projections | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| sales_projections | ensure_user_id_sales_projections | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| sentiment_reports | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| sentiment_reports | ensure_user_id_sentiment_reports | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| service_bookings | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| service_bookings | ensure_user_id_service_bookings | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| service_bookings | update_service_bookings_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| service_proposals | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| service_proposals | ensure_user_id_service_proposals | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| service_proposals | trg_update_proposals_count | AFTER | INSERT / DELETE | `update_request_proposals_count` | Sí |
| service_providers | update_service_providers_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| service_requests | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| service_requests | ensure_user_id_service_requests | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| service_requests | update_service_requests_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| social_mentions | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| social_mentions | ensure_user_id_social_mentions | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| storage_locations | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| storage_locations | ensure_user_id_storage_locations | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| support_templates | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| support_templates | ensure_user_id_support_templates | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| support_tickets | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| support_tickets | ensure_user_id_support_tickets | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| support_tickets | update_support_tickets_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| sustainability_goals | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| sustainability_goals | ensure_user_id_sustainability_goals | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| sustainability_goals | update_sustainability_goals_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| sustainability_reports | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| sustainability_reports | ensure_user_id_sustainability_reports | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| time_off_requests | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| time_off_requests | ensure_user_id_time_off_requests | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| training_courses | update_training_courses_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| training_programs | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| training_programs | ensure_user_id_training_programs | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| unit_conversions | update_unit_conversions_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| venue_bookings | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| venue_bookings | ensure_user_id_venue_bookings | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| venue_bookings | update_venue_bookings_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| venues | update_venues_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |
| virtual_brands | ensure_user_id_for_rls | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| virtual_brands | ensure_user_id_virtual_brands | BEFORE | INSERT / UPDATE | `ensure_user_id_for_rls` |  |
| virtual_brands | update_virtual_brands_updated_at | BEFORE | UPDATE | `update_updated_at_column` |  |

## Funciones invocables (RPC)

Funciones que no son de trigger, por dominio.

- **POS y caja:** `_demo_expected_orders`, `_demo_generate_orders` (SD), `close_tip_period` (SD), `compute_tip_period` (SD), `deduct_inventory_for_order` (SD), `finance_cash_flow_projection` (SD), `pos_close_session` (SD), `pos_log_audit` (SD), `pos_pin_guard` (SD), `pos_pin_record` (SD), `pos_verify_supervisor_pin` (SD), `process_order_inventory_deduction` (SD), `reverse_order_inventory_deduction` (SD)
- **Inventario y recetas:** `menu_out_of_stock_ids` (SD), `recalculate_recipe_cost` (SD)
- **Finanzas:** `_demo_seed_finance` (SD), `finance_materialize_recurring` (SD), `finance_pay_group`, `finance_reconciliation` (SD)
- **Fidelización y feedback:** `award_loyalty_points` (SD), `increment_campaign_responses` (SD), `public_feedback_after_submit` (SD), `public_loyalty_enroll` (SD), `public_loyalty_find` (SD), `public_loyalty_profile` (SD), `public_loyalty_redeem` (SD), `recompute_loyalty_customer_for` (SD), `redeem_loyalty_reward` (SD)
- **Equipo y permisos:** `claim_team_invitation` (SD), `get_default_permissions_for_role`, `has_module_access` (SD), `has_role` (SD), `has_team_role` (SD), `is_team_admin` (SD), `is_team_lead` (SD), `seed_system_roles_for_business` (SD), `set_staff_pin` (SD), `shift_net_hours`, `team_can` (SD), `team_member_owner_id` (SD), `team_owner_ids` (SD), `verify_staff_pin` (SD)
- **Sitio, menú y reservas:** `calculate_menu_item_scores` (SD), `generate_menu_slug` (SD), `marketing_menu_opportunities` (SD), `public_create_reservation` (SD)
- **Rappi y agregadores:** `get_aggregated_daily_sales` (SD)
- **Demo:** `_demo_refresh_daily_close` (SD), `_demo_seed_marketing` (SD), `_demo_upsert_auth_user` (SD), `demo_owner_id`, `demo_tick` (SD), `is_demo_user`, `seed_demo_extras` (SD), `seed_demo_restaurant` (SD)
- **Auditoría y registros:** `log_consultant_impersonation_end` (SD), `log_consultant_impersonation_start` (SD)
- **IA y conocimiento:** `ai_usage_bump` (SD), `match_knowledge` (SD)
- **Otros:** `_mask_email`, `_mask_phone`, `_pos_request_ip`, `business_day_of` (SD), `claim_consultant_client` (SD), `convert_unit` (SD), `generate_redemption_code`, `generate_schedule_proposal` (SD), `get_customer_profile` (SD), `get_platform_stats` (SD), `get_user_business_id` (SD), `increment_job_views` (SD), `is_business_owner` (SD), `is_consultant_of` (SD), `payment_gateway_private_key` (SD), `seed_platform_admin` (SD), `validate_pos_discount` (SD)
