-- Fix security warnings: Set search_path for all functions

-- Fix get_aggregated_daily_sales
CREATE OR REPLACE FUNCTION public.get_aggregated_daily_sales(
  p_user_id UUID,
  p_date DATE
) RETURNS TABLE (
  total_revenue NUMERIC,
  order_count INTEGER,
  covers_count INTEGER,
  food_cost NUMERIC,
  labor_cost NUMERIC,
  avg_ticket NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ro.total), 0)::NUMERIC as total_revenue,
    COUNT(ro.id)::INTEGER as order_count,
    COALESCE(SUM(ro.guests_count), 0)::INTEGER as covers_count,
    (SELECT COALESCE(SUM(id.quantity_deducted * COALESCE(ii.unit_cost, 0)), 0)
     FROM inventory_deductions id
     JOIN inventory_items ii ON ii.id = id.inventory_item_id
     WHERE id.user_id = p_user_id 
     AND DATE(id.deducted_at) = p_date)::NUMERIC as food_cost,
    (SELECT COALESCE(SUM(
       EXTRACT(EPOCH FROM (COALESCE(ss.actual_end_time, ss.end_time)::TIME - COALESCE(ss.actual_start_time, ss.start_time)::TIME)) / 3600 
       * COALESCE(ss.hourly_rate_override, sm.hourly_rate, 0)
     ), 0)
     FROM staff_shifts ss
     LEFT JOIN staff_members sm ON sm.id = ss.staff_member_id
     WHERE ss.user_id = p_user_id 
     AND ss.shift_date = p_date
     AND ss.status = 'completed')::NUMERIC as labor_cost,
    CASE WHEN COUNT(ro.id) > 0 THEN (SUM(ro.total) / COUNT(ro.id))::NUMERIC ELSE 0 END as avg_ticket
  FROM restaurant_orders ro
  WHERE ro.user_id = p_user_id
  AND DATE(ro.created_at) = p_date
  AND ro.status NOT IN ('cancelled', 'pending');
END;
$$;

-- Fix calculate_menu_item_scores
CREATE OR REPLACE FUNCTION public.calculate_menu_item_scores(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_items_sold INTEGER;
  item_record RECORD;
BEGIN
  SELECT COUNT(*) INTO v_total_items_sold
  FROM restaurant_orders ro,
       jsonb_array_elements(ro.items::jsonb) AS item
  WHERE ro.user_id = p_user_id
  AND ro.created_at >= NOW() - (p_days || ' days')::INTERVAL
  AND ro.status NOT IN ('cancelled', 'pending');
  
  IF v_total_items_sold = 0 THEN
    RETURN;
  END IF;
  
  FOR item_record IN 
    SELECT DISTINCT mi.id as menu_item_id, mi.price
    FROM menu_items mi
    JOIN restaurant_menus rm ON rm.id = mi.menu_id
    WHERE rm.user_id = p_user_id
  LOOP
    DECLARE
      v_item_sold INTEGER;
      v_recipe_cost NUMERIC;
      v_popularity NUMERIC;
      v_profitability NUMERIC;
      v_category VARCHAR(20);
    BEGIN
      SELECT COUNT(*) INTO v_item_sold
      FROM restaurant_orders ro,
           jsonb_array_elements(ro.items::jsonb) AS item
      WHERE ro.user_id = p_user_id
      AND (item->>'menu_item_id')::UUID = item_record.menu_item_id
      AND ro.created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND ro.status NOT IN ('cancelled', 'pending');
      
      SELECT COALESCE(r.cost_per_portion, 0) INTO v_recipe_cost
      FROM recipes r
      WHERE r.menu_item_id = item_record.menu_item_id
      LIMIT 1;
      
      v_popularity := (v_item_sold::NUMERIC / v_total_items_sold) * 100;
      v_profitability := CASE WHEN item_record.price > 0 
        THEN ((item_record.price - COALESCE(v_recipe_cost, 0)) / item_record.price) * 100 
        ELSE 0 
      END;
      
      v_category := CASE
        WHEN v_popularity >= 50 AND v_profitability >= 50 THEN 'star'
        WHEN v_popularity < 50 AND v_profitability >= 50 THEN 'cash_cow'
        WHEN v_popularity >= 50 AND v_profitability < 50 THEN 'question_mark'
        ELSE 'dog'
      END;
      
      UPDATE menu_items SET
        popularity_score = v_popularity,
        profitability_score = v_profitability,
        bcg_category = v_category
      WHERE id = item_record.menu_item_id;
    END;
  END LOOP;
END;
$$;

-- Fix get_customer_profile
CREATE OR REPLACE FUNCTION public.get_customer_profile(p_email TEXT, p_user_id UUID)
RETURNS TABLE (
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  total_orders INTEGER,
  total_spent NUMERIC,
  avg_ticket NUMERIC,
  last_visit TIMESTAMPTZ,
  loyalty_points INTEGER,
  loyalty_tier TEXT,
  total_reservations INTEGER,
  avg_rating NUMERIC,
  feedback_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(lc.customer_name, ro.customer_name, cf.customer_name) as customer_name,
    p_email as customer_email,
    COALESCE(lc.phone, ro.customer_phone, cf.customer_phone) as customer_phone,
    (SELECT COUNT(*) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as total_orders,
    COALESCE((SELECT SUM(total) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email AND status NOT IN ('cancelled')), 0)::NUMERIC as total_spent,
    COALESCE((SELECT AVG(total) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email AND status NOT IN ('cancelled')), 0)::NUMERIC as avg_ticket,
    (SELECT MAX(created_at) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email) as last_visit,
    COALESCE(lc.points_balance, 0)::INTEGER as loyalty_points,
    COALESCE(lc.tier, 'none') as loyalty_tier,
    (SELECT COUNT(*) FROM table_reservations WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as total_reservations,
    COALESCE((SELECT AVG(rating) FROM customer_feedback WHERE user_id = p_user_id AND customer_email = p_email), 0)::NUMERIC as avg_rating,
    (SELECT COUNT(*) FROM customer_feedback WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as feedback_count
  FROM (SELECT 1) as dummy
  LEFT JOIN loyalty_customers lc ON lc.user_id = p_user_id AND lc.email = p_email
  LEFT JOIN LATERAL (
    SELECT ro2.customer_name, ro2.customer_phone FROM restaurant_orders ro2
    WHERE ro2.user_id = p_user_id AND ro2.customer_email = p_email 
    ORDER BY ro2.created_at DESC LIMIT 1
  ) ro ON true
  LEFT JOIN LATERAL (
    SELECT cf2.customer_name, cf2.customer_phone FROM customer_feedback cf2
    WHERE cf2.user_id = p_user_id AND cf2.customer_email = p_email 
    ORDER BY cf2.created_at DESC LIMIT 1
  ) cf ON true;
END;
$$;

-- Fix trigger function
CREATE OR REPLACE FUNCTION public.trigger_update_menu_scores_on_order() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('completed', 'delivered') AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'delivered')) THEN
    PERFORM calculate_menu_item_scores(NEW.user_id, 30);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and recreate view without SECURITY DEFINER (use SECURITY INVOKER instead)
DROP VIEW IF EXISTS public.menu_items_with_costs;
CREATE VIEW public.menu_items_with_costs 
WITH (security_invoker = true)
AS
SELECT 
  mi.id,
  mi.menu_id,
  mi.name,
  mi.description,
  mi.category,
  mi.price,
  mi.image_url,
  mi.is_available,
  mi.is_featured,
  mi.allergens,
  mi.dietary_tags,
  mi.popularity_score,
  mi.profitability_score,
  mi.bcg_category,
  r.id as recipe_id,
  r.name as recipe_name,
  COALESCE(r.cost_per_portion, 0) as recipe_cost,
  CASE WHEN mi.price > 0 
    THEN ((mi.price - COALESCE(r.cost_per_portion, 0)) / mi.price) * 100 
    ELSE 0 
  END as margin_percent
FROM public.menu_items mi
LEFT JOIN public.recipes r ON r.menu_item_id = mi.id;