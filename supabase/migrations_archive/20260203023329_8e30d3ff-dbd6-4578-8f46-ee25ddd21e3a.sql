-- Menu Categories (custom categories per menu)
CREATE TABLE public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES public.restaurant_menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Menu Item Modifiers (extras, sides, customizations)
CREATE TABLE public.menu_item_modifiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES public.restaurant_menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'multiple', 'required')),
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Modifier Options (individual options within a modifier group)
CREATE TABLE public.menu_modifier_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modifier_id UUID NOT NULL REFERENCES public.menu_item_modifiers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_adjustment NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Link table: menu items to modifiers
CREATE TABLE public.menu_item_modifier_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  modifier_id UUID NOT NULL REFERENCES public.menu_item_modifiers(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(menu_item_id, modifier_id)
);

-- Add new columns to menu_items for enhanced features
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS calories INTEGER,
ADD COLUMN IF NOT EXISTS spicy_level INTEGER CHECK (spicy_level >= 0 AND spicy_level <= 5),
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL;

-- Create allergens reference table if not exists
CREATE TABLE IF NOT EXISTS public.menu_allergens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Insert standard 14 EU allergens
INSERT INTO public.menu_allergens (code, name, name_en, icon, sort_order) VALUES
('gluten', 'Gluten', 'Gluten', '🌾', 1),
('crustaceans', 'Crustáceos', 'Crustaceans', '🦐', 2),
('eggs', 'Huevos', 'Eggs', '🥚', 3),
('fish', 'Pescado', 'Fish', '🐟', 4),
('peanuts', 'Cacahuetes', 'Peanuts', '🥜', 5),
('soybeans', 'Soja', 'Soybeans', '🫘', 6),
('milk', 'Lácteos', 'Milk', '🥛', 7),
('nuts', 'Frutos secos', 'Tree Nuts', '🌰', 8),
('celery', 'Apio', 'Celery', '🥬', 9),
('mustard', 'Mostaza', 'Mustard', '🟡', 10),
('sesame', 'Sésamo', 'Sesame', '⚪', 11),
('sulphites', 'Sulfitos', 'Sulphites', '🍷', 12),
('lupin', 'Altramuces', 'Lupin', '🌸', 13),
('molluscs', 'Moluscos', 'Molluscs', '🐚', 14)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_modifier_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_allergens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_categories
CREATE POLICY "Users can view their own menu categories" 
ON public.menu_categories FOR SELECT 
USING (menu_id IN (SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()));

CREATE POLICY "Users can create menu categories" 
ON public.menu_categories FOR INSERT 
WITH CHECK (menu_id IN (SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own menu categories" 
ON public.menu_categories FOR UPDATE 
USING (menu_id IN (SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own menu categories" 
ON public.menu_categories FOR DELETE 
USING (menu_id IN (SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()));

-- RLS Policies for menu_item_modifiers
CREATE POLICY "Users can view their own modifiers" 
ON public.menu_item_modifiers FOR SELECT 
USING (menu_id IN (SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()));

CREATE POLICY "Users can create modifiers" 
ON public.menu_item_modifiers FOR INSERT 
WITH CHECK (menu_id IN (SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own modifiers" 
ON public.menu_item_modifiers FOR UPDATE 
USING (menu_id IN (SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own modifiers" 
ON public.menu_item_modifiers FOR DELETE 
USING (menu_id IN (SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()));

-- RLS Policies for menu_modifier_options (cascade from parent)
CREATE POLICY "Users can view modifier options" 
ON public.menu_modifier_options FOR SELECT 
USING (modifier_id IN (
  SELECT id FROM public.menu_item_modifiers WHERE menu_id IN (
    SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage modifier options" 
ON public.menu_modifier_options FOR ALL 
USING (modifier_id IN (
  SELECT id FROM public.menu_item_modifiers WHERE menu_id IN (
    SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()
  )
));

-- RLS for modifier links
CREATE POLICY "Users can view their item modifier links" 
ON public.menu_item_modifier_links FOR SELECT 
USING (menu_item_id IN (
  SELECT id FROM public.menu_items WHERE menu_id IN (
    SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage item modifier links" 
ON public.menu_item_modifier_links FOR ALL 
USING (menu_item_id IN (
  SELECT id FROM public.menu_items WHERE menu_id IN (
    SELECT id FROM public.restaurant_menus WHERE user_id = auth.uid()
  )
));

-- Public read for allergens
CREATE POLICY "Allergens are publicly readable" 
ON public.menu_allergens FOR SELECT 
USING (true);

-- Public read policies for published menu content
CREATE POLICY "Public can view categories of published menus" 
ON public.menu_categories FOR SELECT 
USING (menu_id IN (SELECT id FROM public.restaurant_menus WHERE status = 'published'));

CREATE POLICY "Public can view modifiers of published menus" 
ON public.menu_item_modifiers FOR SELECT 
USING (menu_id IN (SELECT id FROM public.restaurant_menus WHERE status = 'published'));

CREATE POLICY "Public can view modifier options of published menus" 
ON public.menu_modifier_options FOR SELECT 
USING (modifier_id IN (
  SELECT id FROM public.menu_item_modifiers WHERE menu_id IN (
    SELECT id FROM public.restaurant_menus WHERE status = 'published'
  )
));

-- Trigger for updated_at
CREATE TRIGGER update_menu_categories_updated_at
BEFORE UPDATE ON public.menu_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();