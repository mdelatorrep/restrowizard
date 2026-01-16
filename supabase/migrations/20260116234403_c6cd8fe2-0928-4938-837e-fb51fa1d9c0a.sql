
-- Fix the overly permissive INSERT policy on customer_feedback
-- Drop the old policy and create a more restrictive one
DROP POLICY IF EXISTS "Public can submit feedback" ON public.customer_feedback;

-- Allow inserts only when user_id is provided (can be null for anonymous feedback with restaurant's user_id)
CREATE POLICY "Anyone can submit feedback with valid user_id" ON public.customer_feedback 
FOR INSERT WITH CHECK (user_id IS NOT NULL);
