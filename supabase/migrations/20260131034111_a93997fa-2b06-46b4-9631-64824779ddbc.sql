-- ============================================
-- PHASE 1: Staff Shifts Table for Labor Cost
-- ============================================
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  staff_member_id UUID REFERENCES public.staff_members(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  hourly_rate_override NUMERIC(10,2),
  actual_start_time TIME,
  actual_end_time TIME,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for staff_shifts
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own staff shifts" 
ON public.staff_shifts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own staff shifts" 
ON public.staff_shifts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own staff shifts" 
ON public.staff_shifts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own staff shifts" 
ON public.staff_shifts FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_staff_shifts_user_date ON public.staff_shifts(user_id, shift_date);
CREATE INDEX idx_staff_shifts_staff_member ON public.staff_shifts(staff_member_id);

-- ============================================
-- PHASE 2: Add order_id to customer_feedback
-- ============================================
ALTER TABLE public.customer_feedback 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.restaurant_orders(id);

-- ============================================
-- PHASE 3: Add loyalty_customer_id to reservations
-- ============================================
ALTER TABLE public.table_reservations
ADD COLUMN IF NOT EXISTS loyalty_customer_id UUID REFERENCES public.loyalty_customers(id);

-- ============================================
-- PHASE 4: Add popularity and profitability scores to menu_items
-- ============================================
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS popularity_score NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profitability_score NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bcg_category VARCHAR(20) DEFAULT 'unknown';

-- ============================================
-- PHASE 5: View for menu items with recipe costs
-- ============================================
CREATE OR REPLACE VIEW public.menu_items_with_costs AS
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

-- ============================================
-- PHASE 6: Function to get aggregated daily sales
-- ============================================
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ro.total), 0)::NUMERIC as total_revenue,
    COUNT(ro.id)::INTEGER as order_count,
    COALESCE(SUM(ro.guests_count), 0)::INTEGER as covers_count,
    -- Food cost from inventory deductions
    (SELECT COALESCE(SUM(id.quantity_deducted * COALESCE(ii.unit_cost, 0)), 0)
     FROM public.inventory_deductions id
     JOIN public.inventory_items ii ON ii.id = id.inventory_item_id
     WHERE id.user_id = p_user_id 
     AND DATE(id.deducted_at) = p_date)::NUMERIC as food_cost,
    -- Labor cost from shifts
    (SELECT COALESCE(SUM(
       EXTRACT(EPOCH FROM (COALESCE(ss.actual_end_time, ss.end_time)::TIME - COALESCE(ss.actual_start_time, ss.start_time)::TIME)) / 3600 
       * COALESCE(ss.hourly_rate_override, sm.hourly_rate, 0)
     ), 0)
     FROM public.staff_shifts ss
     LEFT JOIN public.staff_members sm ON sm.id = ss.staff_member_id
     WHERE ss.user_id = p_user_id 
     AND ss.shift_date = p_date
     AND ss.status = 'completed')::NUMERIC as labor_cost,
    CASE WHEN COUNT(ro.id) > 0 THEN (SUM(ro.total) / COUNT(ro.id))::NUMERIC ELSE 0 END as avg_ticket
  FROM public.restaurant_orders ro
  WHERE ro.user_id = p_user_id
  AND DATE(ro.created_at) = p_date
  AND ro.status NOT IN ('cancelled', 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHASE 7: Function to calculate menu item scores
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_menu_item_scores(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS void AS $$
DECLARE
  v_total_items_sold INTEGER;
  v_avg_margin NUMERIC;
  v_avg_popularity NUMERIC;
  item_record RECORD;
BEGIN
  -- Get total items sold in period
  SELECT COUNT(*) INTO v_total_items_sold
  FROM public.restaurant_orders ro,
       jsonb_array_elements(ro.items::jsonb) AS item
  WHERE ro.user_id = p_user_id
  AND ro.created_at >= NOW() - (p_days || ' days')::INTERVAL
  AND ro.status NOT IN ('cancelled', 'pending');
  
  -- Skip if no sales
  IF v_total_items_sold = 0 THEN
    RETURN;
  END IF;
  
  -- Get menu IDs for this user
  FOR item_record IN 
    SELECT DISTINCT mi.id as menu_item_id, mi.price
    FROM public.menu_items mi
    JOIN public.restaurant_menus rm ON rm.id = mi.menu_id
    WHERE rm.user_id = p_user_id
  LOOP
    DECLARE
      v_item_sold INTEGER;
      v_recipe_cost NUMERIC;
      v_popularity NUMERIC;
      v_profitability NUMERIC;
      v_category VARCHAR(20);
    BEGIN
      -- Count how many times this item was sold
      SELECT COUNT(*) INTO v_item_sold
      FROM public.restaurant_orders ro,
           jsonb_array_elements(ro.items::jsonb) AS item
      WHERE ro.user_id = p_user_id
      AND (item->>'menu_item_id')::UUID = item_record.menu_item_id
      AND ro.created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND ro.status NOT IN ('cancelled', 'pending');
      
      -- Get recipe cost
      SELECT COALESCE(r.cost_per_portion, 0) INTO v_recipe_cost
      FROM public.recipes r
      WHERE r.menu_item_id = item_record.menu_item_id
      LIMIT 1;
      
      -- Calculate scores
      v_popularity := (v_item_sold::NUMERIC / v_total_items_sold) * 100;
      v_profitability := CASE WHEN item_record.price > 0 
        THEN ((item_record.price - COALESCE(v_recipe_cost, 0)) / item_record.price) * 100 
        ELSE 0 
      END;
      
      -- Determine BCG category (using 50% as threshold)
      v_category := CASE
        WHEN v_popularity >= 50 AND v_profitability >= 50 THEN 'star'
        WHEN v_popularity < 50 AND v_profitability >= 50 THEN 'cash_cow'
        WHEN v_popularity >= 50 AND v_profitability < 50 THEN 'question_mark'
        ELSE 'dog'
      END;
      
      -- Update the menu item
      UPDATE public.menu_items SET
        popularity_score = v_popularity,
        profitability_score = v_profitability,
        bcg_category = v_category
      WHERE id = item_record.menu_item_id;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHASE 8: Function to get customer 360 profile
-- ============================================
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(lc.customer_name, ro.customer_name, cf.customer_name) as customer_name,
    p_email as customer_email,
    COALESCE(lc.phone, ro.customer_phone, cf.customer_phone) as customer_phone,
    (SELECT COUNT(*) FROM public.restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as total_orders,
    COALESCE((SELECT SUM(total) FROM public.restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email AND status NOT IN ('cancelled')), 0)::NUMERIC as total_spent,
    COALESCE((SELECT AVG(total) FROM public.restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email AND status NOT IN ('cancelled')), 0)::NUMERIC as avg_ticket,
    (SELECT MAX(created_at) FROM public.restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email) as last_visit,
    COALESCE(lc.points_balance, 0)::INTEGER as loyalty_points,
    COALESCE(lc.tier, 'none') as loyalty_tier,
    (SELECT COUNT(*) FROM public.table_reservations WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as total_reservations,
    COALESCE((SELECT AVG(rating) FROM public.customer_feedback WHERE user_id = p_user_id AND customer_email = p_email), 0)::NUMERIC as avg_rating,
    (SELECT COUNT(*) FROM public.customer_feedback WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as feedback_count
  FROM (SELECT 1) as dummy
  LEFT JOIN public.loyalty_customers lc ON lc.user_id = p_user_id AND lc.email = p_email
  LEFT JOIN LATERAL (
    SELECT customer_name, customer_phone FROM public.restaurant_orders 
    WHERE user_id = p_user_id AND customer_email = p_email 
    ORDER BY created_at DESC LIMIT 1
  ) ro ON true
  LEFT JOIN LATERAL (
    SELECT customer_name, customer_phone FROM public.customer_feedback 
    WHERE user_id = p_user_id AND customer_email = p_email 
    ORDER BY created_at DESC LIMIT 1
  ) cf ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHASE 9: Trigger to update scores on order completion
-- ============================================
CREATE OR REPLACE FUNCTION public.trigger_update_menu_scores_on_order() 
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when order is completed
  IF NEW.status IN ('completed', 'delivered') AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'delivered')) THEN
    -- Async call to recalculate (runs after transaction commits)
    PERFORM public.calculate_menu_item_scores(NEW.user_id, 30);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_menu_scores_on_order ON public.restaurant_orders;
CREATE TRIGGER trigger_menu_scores_on_order
AFTER INSERT OR UPDATE ON public.restaurant_orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_update_menu_scores_on_order();

-- ============================================
-- PHASE 10: Update timestamp trigger for staff_shifts
-- ============================================
CREATE TRIGGER update_staff_shifts_updated_at
BEFORE UPDATE ON public.staff_shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();