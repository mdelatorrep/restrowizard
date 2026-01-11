
-- Zonas/espacios específicos dentro de restaurantes
CREATE TABLE public.restaurant_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurant_businesses(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.consultant_profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    capacity_min INTEGER DEFAULT 10,
    capacity_max INTEGER DEFAULT 100,
    price_per_hour NUMERIC DEFAULT 0,
    price_per_event NUMERIC DEFAULT 0,
    amenities JSONB DEFAULT '[]'::jsonb,
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cotizaciones para clientes corporativos
CREATE TABLE public.event_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id UUID REFERENCES public.consultant_profiles(id) ON DELETE CASCADE NOT NULL,
    restaurant_id UUID REFERENCES public.restaurant_businesses(id),
    zone_id UUID REFERENCES public.restaurant_zones(id),
    
    -- Cliente
    client_type TEXT DEFAULT 'corporate',
    client_company TEXT,
    client_contact_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    
    -- Detalles del evento
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date TIMESTAMPTZ,
    event_end_date TIMESTAMPTZ,
    guest_count INTEGER DEFAULT 10,
    event_duration_hours INTEGER DEFAULT 4,
    event_description TEXT,
    
    -- Propuesta económica
    venue_cost NUMERIC DEFAULT 0,
    menu_cost_per_person NUMERIC DEFAULT 0,
    services_cost NUMERIC DEFAULT 0,
    additional_costs NUMERIC DEFAULT 0,
    discount_percentage NUMERIC DEFAULT 0,
    subtotal NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    profit_margin_percentage NUMERIC DEFAULT 20,
    
    -- Estado y tracking
    status TEXT DEFAULT 'draft',
    public_slug TEXT UNIQUE,
    valid_until TIMESTAMPTZ,
    notes TEXT,
    internal_notes TEXT,
    
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items de menú incluidos en la cotización
CREATE TABLE public.quotation_menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES public.event_quotations(id) ON DELETE CASCADE NOT NULL,
    menu_item_id UUID REFERENCES public.menu_items(id),
    category TEXT DEFAULT 'main',
    item_name TEXT NOT NULL,
    item_description TEXT,
    price_per_person NUMERIC DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    is_included BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servicios adicionales en la cotización
CREATE TABLE public.quotation_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES public.event_quotations(id) ON DELETE CASCADE NOT NULL,
    service_provider_id UUID REFERENCES public.service_providers(id),
    service_type TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_description TEXT,
    price NUMERIC DEFAULT 0,
    duration_hours INTEGER,
    provider_name TEXT,
    provider_contact TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Galería de fotos para la cotización
CREATE TABLE public.quotation_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES public.event_quotations(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.restaurant_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_gallery ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_zones
CREATE POLICY "Consultants can manage zones"
ON public.restaurant_zones FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.consultant_profiles cp
        WHERE cp.id = restaurant_zones.consultant_id AND cp.user_id = auth.uid()
    )
);

-- RLS Policies for event_quotations
CREATE POLICY "Consultants can manage their quotations"
ON public.event_quotations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.consultant_profiles cp
        WHERE cp.id = event_quotations.consultant_id AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Public can view quotations by slug"
ON public.event_quotations FOR SELECT
USING (public_slug IS NOT NULL AND status != 'draft');

-- RLS Policies for quotation_menu_items
CREATE POLICY "Access menu items through quotation"
ON public.quotation_menu_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.event_quotations eq
        JOIN public.consultant_profiles cp ON cp.id = eq.consultant_id
        WHERE eq.id = quotation_menu_items.quotation_id AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Public can view menu items of public quotations"
ON public.quotation_menu_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.event_quotations eq
        WHERE eq.id = quotation_menu_items.quotation_id 
        AND eq.public_slug IS NOT NULL AND eq.status != 'draft'
    )
);

-- RLS Policies for quotation_services
CREATE POLICY "Access services through quotation"
ON public.quotation_services FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.event_quotations eq
        JOIN public.consultant_profiles cp ON cp.id = eq.consultant_id
        WHERE eq.id = quotation_services.quotation_id AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Public can view services of public quotations"
ON public.quotation_services FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.event_quotations eq
        WHERE eq.id = quotation_services.quotation_id 
        AND eq.public_slug IS NOT NULL AND eq.status != 'draft'
    )
);

-- RLS Policies for quotation_gallery
CREATE POLICY "Access gallery through quotation"
ON public.quotation_gallery FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.event_quotations eq
        JOIN public.consultant_profiles cp ON cp.id = eq.consultant_id
        WHERE eq.id = quotation_gallery.quotation_id AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Public can view gallery of public quotations"
ON public.quotation_gallery FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.event_quotations eq
        WHERE eq.id = quotation_gallery.quotation_id 
        AND eq.public_slug IS NOT NULL AND eq.status != 'draft'
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_restaurant_zones_updated_at
BEFORE UPDATE ON public.restaurant_zones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_quotations_updated_at
BEFORE UPDATE ON public.event_quotations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate unique public slug for quotations
CREATE OR REPLACE FUNCTION generate_quotation_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.public_slug IS NULL THEN
        NEW.public_slug := LOWER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 12));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quotation_slug
BEFORE INSERT ON public.event_quotations
FOR EACH ROW EXECUTE FUNCTION generate_quotation_slug();
