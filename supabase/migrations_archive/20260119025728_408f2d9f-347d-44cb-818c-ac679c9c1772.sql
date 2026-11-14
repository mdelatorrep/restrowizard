-- Create website templates table
CREATE TABLE public.website_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  preview_image TEXT,
  layout_type TEXT NOT NULL DEFAULT 'modern', -- 'modern', 'classic', 'minimal', 'bold'
  default_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create restaurant websites table
CREATE TABLE public.restaurant_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  template_id UUID REFERENCES public.website_templates,
  is_published BOOLEAN DEFAULT false,
  
  -- General configuration
  site_title TEXT,
  meta_description TEXT,
  favicon_url TEXT,
  
  -- Enabled sections
  show_menu BOOLEAN DEFAULT true,
  show_delivery BOOLEAN DEFAULT false,
  show_reservations BOOLEAN DEFAULT false,
  show_contact BOOLEAN DEFAULT true,
  show_gallery BOOLEAN DEFAULT true,
  show_reviews BOOLEAN DEFAULT true,
  show_loyalty BOOLEAN DEFAULT false,
  show_about BOOLEAN DEFAULT true,
  
  -- Business hours
  business_hours JSONB DEFAULT '{}',
  
  -- Hero/Banner
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_cta_text TEXT,
  hero_cta_link TEXT,
  
  -- About section
  about_title TEXT,
  about_description TEXT,
  about_image_url TEXT,
  
  -- Gallery images
  gallery_images JSONB DEFAULT '[]',
  
  -- Theme overrides
  theme_overrides JSONB DEFAULT '{}',
  
  -- Delivery settings
  delivery_min_order NUMERIC(10,2),
  delivery_message TEXT,
  
  -- Reservations settings
  reservation_max_party_size INTEGER DEFAULT 10,
  reservation_advance_days INTEGER DEFAULT 30,
  reservation_slot_duration INTEGER DEFAULT 60, -- minutes
  reservation_available_times JSONB DEFAULT '[]',
  
  -- SEO and Analytics
  google_analytics_id TEXT,
  custom_scripts TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table reservations table
CREATE TABLE public.table_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status TEXT DEFAULT 'pending',
  special_requests TEXT,
  source TEXT DEFAULT 'website',
  confirmation_code TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.website_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_reservations ENABLE ROW LEVEL SECURITY;

-- Website templates policies (public read, admin only write)
CREATE POLICY "Anyone can view active templates" 
ON public.website_templates FOR SELECT 
USING (is_active = true);

-- Restaurant websites policies
CREATE POLICY "Users can manage their own website" 
ON public.restaurant_websites FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published websites" 
ON public.restaurant_websites FOR SELECT 
USING (is_published = true);

-- Table reservations policies
CREATE POLICY "Restaurant owners can manage their reservations" 
ON public.table_reservations FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create reservations" 
ON public.table_reservations FOR INSERT 
WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_restaurant_websites_updated_at
BEFORE UPDATE ON public.restaurant_websites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_table_reservations_updated_at
BEFORE UPDATE ON public.table_reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Generate confirmation code function
CREATE OR REPLACE FUNCTION public.generate_reservation_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_reservation_code
BEFORE INSERT ON public.table_reservations
FOR EACH ROW
EXECUTE FUNCTION public.generate_reservation_confirmation_code();

-- Insert default templates
INSERT INTO public.website_templates (name, description, layout_type, preview_image, default_config) VALUES
('Moderno', 'Diseño limpio y contemporáneo con animaciones suaves', 'modern', '/placeholder.svg', '{"headerStyle": "transparent", "heroHeight": "full", "animations": true}'),
('Clásico', 'Elegante y sofisticado, perfecto para restaurantes formales', 'classic', '/placeholder.svg', '{"headerStyle": "solid", "heroHeight": "medium", "animations": false}'),
('Minimalista', 'Enfoque en el contenido con mucho espacio en blanco', 'minimal', '/placeholder.svg', '{"headerStyle": "minimal", "heroHeight": "small", "animations": false}'),
('Vibrante', 'Colores audaces y formas geométricas llamativas', 'bold', '/placeholder.svg', '{"headerStyle": "colored", "heroHeight": "full", "animations": true}');