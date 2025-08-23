-- Create enum for cuisine types
CREATE TYPE cuisine_type AS ENUM (
  'italian', 'mexican', 'chinese', 'japanese', 'indian', 'french', 'spanish', 
  'american', 'mediterranean', 'thai', 'korean', 'vietnamese', 'greek', 
  'middle_eastern', 'fusion', 'seafood', 'steakhouse', 'vegetarian', 'vegan'
);

-- Create enum for menu categories
CREATE TYPE menu_category_type AS ENUM (
  'appetizers', 'salads', 'soups', 'main_courses', 'pasta', 'pizza', 'seafood',
  'meat', 'poultry', 'vegetarian', 'desserts', 'beverages', 'wine', 'cocktails',
  'kids', 'specials'
);

-- Create enum for menu status
CREATE TYPE menu_status AS ENUM ('draft', 'published', 'archived');

-- Create menu templates table
CREATE TABLE public.menu_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cuisine_type cuisine_type NOT NULL,
  categories JSONB NOT NULL DEFAULT '[]',
  structure JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create restaurant menus table
CREATE TABLE public.restaurant_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cuisine_type cuisine_type NOT NULL,
  brand_colors JSONB DEFAULT '{}',
  logo_url TEXT,
  template_id UUID REFERENCES public.menu_templates(id),
  menu_data JSONB NOT NULL DEFAULT '{}',
  public_url_slug TEXT UNIQUE,
  qr_code_url TEXT,
  status menu_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES public.restaurant_menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  category menu_category_type NOT NULL,
  image_url TEXT,
  allergens TEXT[],
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.menu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for menu_templates (public read, admin write)
CREATE POLICY "Anyone can view menu templates" 
ON public.menu_templates 
FOR SELECT 
USING (is_active = true);

-- Create policies for restaurant_menus
CREATE POLICY "Users can create their own menus" 
ON public.restaurant_menus 
FOR INSERT 
WITH CHECK (auth.uid() = restaurant_id);

CREATE POLICY "Users can view their own menus" 
ON public.restaurant_menus 
FOR SELECT 
USING (auth.uid() = restaurant_id OR status = 'published');

CREATE POLICY "Users can update their own menus" 
ON public.restaurant_menus 
FOR UPDATE 
USING (auth.uid() = restaurant_id);

-- Create policies for menu_items
CREATE POLICY "Users can manage menu items for their menus" 
ON public.menu_items 
FOR ALL 
USING (auth.uid() IN (
  SELECT restaurant_id 
  FROM public.restaurant_menus 
  WHERE id = menu_items.menu_id
));

CREATE POLICY "Anyone can view published menu items" 
ON public.menu_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM public.restaurant_menus 
  WHERE id = menu_items.menu_id 
  AND status = 'published'
));

-- Create function to generate unique URL slug
CREATE OR REPLACE FUNCTION public.generate_menu_slug(restaurant_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert restaurant name to URL-friendly slug
  base_slug := lower(regexp_replace(restaurant_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check if slug exists and increment counter if needed
  WHILE EXISTS (SELECT 1 FROM public.restaurant_menus WHERE public_url_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Insert sample menu templates
INSERT INTO public.menu_templates (name, description, cuisine_type, categories, structure) VALUES
('Plantilla Italiana Clásica', 'Template perfecto para restaurantes italianos con estructura tradicional', 'italian', 
 '["appetizers", "pasta", "pizza", "main_courses", "desserts", "beverages"]'::jsonb,
 '{
   "sections": [
     {"id": "appetizers", "name": "Antipasti", "order": 1},
     {"id": "pasta", "name": "Pasta", "order": 2},
     {"id": "pizza", "name": "Pizza", "order": 3},
     {"id": "main_courses", "name": "Secondi Piatti", "order": 4},
     {"id": "desserts", "name": "Dolci", "order": 5},
     {"id": "beverages", "name": "Bevande", "order": 6}
   ]
 }'::jsonb),
 
('Plantilla Mexicana Tradicional', 'Template auténtico para cocina mexicana', 'mexican',
 '["appetizers", "main_courses", "desserts", "beverages"]'::jsonb,
 '{
   "sections": [
     {"id": "appetizers", "name": "Antojitos", "order": 1},
     {"id": "main_courses", "name": "Platillos Principales", "order": 2},
     {"id": "desserts", "name": "Postres", "order": 3},
     {"id": "beverages", "name": "Bebidas", "order": 4}
   ]
 }'::jsonb),

('Plantilla Contemporánea', 'Template moderno y versátil para cualquier tipo de cocina', 'fusion',
 '["appetizers", "salads", "main_courses", "desserts", "beverages"]'::jsonb,
 '{
   "sections": [
     {"id": "appetizers", "name": "Para Empezar", "order": 1},
     {"id": "salads", "name": "Ensaladas", "order": 2},
     {"id": "main_courses", "name": "Platos Principales", "order": 3},
     {"id": "desserts", "name": "Postres", "order": 4},
     {"id": "beverages", "name": "Bebidas", "order": 5}
   ]
 }'::jsonb);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_menu_templates_updated_at
BEFORE UPDATE ON public.menu_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_menus_updated_at
BEFORE UPDATE ON public.restaurant_menus
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();