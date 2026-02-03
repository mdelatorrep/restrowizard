-- Fix security issues: Set search_path on functions and fix views

-- Drop existing views and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.inventory_expiring_soon;
DROP VIEW IF EXISTS public.inventory_below_par;

-- Recreate views with explicit SECURITY INVOKER
CREATE VIEW public.inventory_expiring_soon
WITH (security_invoker = true) AS
SELECT 
  i.id,
  i.user_id,
  i.item_name,
  i.current_stock,
  i.unit,
  i.expiration_date,
  i.lot_number,
  sl.location_name as storage_location,
  CASE 
    WHEN i.expiration_date <= CURRENT_DATE THEN 'expired'
    WHEN i.expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'critical'
    WHEN i.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'warning'
    ELSE 'ok'
  END as expiration_status,
  i.expiration_date - CURRENT_DATE as days_until_expiry
FROM public.inventory_items i
LEFT JOIN public.storage_locations sl ON sl.id = i.storage_location_id
WHERE i.expiration_date IS NOT NULL
  AND i.current_stock > 0
ORDER BY i.expiration_date ASC;

CREATE VIEW public.inventory_below_par
WITH (security_invoker = true) AS
SELECT 
  i.id,
  i.user_id,
  i.item_name,
  i.current_stock,
  i.par_level,
  i.reorder_point,
  i.unit,
  i.unit_cost,
  (i.par_level - i.current_stock) as quantity_to_order,
  ((i.par_level - i.current_stock) * COALESCE(i.unit_cost, 0)) as estimated_order_cost,
  s.supplier_name as preferred_supplier,
  i.lead_time_days
FROM public.inventory_items i
LEFT JOIN public.inventory_suppliers s ON s.id = i.preferred_supplier_id
WHERE i.current_stock < i.par_level
  AND i.par_level > 0
ORDER BY (i.par_level - i.current_stock) DESC;

-- Fix functions with proper search_path
DROP TRIGGER IF EXISTS trigger_generate_po_number ON public.purchase_orders;
DROP FUNCTION IF EXISTS public.generate_po_number();

CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_po_number
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_po_number();

-- Fix price change function
DROP TRIGGER IF EXISTS trigger_record_price_change ON public.inventory_items;
DROP FUNCTION IF EXISTS public.record_price_change();

CREATE OR REPLACE FUNCTION public.record_price_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.unit_cost IS DISTINCT FROM NEW.unit_cost THEN
    INSERT INTO public.inventory_price_history (
      inventory_item_id, 
      old_price, 
      new_price, 
      change_percentage
    )
    VALUES (
      NEW.id,
      OLD.unit_cost,
      NEW.unit_cost,
      CASE WHEN OLD.unit_cost > 0 
        THEN ROUND(((NEW.unit_cost - OLD.unit_cost) / OLD.unit_cost * 100)::NUMERIC, 2)
        ELSE NULL
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_record_price_change
  AFTER UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.record_price_change();

-- Fix inventory movement function
DROP TRIGGER IF EXISTS trigger_record_inventory_movement ON public.inventory_items;
DROP FUNCTION IF EXISTS public.record_inventory_movement();

CREATE OR REPLACE FUNCTION public.record_inventory_movement()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.current_stock IS DISTINCT FROM NEW.current_stock THEN
    INSERT INTO public.inventory_movements (
      user_id,
      inventory_item_id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      unit_cost,
      total_cost
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      'adjustment',
      NEW.current_stock - OLD.current_stock,
      OLD.current_stock,
      NEW.current_stock,
      NEW.unit_cost,
      (NEW.current_stock - OLD.current_stock) * COALESCE(NEW.unit_cost, 0)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_record_inventory_movement
  AFTER UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.record_inventory_movement();