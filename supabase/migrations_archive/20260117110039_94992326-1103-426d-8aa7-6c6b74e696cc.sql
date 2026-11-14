-- Add opening_date column to restaurant_businesses for lifecycle tracking
ALTER TABLE public.restaurant_businesses 
ADD COLUMN IF NOT EXISTS opening_date DATE;

-- Add business_name as alias or rename if needed
-- The table already has 'name' column, so we'll use that
COMMENT ON COLUMN public.restaurant_businesses.opening_date IS 'The official opening date of the restaurant, used for lifecycle stage tracking';