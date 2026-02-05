-- Drop the ALL policy and create separate policies for each operation
DROP POLICY IF EXISTS "Users can manage their own website" ON public.restaurant_websites;

-- Create separate SELECT policy for owners (can see their own website regardless of publish state)
CREATE POLICY "Users can view their own website" 
ON public.restaurant_websites 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create INSERT policy for owners
CREATE POLICY "Users can create their own website" 
ON public.restaurant_websites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy for owners
CREATE POLICY "Users can update their own website" 
ON public.restaurant_websites 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create DELETE policy for owners
CREATE POLICY "Users can delete their own website" 
ON public.restaurant_websites 
FOR DELETE 
USING (auth.uid() = user_id);