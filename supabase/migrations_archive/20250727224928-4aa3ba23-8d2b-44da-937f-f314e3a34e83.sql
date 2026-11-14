-- Create event marketplace tables

-- Table for restaurant spaces/venues
CREATE TABLE public.venue_spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL,
  space_type TEXT NOT NULL, -- 'indoor', 'outdoor', 'mixed'
  area_m2 DECIMAL(10,2),
  location_address TEXT NOT NULL,
  location_city TEXT NOT NULL,
  location_zone TEXT NOT NULL, -- neighborhood/zone
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  price_per_hour DECIMAL(10,2) NOT NULL,
  min_hours INTEGER DEFAULT 2,
  max_hours INTEGER DEFAULT 12,
  amenities JSONB DEFAULT '[]'::jsonb, -- ['parking', 'sound_system', 'wifi', etc.]
  availability_schedule JSONB NOT NULL DEFAULT '{}'::jsonb, -- weekly schedule
  images JSONB DEFAULT '[]'::jsonb, -- array of image URLs
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for service providers (bands, DJs, catering, etc.)
CREATE TABLE public.service_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  description TEXT,
  service_categories JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['band', 'dj', 'catering', 'decoration', etc.]
  location_cities JSONB NOT NULL DEFAULT '[]'::jsonb, -- cities they serve
  portfolio_images JSONB DEFAULT '[]'::jsonb,
  website_url TEXT,
  social_media JSONB DEFAULT '{}'::jsonb,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for specific services offered by providers
CREATE TABLE public.event_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'music', 'catering', 'decoration', 'photography', etc.
  subcategory TEXT, -- 'rock_band', 'jazz_band', 'wedding_catering', etc.
  price_type TEXT NOT NULL, -- 'per_hour', 'fixed', 'per_person'
  base_price DECIMAL(10,2) NOT NULL,
  min_duration_hours INTEGER,
  equipment_included JSONB DEFAULT '[]'::jsonb,
  service_area_cities JSONB NOT NULL DEFAULT '[]'::jsonb,
  availability_schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for event bookings/requests
CREATE TABLE public.event_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_space_id UUID REFERENCES public.venue_spaces(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'corporate', 'wedding', 'birthday', 'conference', etc.
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  expected_guests INTEGER NOT NULL,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  location_preference TEXT, -- zone/area preference
  special_requirements TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'confirmed', 'completed', 'cancelled'
  total_cost DECIMAL(10,2),
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for services requested/booked for events
CREATE TABLE public.event_service_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_booking_id UUID NOT NULL REFERENCES public.event_bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.event_services(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'requested', -- 'requested', 'quoted', 'confirmed', 'completed', 'cancelled'
  quoted_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  service_notes TEXT,
  provider_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for reviews and ratings
CREATE TABLE public.event_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_type TEXT NOT NULL, -- 'venue', 'service_provider'
  reviewee_id UUID NOT NULL, -- references venue_spaces.id or service_providers.id
  event_booking_id UUID REFERENCES public.event_bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for event categories and types
CREATE TABLE public.event_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'Calendar',
  color_class TEXT DEFAULT 'bg-blue-100 text-blue-800',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default event categories
INSERT INTO public.event_categories (name, description, icon, color_class, display_order) VALUES
('Corporativo', 'Eventos empresariales, conferencias, reuniones', 'Briefcase', 'bg-blue-100 text-blue-800', 1),
('Bodas', 'Ceremonias matrimoniales y recepciones', 'Heart', 'bg-pink-100 text-pink-800', 2),
('Cumpleaños', 'Celebraciones de cumpleaños y aniversarios', 'Gift', 'bg-yellow-100 text-yellow-800', 3),
('Quinceañeros', 'Celebraciones de 15 años', 'Crown', 'bg-purple-100 text-purple-800', 4),
('Graduaciones', 'Ceremonias de graduación y celebraciones académicas', 'GraduationCap', 'bg-green-100 text-green-800', 5),
('Networking', 'Eventos de networking y socialización profesional', 'Users', 'bg-indigo-100 text-indigo-800', 6),
('Lanzamientos', 'Lanzamientos de productos y servicios', 'Rocket', 'bg-orange-100 text-orange-800', 7),
('Entretenimiento', 'Conciertos, shows y espectáculos', 'Music', 'bg-red-100 text-red-800', 8);

-- Enable Row Level Security
ALTER TABLE public.venue_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venue_spaces
CREATE POLICY "Users can view all active venue spaces" 
ON public.venue_spaces 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can manage their own venue spaces" 
ON public.venue_spaces 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for service_providers
CREATE POLICY "Users can view all active service providers" 
ON public.service_providers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can manage their own service provider profile" 
ON public.service_providers 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for event_services
CREATE POLICY "Users can view all active event services" 
ON public.event_services 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Service providers can manage their own services" 
ON public.event_services 
FOR ALL 
USING (provider_id IN (
  SELECT id FROM public.service_providers WHERE user_id = auth.uid()
))
WITH CHECK (provider_id IN (
  SELECT id FROM public.service_providers WHERE user_id = auth.uid()
));

-- RLS Policies for event_bookings
CREATE POLICY "Users can view their own event bookings" 
ON public.event_bookings 
FOR ALL 
USING (auth.uid() = client_user_id)
WITH CHECK (auth.uid() = client_user_id);

CREATE POLICY "Venue owners can view bookings for their venues" 
ON public.event_bookings 
FOR SELECT 
USING (venue_space_id IN (
  SELECT id FROM public.venue_spaces WHERE user_id = auth.uid()
));

-- RLS Policies for event_service_bookings
CREATE POLICY "Clients can view their event service bookings" 
ON public.event_service_bookings 
FOR ALL 
USING (event_booking_id IN (
  SELECT id FROM public.event_bookings WHERE client_user_id = auth.uid()
));

CREATE POLICY "Service providers can view their service bookings" 
ON public.event_service_bookings 
FOR ALL 
USING (provider_id IN (
  SELECT id FROM public.service_providers WHERE user_id = auth.uid()
))
WITH CHECK (provider_id IN (
  SELECT id FROM public.service_providers WHERE user_id = auth.uid()
));

-- RLS Policies for event_reviews
CREATE POLICY "Anyone can view reviews" 
ON public.event_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews for their bookings" 
ON public.event_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.event_reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_user_id);

-- RLS Policies for event_categories
CREATE POLICY "Anyone can view active event categories" 
ON public.event_categories 
FOR SELECT 
USING (is_active = true);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venue_spaces_updated_at
  BEFORE UPDATE ON public.venue_spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_services_updated_at
  BEFORE UPDATE ON public.event_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_bookings_updated_at
  BEFORE UPDATE ON public.event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_service_bookings_updated_at
  BEFORE UPDATE ON public.event_service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_venue_spaces_location_zone ON public.venue_spaces(location_zone);
CREATE INDEX idx_venue_spaces_capacity ON public.venue_spaces(capacity);
CREATE INDEX idx_venue_spaces_price ON public.venue_spaces(price_per_hour);
CREATE INDEX idx_venue_spaces_active ON public.venue_spaces(is_active);

CREATE INDEX idx_service_providers_categories ON public.service_providers USING GIN(service_categories);
CREATE INDEX idx_service_providers_cities ON public.service_providers USING GIN(location_cities);
CREATE INDEX idx_service_providers_active ON public.service_providers(is_active);

CREATE INDEX idx_event_services_category ON public.event_services(category);
CREATE INDEX idx_event_services_price ON public.event_services(base_price);
CREATE INDEX idx_event_services_cities ON public.event_services USING GIN(service_area_cities);

CREATE INDEX idx_event_bookings_date ON public.event_bookings(event_date);
CREATE INDEX idx_event_bookings_status ON public.event_bookings(status);
CREATE INDEX idx_event_bookings_client ON public.event_bookings(client_user_id);