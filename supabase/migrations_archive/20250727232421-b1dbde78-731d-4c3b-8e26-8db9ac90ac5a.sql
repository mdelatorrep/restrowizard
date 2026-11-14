-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff', 'user');
CREATE TYPE public.maturity_level AS ENUM ('inicial', 'basico', 'intermedio', 'avanzado', 'experto');
CREATE TYPE public.venue_type AS ENUM ('restaurant', 'bar', 'cafe', 'event_space', 'kitchen', 'dining_room', 'private_room');
CREATE TYPE public.service_category AS ENUM ('catering', 'event_planning', 'photography', 'music', 'decoration', 'cleaning', 'security', 'transportation');
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    restaurant_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create maturity diagnoses table
CREATE TABLE public.maturity_diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL,
    pillar_scores JSONB NOT NULL,
    overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 5),
    overall_level maturity_level NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create venues table
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    venue_type venue_type NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    price_per_hour DECIMAL(10,2) NOT NULL CHECK (price_per_hour >= 0),
    amenities TEXT[],
    images TEXT[],
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_bookings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service providers table
CREATE TABLE public.service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    business_name TEXT NOT NULL,
    description TEXT,
    category service_category NOT NULL,
    services TEXT[] NOT NULL,
    price_range TEXT,
    coverage_areas TEXT[],
    portfolio_images TEXT[],
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_bookings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
    expected_guests INTEGER NOT NULL CHECK (expected_guests > 0),
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    requirements TEXT,
    status event_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (budget_max IS NULL OR budget_min IS NULL OR budget_max >= budget_min)
);

-- Create venue bookings table
CREATE TABLE public.venue_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_hours INTEGER NOT NULL CHECK (total_hours > 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    status booking_status DEFAULT 'pending',
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (end_time > start_time)
);

-- Create service bookings table
CREATE TABLE public.service_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    service_date TIMESTAMP WITH TIME ZONE NOT NULL,
    service_details TEXT NOT NULL,
    estimated_price DECIMAL(10,2) CHECK (estimated_price >= 0),
    final_price DECIMAL(10,2) CHECK (final_price >= 0),
    status booking_status DEFAULT 'pending',
    requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    service_provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
    venue_booking_id UUID REFERENCES public.venue_bookings(id) ON DELETE CASCADE,
    service_booking_id UUID REFERENCES public.service_bookings(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        (venue_id IS NOT NULL AND service_provider_id IS NULL) OR
        (venue_id IS NULL AND service_provider_id IS NOT NULL)
    ),
    CHECK (
        (venue_booking_id IS NOT NULL AND service_booking_id IS NULL) OR
        (venue_booking_id IS NULL AND service_booking_id IS NOT NULL)
    )
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maturity_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create security definer function for user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for maturity_diagnoses
CREATE POLICY "Users can view their own diagnoses" ON public.maturity_diagnoses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diagnoses" ON public.maturity_diagnoses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnoses" ON public.maturity_diagnoses
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for venues
CREATE POLICY "Anyone can view active venues" ON public.venues
    FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage their venues" ON public.venues
    FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for service_providers
CREATE POLICY "Anyone can view active service providers" ON public.service_providers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Providers can manage their services" ON public.service_providers
    FOR ALL USING (auth.uid() = provider_id);

-- RLS Policies for events
CREATE POLICY "Users can view their own events" ON public.events
    FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Users can create events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update their own events" ON public.events
    FOR UPDATE USING (auth.uid() = organizer_id);

-- RLS Policies for venue_bookings
CREATE POLICY "Users can view their bookings" ON public.venue_bookings
    FOR SELECT USING (
        auth.uid() = client_id OR 
        auth.uid() IN (SELECT owner_id FROM public.venues WHERE id = venue_id)
    );

CREATE POLICY "Users can create bookings" ON public.venue_bookings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients and venue owners can update bookings" ON public.venue_bookings
    FOR UPDATE USING (
        auth.uid() = client_id OR 
        auth.uid() IN (SELECT owner_id FROM public.venues WHERE id = venue_id)
    );

-- RLS Policies for service_bookings
CREATE POLICY "Users can view their service bookings" ON public.service_bookings
    FOR SELECT USING (
        auth.uid() = client_id OR 
        auth.uid() IN (SELECT provider_id FROM public.service_providers WHERE id = service_provider_id)
    );

CREATE POLICY "Users can create service bookings" ON public.service_bookings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients and providers can update service bookings" ON public.service_bookings
    FOR UPDATE USING (
        auth.uid() = client_id OR 
        auth.uid() IN (SELECT provider_id FROM public.service_providers WHERE id = service_provider_id)
    );

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_id AND (
            (venue_booking_id IS NOT NULL AND auth.uid() IN (
                SELECT client_id FROM public.venue_bookings WHERE id = venue_booking_id
            )) OR
            (service_booking_id IS NOT NULL AND auth.uid() IN (
                SELECT client_id FROM public.service_bookings WHERE id = service_booking_id
            ))
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_maturity_diagnoses_user_id ON public.maturity_diagnoses(user_id);
CREATE INDEX idx_maturity_diagnoses_created_at ON public.maturity_diagnoses(created_at DESC);
CREATE INDEX idx_venues_city ON public.venues(city);
CREATE INDEX idx_venues_venue_type ON public.venues(venue_type);
CREATE INDEX idx_venues_is_active ON public.venues(is_active);
CREATE INDEX idx_service_providers_category ON public.service_providers(category);
CREATE INDEX idx_service_providers_is_active ON public.service_providers(is_active);
CREATE INDEX idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_venue_bookings_venue_id ON public.venue_bookings(venue_id);
CREATE INDEX idx_venue_bookings_client_id ON public.venue_bookings(client_id);
CREATE INDEX idx_venue_bookings_booking_date ON public.venue_bookings(booking_date);
CREATE INDEX idx_service_bookings_service_provider_id ON public.service_bookings(service_provider_id);
CREATE INDEX idx_service_bookings_client_id ON public.service_bookings(client_id);
CREATE INDEX idx_reviews_venue_id ON public.reviews(venue_id);
CREATE INDEX idx_reviews_service_provider_id ON public.reviews(service_provider_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maturity_diagnoses_updated_at
    BEFORE UPDATE ON public.maturity_diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON public.venues
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
    BEFORE UPDATE ON public.service_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venue_bookings_updated_at
    BEFORE UPDATE ON public.venue_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_bookings_updated_at
    BEFORE UPDATE ON public.service_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, restaurant_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'restaurant_name'
    );
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to update venue/service provider ratings
CREATE OR REPLACE FUNCTION public.update_rating_after_review()
RETURNS TRIGGER AS $$
BEGIN
    -- Update venue rating
    IF NEW.venue_id IS NOT NULL THEN
        UPDATE public.venues 
        SET rating = (
            SELECT ROUND(AVG(rating)::numeric, 1)
            FROM public.reviews 
            WHERE venue_id = NEW.venue_id
        ),
        total_bookings = (
            SELECT COUNT(*)
            FROM public.venue_bookings 
            WHERE venue_id = NEW.venue_id AND status = 'completed'
        )
        WHERE id = NEW.venue_id;
    END IF;
    
    -- Update service provider rating
    IF NEW.service_provider_id IS NOT NULL THEN
        UPDATE public.service_providers 
        SET rating = (
            SELECT ROUND(AVG(rating)::numeric, 1)
            FROM public.reviews 
            WHERE service_provider_id = NEW.service_provider_id
        ),
        total_bookings = (
            SELECT COUNT(*)
            FROM public.service_bookings 
            WHERE service_provider_id = NEW.service_provider_id AND status = 'completed'
        )
        WHERE id = NEW.service_provider_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review
    AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_rating_after_review();