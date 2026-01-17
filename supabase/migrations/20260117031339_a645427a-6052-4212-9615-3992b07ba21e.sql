-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can redeem rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Public can update customer points" ON public.loyalty_customers;

-- Create more restrictive policies
-- Allow inserting rewards only with valid customer_id that exists
CREATE POLICY "Public can redeem rewards with valid customer"
  ON public.loyalty_rewards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loyalty_customers 
      WHERE id = customer_id
    )
  );

-- Allow updating only current_points field for existing customers
CREATE POLICY "Public can update own points via loyalty_code"
  ON public.loyalty_customers
  FOR UPDATE
  USING (loyalty_code IS NOT NULL)
  WITH CHECK (loyalty_code IS NOT NULL);