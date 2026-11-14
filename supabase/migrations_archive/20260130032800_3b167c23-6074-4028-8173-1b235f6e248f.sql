-- Agregar campo description para que el usuario describa su negocio y la IA pueda ser más precisa
ALTER TABLE public.business_opening_projects 
ADD COLUMN IF NOT EXISTS description text;