-- Add restaurant_name to loyalty_customers for caching/display purposes
ALTER TABLE public.loyalty_customers 
ADD COLUMN IF NOT EXISTS restaurant_name text;

-- Create an index for faster lookups by email and phone
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_email ON public.loyalty_customers(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_phone ON public.loyalty_customers(customer_phone) WHERE customer_phone IS NOT NULL;

-- Create a function to sync restaurant name from profiles
CREATE OR REPLACE FUNCTION public.sync_restaurant_name_to_loyalty_customer()
RETURNS TRIGGER AS $$
BEGIN
  -- When a loyalty customer is created or updated, sync the restaurant name
  NEW.restaurant_name := (
    SELECT COALESCE(p.restaurant_name, 'Restaurante')
    FROM profiles p
    WHERE p.id = NEW.user_id
    LIMIT 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-sync restaurant name
DROP TRIGGER IF EXISTS sync_loyalty_customer_restaurant_name ON public.loyalty_customers;
CREATE TRIGGER sync_loyalty_customer_restaurant_name
BEFORE INSERT OR UPDATE OF user_id ON public.loyalty_customers
FOR EACH ROW
EXECUTE FUNCTION public.sync_restaurant_name_to_loyalty_customer();

-- Update existing records with restaurant names
UPDATE public.loyalty_customers lc
SET restaurant_name = (
  SELECT COALESCE(p.restaurant_name, 'Restaurante')
  FROM profiles p
  WHERE p.id = lc.user_id
)
WHERE lc.restaurant_name IS NULL;