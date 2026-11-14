-- Drop the existing policy that doesn't work for INSERT
DROP POLICY IF EXISTS "Users can manage their own brands" ON public.restaurant_brands;

-- Create separate policies for each operation
CREATE POLICY "Users can view their own brands" 
ON public.restaurant_brands FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brands" 
ON public.restaurant_brands FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands" 
ON public.restaurant_brands FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands" 
ON public.restaurant_brands FOR DELETE 
USING (auth.uid() = user_id);