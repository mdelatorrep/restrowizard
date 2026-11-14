-- TK-1: Add unified sales_channel dimension to restaurant_orders
ALTER TABLE public.restaurant_orders
  ADD COLUMN IF NOT EXISTS sales_channel TEXT
  CHECK (sales_channel IN ('dine_in','pos','delivery_own','rappi','takeout','other'));

-- Backfill from existing source / order_type
UPDATE public.restaurant_orders
SET sales_channel = CASE
  WHEN source = 'rappi' OR source ILIKE '%rappi%' THEN 'rappi'
  WHEN order_type = 'delivery' THEN 'delivery_own'
  WHEN order_type = 'takeout' OR order_type = 'pickup' THEN 'takeout'
  WHEN is_pos_order = true OR source = 'in_store' THEN 'pos'
  WHEN order_type = 'dine_in' THEN 'dine_in'
  ELSE 'other'
END
WHERE sales_channel IS NULL;

ALTER TABLE public.restaurant_orders
  ALTER COLUMN sales_channel SET DEFAULT 'pos';

CREATE INDEX IF NOT EXISTS idx_restaurant_orders_user_channel
  ON public.restaurant_orders(user_id, sales_channel, created_at DESC);