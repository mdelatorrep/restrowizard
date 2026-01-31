-- Fix get_customer_profile function to use correct column names
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
    COALESCE(lc.customer_name, ro.customer_name, cf.customer_name)::TEXT as customer_name,
    p_email::TEXT as customer_email,
    COALESCE(lc.customer_phone, ro.customer_phone, cf.customer_phone)::TEXT as customer_phone,
    (SELECT COUNT(*) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as total_orders,
    COALESCE((SELECT SUM(total) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email AND status NOT IN ('cancelled')), 0)::NUMERIC as total_spent,
    COALESCE((SELECT AVG(total) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email AND status NOT IN ('cancelled')), 0)::NUMERIC as avg_ticket,
    (SELECT MAX(created_at) FROM restaurant_orders WHERE user_id = p_user_id AND customer_email = p_email)::TIMESTAMPTZ as last_visit,
    COALESCE(lc.current_points, 0)::INTEGER as loyalty_points,
    COALESCE(lt.name, 'none')::TEXT as loyalty_tier,
    (SELECT COUNT(*) FROM table_reservations WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as total_reservations,
    COALESCE((SELECT AVG(rating) FROM customer_feedback WHERE user_id = p_user_id AND customer_email = p_email), 0)::NUMERIC as avg_rating,
    (SELECT COUNT(*) FROM customer_feedback WHERE user_id = p_user_id AND customer_email = p_email)::INTEGER as feedback_count
  FROM (SELECT 1) as dummy
  LEFT JOIN loyalty_customers lc ON lc.user_id = p_user_id AND lc.customer_email = p_email
  LEFT JOIN loyalty_tiers lt ON lt.id = lc.tier_id
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