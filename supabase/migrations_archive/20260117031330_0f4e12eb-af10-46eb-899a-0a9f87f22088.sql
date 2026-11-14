-- Allow public to insert loyalty rewards (for redemption)
CREATE POLICY "Public can redeem rewards"
  ON public.loyalty_rewards
  FOR INSERT
  WITH CHECK (true);

-- Allow public to insert points transactions (for redemption tracking)
CREATE POLICY "Public can create redemption transactions"
  ON public.loyalty_points_transactions
  FOR INSERT
  WITH CHECK (transaction_type = 'redeem');

-- Allow public to update customer points (for redemption)
CREATE POLICY "Public can update customer points"
  ON public.loyalty_customers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);