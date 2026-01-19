-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.table_reservations;

-- Create a more secure policy that requires a valid user_id reference
-- The user_id must match an existing restaurant owner in the system
CREATE POLICY "Public can create reservations for valid restaurants" 
ON public.table_reservations FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurant_websites 
    WHERE restaurant_websites.user_id = table_reservations.user_id 
    AND restaurant_websites.is_published = true 
    AND restaurant_websites.show_reservations = true
  )
);