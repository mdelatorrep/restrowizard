-- =====================================================
-- PROFESSIONAL RECIPE MANAGEMENT SYSTEM
-- Sub-recipes, Nutritional Info, Allergens, Structured Steps
-- =====================================================

-- 1. MEASUREMENT UNITS TABLE (for conversion and consistency)
CREATE TABLE IF NOT EXISTS public.measurement_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'volume', -- volume, weight, count, other
  base_unit_id UUID REFERENCES public.measurement_units(id),
  conversion_factor NUMERIC DEFAULT 1, -- multiply by this to convert to base unit
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert common units
INSERT INTO public.measurement_units (name, abbreviation, category, base_unit_id, conversion_factor) VALUES
  ('Gramo', 'g', 'weight', NULL, 1),
  ('Kilogramo', 'kg', 'weight', NULL, 1000),
  ('Miligramo', 'mg', 'weight', NULL, 0.001),
  ('Onza', 'oz', 'weight', NULL, 28.3495),
  ('Libra', 'lb', 'weight', NULL, 453.592),
  ('Mililitro', 'ml', 'volume', NULL, 1),
  ('Litro', 'L', 'volume', NULL, 1000),
  ('Cucharadita', 'cdita', 'volume', NULL, 5),
  ('Cucharada', 'cda', 'volume', NULL, 15),
  ('Taza', 'taza', 'volume', NULL, 240),
  ('Unidad', 'u', 'count', NULL, 1),
  ('Pieza', 'pz', 'count', NULL, 1),
  ('Docena', 'doc', 'count', NULL, 12),
  ('Pizca', 'pizca', 'other', NULL, 0.5),
  ('Al gusto', 'c/n', 'other', NULL, 0)
ON CONFLICT DO NOTHING;

-- 2. ALLERGENS TABLE
CREATE TABLE IF NOT EXISTS public.allergens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT, -- lucide icon name
  severity TEXT DEFAULT 'high', -- high, medium, low
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert common allergens
INSERT INTO public.allergens (name, icon, severity, description) VALUES
  ('Gluten', 'wheat', 'high', 'Trigo, cebada, centeno, avena'),
  ('Lácteos', 'milk', 'high', 'Leche y derivados'),
  ('Huevo', 'egg', 'high', 'Huevo y derivados'),
  ('Mariscos', 'shell', 'high', 'Camarones, langosta, cangrejo'),
  ('Pescado', 'fish', 'high', 'Todos los pescados'),
  ('Nueces', 'nut', 'high', 'Almendras, nueces, avellanas, pistachos'),
  ('Maní', 'peanuts', 'high', 'Cacahuate y derivados'),
  ('Soya', 'bean', 'medium', 'Soya y derivados'),
  ('Ajonjolí', 'grain', 'medium', 'Semillas de sésamo'),
  ('Mostaza', 'leaf', 'medium', 'Mostaza y derivados'),
  ('Apio', 'leaf', 'low', 'Apio y derivados'),
  ('Sulfitos', 'beaker', 'medium', 'Vinos, frutas secas'),
  ('Moluscos', 'shell', 'high', 'Almejas, mejillones, ostras')
ON CONFLICT DO NOTHING;

-- 3. ADD NEW COLUMNS TO RECIPES TABLE
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS yield_quantity NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS yield_unit TEXT DEFAULT 'porciones',
ADD COLUMN IF NOT EXISTS yield_weight_grams NUMERIC,
ADD COLUMN IF NOT EXISTS waste_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS labor_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS labor_cost_per_hour NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS overhead_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_sub_recipe BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_recipe_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS serving_size_grams NUMERIC,
ADD COLUMN IF NOT EXISTS shelf_life_hours INTEGER,
ADD COLUMN IF NOT EXISTS storage_instructions TEXT,
ADD COLUMN IF NOT EXISTS plating_instructions TEXT,
ADD COLUMN IF NOT EXISTS equipment_needed TEXT[],
ADD COLUMN IF NOT EXISTS allergen_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 4. NUTRITIONAL INFO TABLE (per serving)
CREATE TABLE IF NOT EXISTS public.recipe_nutrition (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  calories NUMERIC DEFAULT 0,
  protein_grams NUMERIC DEFAULT 0,
  carbs_grams NUMERIC DEFAULT 0,
  fat_grams NUMERIC DEFAULT 0,
  fiber_grams NUMERIC DEFAULT 0,
  sugar_grams NUMERIC DEFAULT 0,
  sodium_mg NUMERIC DEFAULT 0,
  saturated_fat_grams NUMERIC DEFAULT 0,
  cholesterol_mg NUMERIC DEFAULT 0,
  is_estimated BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(recipe_id)
);

-- 5. PREPARATION STEPS TABLE
CREATE TABLE IF NOT EXISTS public.recipe_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT,
  instruction TEXT NOT NULL,
  duration_minutes INTEGER,
  temperature_celsius NUMERIC,
  technique TEXT, -- sauté, grill, bake, etc.
  equipment TEXT,
  photo_url TEXT,
  tips TEXT,
  critical_point BOOLEAN DEFAULT false, -- HACCP critical point
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SUB-RECIPES JUNCTION TABLE
CREATE TABLE IF NOT EXISTS public.recipe_sub_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  sub_recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'porción',
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_recipe_id, sub_recipe_id)
);

-- 7. ENHANCE RECIPE_INGREDIENTS TABLE
ALTER TABLE public.recipe_ingredients
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.measurement_units(id),
ADD COLUMN IF NOT EXISTS gross_quantity NUMERIC, -- quantity before waste/prep
ADD COLUMN IF NOT EXISTS yield_percentage NUMERIC DEFAULT 100, -- usable after trimming
ADD COLUMN IF NOT EXISTS preparation_method TEXT, -- diced, sliced, minced
ADD COLUMN IF NOT EXISTS allergen_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS calories_per_unit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS protein_per_unit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS carbs_per_unit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fat_per_unit NUMERIC DEFAULT 0;

-- 8. ENABLE RLS
ALTER TABLE public.measurement_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_sub_recipes ENABLE ROW LEVEL SECURITY;

-- 9. RLS POLICIES

-- Measurement units are public read
CREATE POLICY "Anyone can view measurement units"
  ON public.measurement_units FOR SELECT USING (true);

-- Allergens are public read
CREATE POLICY "Anyone can view allergens"
  ON public.allergens FOR SELECT USING (true);

-- Recipe nutrition follows recipe ownership
CREATE POLICY "Users can view their own recipe nutrition"
  ON public.recipe_nutrition FOR SELECT
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can create nutrition for their recipes"
  ON public.recipe_nutrition FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can update their own recipe nutrition"
  ON public.recipe_nutrition FOR UPDATE
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can delete their own recipe nutrition"
  ON public.recipe_nutrition FOR DELETE
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()));

-- Recipe steps follows recipe ownership
CREATE POLICY "Users can view their own recipe steps"
  ON public.recipe_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can create steps for their recipes"
  ON public.recipe_steps FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can update their own recipe steps"
  ON public.recipe_steps FOR UPDATE
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can delete their own recipe steps"
  ON public.recipe_steps FOR DELETE
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()));

-- Sub-recipes follows parent recipe ownership
CREATE POLICY "Users can view their own sub-recipes"
  ON public.recipe_sub_recipes FOR SELECT
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = parent_recipe_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can create sub-recipes for their recipes"
  ON public.recipe_sub_recipes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM recipes r WHERE r.id = parent_recipe_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can update their own sub-recipes"
  ON public.recipe_sub_recipes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = parent_recipe_id AND r.user_id = auth.uid()));

CREATE POLICY "Users can delete their own sub-recipes"
  ON public.recipe_sub_recipes FOR DELETE
  USING (EXISTS (SELECT 1 FROM recipes r WHERE r.id = parent_recipe_id AND r.user_id = auth.uid()));

-- 10. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON public.recipe_steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_sub_recipes_parent ON public.recipe_sub_recipes(parent_recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_sub_recipes_child ON public.recipe_sub_recipes(sub_recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_sub_recipe ON public.recipes(is_sub_recipe) WHERE is_sub_recipe = true;

-- 11. UPDATE TRIGGER FOR recipe_steps
CREATE TRIGGER update_recipe_steps_updated_at
BEFORE UPDATE ON public.recipe_steps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. UPDATE TRIGGER FOR recipe_nutrition
CREATE TRIGGER update_recipe_nutrition_updated_at
BEFORE UPDATE ON public.recipe_nutrition
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();