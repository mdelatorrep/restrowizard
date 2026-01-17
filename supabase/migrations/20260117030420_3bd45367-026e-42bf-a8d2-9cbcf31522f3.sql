-- Add loyalty_code column to loyalty_customers
ALTER TABLE public.loyalty_customers 
ADD COLUMN IF NOT EXISTS loyalty_code TEXT UNIQUE;

-- Generate loyalty codes for existing customers
UPDATE public.loyalty_customers 
SET loyalty_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE loyalty_code IS NULL;

-- Make loyalty_code NOT NULL and add default for new rows
ALTER TABLE public.loyalty_customers 
ALTER COLUMN loyalty_code SET DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

-- Create function to auto-generate loyalty code on insert
CREATE OR REPLACE FUNCTION public.generate_loyalty_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.loyalty_code IS NULL THEN
    NEW.loyalty_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating loyalty code
DROP TRIGGER IF EXISTS trigger_generate_loyalty_code ON public.loyalty_customers;
CREATE TRIGGER trigger_generate_loyalty_code
  BEFORE INSERT ON public.loyalty_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_loyalty_code();

-- Allow public read access for the public loyalty page
CREATE POLICY "Public can read loyalty customers by code"
  ON public.loyalty_customers
  FOR SELECT
  USING (true);

CREATE POLICY "Public can read loyalty tiers"
  ON public.loyalty_tiers
  FOR SELECT
  USING (true);

CREATE POLICY "Public can read loyalty transactions by customer"
  ON public.loyalty_points_transactions
  FOR SELECT
  USING (true);

CREATE POLICY "Public can read active rewards catalog"
  ON public.loyalty_rewards_catalog
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read loyalty rewards"
  ON public.loyalty_rewards
  FOR SELECT
  USING (true);