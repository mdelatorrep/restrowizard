-- Add show_feedback column to restaurant_websites table
ALTER TABLE public.restaurant_websites 
ADD COLUMN IF NOT EXISTS show_feedback boolean NOT NULL DEFAULT true;