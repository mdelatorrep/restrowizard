-- Corregir función get_default_permissions_for_role agregando search_path
CREATE OR REPLACE FUNCTION public.get_default_permissions_for_role(p_role public.team_member_role)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_role
    WHEN 'owner' THEN '{
      "dashboard": "admin", "finances": "admin", "inventory": "admin", 
      "recipes": "admin", "menus": "admin", "pos": "admin", "orders": "admin",
      "delivery": "admin", "reservations": "admin", "talent": "admin",
      "feedback": "admin", "loyalty": "admin", "website": "admin",
      "brand": "admin", "settings": "admin", "team": "admin"
    }'::jsonb
    WHEN 'admin' THEN '{
      "dashboard": "admin", "finances": "admin", "inventory": "admin", 
      "recipes": "admin", "menus": "admin", "pos": "admin", "orders": "admin",
      "delivery": "admin", "reservations": "admin", "talent": "admin",
      "feedback": "admin", "loyalty": "admin", "website": "admin",
      "brand": "admin", "settings": "write", "team": "write"
    }'::jsonb
    WHEN 'manager' THEN '{
      "dashboard": "read", "finances": "read", "inventory": "write", 
      "recipes": "read", "menus": "read", "pos": "write", "orders": "write",
      "delivery": "write", "reservations": "write", "talent": "write",
      "feedback": "read", "loyalty": "read", "website": "none",
      "brand": "none", "settings": "none", "team": "read"
    }'::jsonb
    WHEN 'cashier' THEN '{
      "dashboard": "read", "finances": "none", "inventory": "read", 
      "recipes": "none", "menus": "read", "pos": "write", "orders": "write",
      "delivery": "read", "reservations": "read", "talent": "none",
      "feedback": "none", "loyalty": "read", "website": "none",
      "brand": "none", "settings": "none", "team": "none"
    }'::jsonb
    WHEN 'kitchen' THEN '{
      "dashboard": "read", "finances": "none", "inventory": "read", 
      "recipes": "read", "menus": "read", "pos": "none", "orders": "write",
      "delivery": "none", "reservations": "none", "talent": "none",
      "feedback": "none", "loyalty": "none", "website": "none",
      "brand": "none", "settings": "none", "team": "none"
    }'::jsonb
    WHEN 'staff' THEN '{
      "dashboard": "read", "finances": "none", "inventory": "none", 
      "recipes": "none", "menus": "none", "pos": "none", "orders": "none",
      "delivery": "none", "reservations": "none", "talent": "read",
      "feedback": "none", "loyalty": "none", "website": "none",
      "brand": "none", "settings": "none", "team": "none"
    }'::jsonb
    ELSE '{}'::jsonb
  END
$$;