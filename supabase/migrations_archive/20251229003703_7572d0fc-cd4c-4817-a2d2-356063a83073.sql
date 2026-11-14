-- ============================================
-- FASE 1: ENUMS Y ESTRUCTURA BASE
-- ============================================

-- Roles de usuario
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff', 'user');

-- Niveles de madurez
CREATE TYPE public.maturity_level AS ENUM ('inicial', 'basico', 'intermedio', 'avanzado', 'experto');

-- Tipos de empleo
CREATE TYPE public.job_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary', 'internship');
CREATE TYPE public.job_category AS ENUM ('kitchen', 'service', 'management', 'bartender', 'cleaning', 'delivery', 'other');
CREATE TYPE public.experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'executive');
CREATE TYPE public.application_status AS ENUM ('pending', 'reviewing', 'interviewed', 'offered', 'hired', 'rejected');

-- Tipos de menú
CREATE TYPE public.cuisine_type AS ENUM ('mexican', 'italian', 'japanese', 'chinese', 'american', 'french', 'spanish', 'indian', 'thai', 'mediterranean', 'fusion', 'other');
CREATE TYPE public.menu_status AS ENUM ('draft', 'published', 'archived');

-- Tipos de eventos
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.venue_type AS ENUM ('restaurant', 'banquet_hall', 'outdoor', 'rooftop', 'garden', 'beach', 'hotel', 'other');
CREATE TYPE public.service_category AS ENUM ('catering', 'photography', 'music', 'decoration', 'lighting', 'entertainment', 'flowers', 'other');

-- ============================================
-- FASE 2: PROFILES Y USER ROLES
-- ============================================

-- Tabla de perfiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  restaurant_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tabla de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función has_role (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, restaurant_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'restaurant_name'
  );
  
  -- Asignar rol por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FASE 3: DIAGNÓSTICO DE MADUREZ
-- ============================================

CREATE TABLE public.maturity_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  pillar_scores JSONB NOT NULL DEFAULT '{}',
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  overall_level maturity_level NOT NULL DEFAULT 'inicial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maturity_diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own diagnoses"
  ON public.maturity_diagnoses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagnoses"
  ON public.maturity_diagnoses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnoses"
  ON public.maturity_diagnoses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_maturity_diagnoses_user_id ON public.maturity_diagnoses(user_id);

CREATE TRIGGER update_maturity_diagnoses_updated_at
  BEFORE UPDATE ON public.maturity_diagnoses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FASE 4: MÓDULO DE MENÚS
-- ============================================

-- Plantillas de menú
CREATE TABLE public.menu_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  preview_image TEXT,
  cuisine_type cuisine_type DEFAULT 'other',
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON public.menu_templates FOR SELECT
  USING (is_active = true);

-- Menús de restaurantes
CREATE TABLE public.restaurant_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.menu_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image TEXT,
  cuisine_type cuisine_type DEFAULT 'other',
  status menu_status NOT NULL DEFAULT 'draft',
  public_url_slug TEXT UNIQUE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own menus"
  ON public.restaurant_menus FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own menus"
  ON public.restaurant_menus FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own menus"
  ON public.restaurant_menus FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own menus"
  ON public.restaurant_menus FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view published menus"
  ON public.restaurant_menus FOR SELECT
  USING (status = 'published');

CREATE INDEX idx_restaurant_menus_user_id ON public.restaurant_menus(user_id);
CREATE INDEX idx_restaurant_menus_slug ON public.restaurant_menus(public_url_slug);

CREATE TRIGGER update_restaurant_menus_updated_at
  BEFORE UPDATE ON public.restaurant_menus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Items del menú
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID REFERENCES public.restaurant_menus(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  allergens TEXT[],
  dietary_tags TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their menu items"
  ON public.menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_menus
      WHERE id = menu_items.menu_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view items of published menus"
  ON public.menu_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_menus
      WHERE id = menu_items.menu_id
      AND status = 'published'
    )
  );

CREATE INDEX idx_menu_items_menu_id ON public.menu_items(menu_id);

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para generar slug único
CREATE OR REPLACE FUNCTION public.generate_menu_slug(menu_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(menu_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.restaurant_menus WHERE public_url_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- ============================================
-- FASE 5: EMPLEOS Y CAPACITACIÓN
-- ============================================

-- Empleos
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  benefits TEXT,
  location TEXT NOT NULL,
  job_type job_type NOT NULL DEFAULT 'full_time',
  category job_category NOT NULL DEFAULT 'other',
  experience_level experience_level NOT NULL DEFAULT 'entry',
  salary_min NUMERIC(10,2),
  salary_max NUMERIC(10,2),
  is_salary_visible BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  views_count INTEGER NOT NULL DEFAULT 0,
  applications_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active jobs"
  ON public.jobs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Employers can manage their own jobs"
  ON public.jobs FOR ALL
  USING (auth.uid() = employer_id);

CREATE INDEX idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX idx_jobs_category ON public.jobs(category);
CREATE INDEX idx_jobs_location ON public.jobs(location);

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para incrementar vistas
CREATE OR REPLACE FUNCTION public.increment_job_views(job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.jobs
  SET views_count = views_count + 1
  WHERE id = job_id;
END;
$$;

-- Perfiles de aplicantes
CREATE TABLE public.applicant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  headline TEXT,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  skills TEXT[],
  resume_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  preferred_locations TEXT[],
  preferred_job_types job_type[],
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applicant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own applicant profile"
  ON public.applicant_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Employers can view applicant profiles"
  ON public.applicant_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
    OR is_available = true
  );

CREATE TRIGGER update_applicant_profiles_updated_at
  BEFORE UPDATE ON public.applicant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Aplicaciones a empleos
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cover_letter TEXT,
  resume_url TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view their own applications"
  ON public.job_applications FOR SELECT
  USING (auth.uid() = applicant_id);

CREATE POLICY "Applicants can create applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Employers can view applications for their jobs"
  ON public.job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.employer_id = auth.uid()
    )
  );

CREATE POLICY "Employers can update applications for their jobs"
  ON public.job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.employer_id = auth.uid()
    )
  );

CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_id ON public.job_applications(applicant_id);

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Cursos de capacitación
CREATE TABLE public.training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  duration_hours NUMERIC(5,2),
  level experience_level NOT NULL DEFAULT 'entry',
  category job_category NOT NULL DEFAULT 'other',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  enrollments_count INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses"
  ON public.training_courses FOR SELECT
  USING (is_published = true);

CREATE POLICY "Instructors can manage their own courses"
  ON public.training_courses FOR ALL
  USING (auth.uid() = instructor_id);

CREATE INDEX idx_training_courses_category ON public.training_courses(category);

CREATE TRIGGER update_training_courses_updated_at
  BEFORE UPDATE ON public.training_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inscripciones a cursos
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments"
  ON public.course_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON public.course_enrollments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_course_enrollments_user_id ON public.course_enrollments(user_id);

CREATE TRIGGER update_course_enrollments_updated_at
  BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FASE 6: MARKETPLACE DE EVENTOS
-- ============================================

-- Categorías de eventos
CREATE TABLE public.event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON public.event_categories FOR SELECT
  USING (is_active = true);

-- Venues (lugares)
CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'México',
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  venue_type venue_type NOT NULL DEFAULT 'other',
  capacity_min INTEGER,
  capacity_max INTEGER,
  price_per_hour NUMERIC(10,2),
  price_per_event NUMERIC(10,2),
  amenities TEXT[],
  images TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  average_rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active venues"
  ON public.venues FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can manage their own venues"
  ON public.venues FOR ALL
  USING (auth.uid() = owner_id);

CREATE INDEX idx_venues_city ON public.venues(city);
CREATE INDEX idx_venues_type ON public.venues(venue_type);

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Proveedores de servicios
CREATE TABLE public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category service_category NOT NULL DEFAULT 'other',
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'México',
  price_min NUMERIC(10,2),
  price_max NUMERIC(10,2),
  services_offered TEXT[],
  portfolio_images TEXT[],
  website_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  average_rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active providers"
  ON public.service_providers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can manage their own providers"
  ON public.service_providers FOR ALL
  USING (auth.uid() = owner_id);

CREATE INDEX idx_service_providers_category ON public.service_providers(category);
CREATE INDEX idx_service_providers_city ON public.service_providers(city);

CREATE TRIGGER update_service_providers_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Eventos
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.event_categories(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  guest_count INTEGER,
  budget NUMERIC(12,2),
  status event_status NOT NULL DEFAULT 'draft',
  cover_image TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage their own events"
  ON public.events FOR ALL
  USING (auth.uid() = organizer_id);

CREATE POLICY "Anyone can view public events"
  ON public.events FOR SELECT
  USING (is_public = true AND status = 'published');

CREATE INDEX idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX idx_events_date ON public.events(event_date);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Reservas de venues
CREATE TABLE public.venue_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  guest_count INTEGER,
  total_price NUMERIC(10,2),
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
  ON public.venue_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON public.venue_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Venue owners can view their bookings"
  ON public.venue_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = venue_bookings.venue_id
      AND venues.owner_id = auth.uid()
    )
  );

CREATE POLICY "Venue owners can update their bookings"
  ON public.venue_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = venue_bookings.venue_id
      AND venues.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_venue_bookings_venue_id ON public.venue_bookings(venue_id);
CREATE INDEX idx_venue_bookings_user_id ON public.venue_bookings(user_id);

CREATE TRIGGER update_venue_bookings_updated_at
  BEFORE UPDATE ON public.venue_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Reservas de servicios
CREATE TABLE public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_date TIMESTAMPTZ NOT NULL,
  total_price NUMERIC(10,2),
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service bookings"
  ON public.service_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create service bookings"
  ON public.service_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can view their bookings"
  ON public.service_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = service_bookings.provider_id
      AND service_providers.owner_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update their bookings"
  ON public.service_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE service_providers.id = service_bookings.provider_id
      AND service_providers.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_service_bookings_provider_id ON public.service_bookings(provider_id);
CREATE INDEX idx_service_bookings_user_id ON public.service_bookings(user_id);

CREATE TRIGGER update_service_bookings_updated_at
  BEFORE UPDATE ON public.service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Reseñas
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT review_target_check CHECK (
    (venue_id IS NOT NULL AND provider_id IS NULL AND course_id IS NULL) OR
    (venue_id IS NULL AND provider_id IS NOT NULL AND course_id IS NULL) OR
    (venue_id IS NULL AND provider_id IS NULL AND course_id IS NOT NULL)
  )
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_reviews_venue_id ON public.reviews(venue_id);
CREATE INDEX idx_reviews_provider_id ON public.reviews(provider_id);
CREATE INDEX idx_reviews_course_id ON public.reviews(course_id);

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FASE 7: SISTEMA DE NOTIFICACIONES
-- ============================================

-- Suscripciones push
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Log de notificaciones
CREATE TABLE public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications_log FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_log_user_id ON public.notifications_log(user_id);
CREATE INDEX idx_notifications_log_created_at ON public.notifications_log(created_at DESC);

-- Preferencias de notificaciones
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  job_alerts BOOLEAN NOT NULL DEFAULT true,
  event_reminders BOOLEAN NOT NULL DEFAULT true,
  marketing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Plantillas de menú
INSERT INTO public.menu_templates (name, description, cuisine_type, config) VALUES
('Elegante Clásico', 'Diseño elegante con tipografía serif y colores sobrios', 'other', '{"theme": "classic", "font": "serif"}'),
('Moderno Minimalista', 'Diseño limpio y moderno con espacios amplios', 'fusion', '{"theme": "minimal", "font": "sans"}'),
('Mexicano Tradicional', 'Colores vibrantes inspirados en la cultura mexicana', 'mexican', '{"theme": "mexican", "font": "display"}'),
('Bistro Francés', 'Estilo parisino con acentos dorados', 'french', '{"theme": "french", "font": "script"}'),
('Trattoria Italiana', 'Diseño cálido y acogedor estilo italiano', 'italian', '{"theme": "italian", "font": "serif"}'),
('Asiático Zen', 'Diseño minimalista con influencias orientales', 'japanese', '{"theme": "zen", "font": "sans"}');

-- Categorías de eventos
INSERT INTO public.event_categories (name, description, icon, sort_order) VALUES
('Bodas', 'Celebraciones de matrimonio', 'heart', 1),
('Corporativos', 'Eventos empresariales y conferencias', 'briefcase', 2),
('XV Años', 'Fiestas de quinceañera', 'crown', 3),
('Baby Shower', 'Celebraciones de bebé', 'baby', 4),
('Cumpleaños', 'Fiestas de cumpleaños', 'cake', 5),
('Graduaciones', 'Celebraciones académicas', 'graduation-cap', 6),
('Aniversarios', 'Celebraciones de aniversario', 'calendar-heart', 7),
('Otros', 'Otros tipos de eventos', 'party-popper', 8);