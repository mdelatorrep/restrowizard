-- Allow public read access for achievements
CREATE POLICY "Public can read active achievements"
  ON public.loyalty_achievements
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read customer achievements"
  ON public.loyalty_customer_achievements
  FOR SELECT
  USING (true);