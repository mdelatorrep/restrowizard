-- =============================================
-- FASE 1: ENUMS para nuevos módulos
-- =============================================

-- Enum para tipos de desperdicio alimenticio
CREATE TYPE waste_category AS ENUM (
  'preparation', 'overproduction', 'spoilage', 'plate_waste', 'storage', 'other'
);

-- Enum para estado de marcas virtuales
CREATE TYPE brand_status AS ENUM (
  'active', 'paused', 'archived'
);

-- Enum para plataformas de delivery
CREATE TYPE delivery_platform AS ENUM (
  'rappi', 'uber_eats', 'didi_food', 'doordash', 'grubhub', 'direct', 'other'
);

-- Enum para tipo de consultor
CREATE TYPE consultant_type AS ENUM (
  'independent', 'agency', 'franchise_advisor', 'chain_consultant'
);

-- Enum para estado de relación consultor-cliente
CREATE TYPE consultant_client_status AS ENUM (
  'active', 'paused', 'completed', 'prospect'
);

-- Enum para tipo de ubicación en cadena
CREATE TYPE chain_location_type AS ENUM (
  'flagship', 'standard', 'express', 'ghost_kitchen', 'franchise'
);

-- Enum para prioridad de alertas del copilot
CREATE TYPE copilot_alert_priority AS ENUM (
  'low', 'medium', 'high', 'critical'
);

-- =============================================
-- FASE 2: Tablas de Sostenibilidad y ESG
-- =============================================

-- Huella de carbono por ingrediente/producto
CREATE TABLE public.carbon_footprint_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ingredient',
  co2_per_kg NUMERIC NOT NULL DEFAULT 0,
  water_usage_liters NUMERIC DEFAULT 0,
  is_local BOOLEAN DEFAULT false,
  supplier_name TEXT,
  distance_km NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registro de desperdicio alimenticio
CREATE TABLE public.food_waste_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  waste_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category waste_category NOT NULL DEFAULT 'other',
  item_name TEXT NOT NULL,
  quantity_kg NUMERIC NOT NULL DEFAULT 0,
  estimated_cost NUMERIC DEFAULT 0,
  reason TEXT,
  preventable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Metas de sostenibilidad
CREATE TABLE public.sustainability_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_achieved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reportes de sostenibilidad generados
CREATE TABLE public.sustainability_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'monthly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_waste_kg NUMERIC DEFAULT 0,
  total_co2_kg NUMERIC DEFAULT 0,
  cost_savings NUMERIC DEFAULT 0,
  recommendations JSONB DEFAULT '[]'::jsonb,
  report_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- FASE 3: Tablas de Ghost Kitchen / Dark Kitchen
-- =============================================

-- Marcas virtuales
CREATE TABLE public.virtual_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  brand_logo TEXT,
  description TEXT,
  cuisine_type cuisine_type DEFAULT 'other',
  status brand_status DEFAULT 'active',
  primary_platform delivery_platform DEFAULT 'direct',
  avg_preparation_time INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Menús por marca virtual
CREATE TABLE public.brand_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.virtual_brands(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  category TEXT DEFAULT 'main',
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Integraciones con agregadores
CREATE TABLE public.aggregator_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID REFERENCES public.virtual_brands(id) ON DELETE SET NULL,
  platform delivery_platform NOT NULL,
  store_id TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  commission_percent NUMERIC DEFAULT 0,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Órdenes de agregadores
CREATE TABLE public.aggregator_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID REFERENCES public.virtual_brands(id) ON DELETE SET NULL,
  platform delivery_platform NOT NULL,
  external_order_id TEXT,
  order_status TEXT DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  commission NUMERIC DEFAULT 0,
  net_total NUMERIC DEFAULT 0,
  customer_name TEXT,
  delivery_address TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Cola de producción de cocina
CREATE TABLE public.kitchen_production_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.aggregator_orders(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.virtual_brands(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  station TEXT DEFAULT 'main',
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- FASE 4: Tablas de Portal de Consultores
-- =============================================

-- Perfiles de consultores gastronómicos
CREATE TABLE public.consultant_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  consultant_type consultant_type DEFAULT 'independent',
  company_name TEXT,
  specializations TEXT[],
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  certifications TEXT[],
  hourly_rate NUMERIC,
  website_url TEXT,
  linkedin_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  logo_url TEXT,
  brand_colors JSONB DEFAULT '{"primary": "#000000", "secondary": "#ffffff"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Relación consultor-cliente (restaurantes)
CREATE TABLE public.consultant_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultant_id UUID NOT NULL REFERENCES public.consultant_profiles(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL,
  status consultant_client_status DEFAULT 'prospect',
  start_date DATE,
  end_date DATE,
  monthly_fee NUMERIC,
  services_included TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reportes generados por consultores
CREATE TABLE public.consultant_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultant_id UUID NOT NULL REFERENCES public.consultant_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.consultant_clients(id) ON DELETE SET NULL,
  report_title TEXT NOT NULL,
  report_type TEXT DEFAULT 'assessment',
  content JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  is_shared_with_client BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Facturación de servicios de consultoría
CREATE TABLE public.consulting_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultant_id UUID NOT NULL REFERENCES public.consultant_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.consultant_clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'MXN',
  description TEXT,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- FASE 5: Tablas de Gestión Multi-Cadena
-- =============================================

-- Cadenas de restaurantes
CREATE TABLE public.restaurant_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  chain_name TEXT NOT NULL,
  logo_url TEXT,
  headquarters_city TEXT,
  headquarters_country TEXT DEFAULT 'México',
  total_locations INTEGER DEFAULT 0,
  founded_year INTEGER,
  description TEXT,
  is_franchise BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ubicaciones de cadena
CREATE TABLE public.chain_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain_id UUID NOT NULL REFERENCES public.restaurant_chains(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  location_type chain_location_type DEFAULT 'standard',
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'México',
  latitude NUMERIC,
  longitude NUMERIC,
  manager_name TEXT,
  manager_email TEXT,
  phone TEXT,
  opening_date DATE,
  seating_capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  local_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Menús maestros de cadena
CREATE TABLE public.chain_master_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain_id UUID NOT NULL REFERENCES public.restaurant_chains(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC NOT NULL,
  category TEXT DEFAULT 'main',
  image_url TEXT,
  is_core_item BOOLEAN DEFAULT true,
  allow_local_pricing BOOLEAN DEFAULT false,
  allow_local_removal BOOLEAN DEFAULT false,
  nutritional_info JSONB DEFAULT '{}'::jsonb,
  allergens TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transferencias de inventario entre ubicaciones
CREATE TABLE public.inventory_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain_id UUID NOT NULL REFERENCES public.restaurant_chains(id) ON DELETE CASCADE,
  from_location_id UUID NOT NULL REFERENCES public.chain_locations(id) ON DELETE CASCADE,
  to_location_id UUID NOT NULL REFERENCES public.chain_locations(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  requested_by TEXT,
  approved_by TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Checklists de cumplimiento para cadenas
CREATE TABLE public.compliance_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain_id UUID NOT NULL REFERENCES public.restaurant_chains(id) ON DELETE CASCADE,
  checklist_name TEXT NOT NULL,
  category TEXT DEFAULT 'operations',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  frequency TEXT DEFAULT 'daily',
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registros de cumplimiento por ubicación
CREATE TABLE public.compliance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.chain_locations(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES public.compliance_checklists(id) ON DELETE CASCADE,
  completed_by TEXT,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- FASE 6: Tablas del Co-Piloto IA
-- =============================================

-- Conversaciones del copilot
CREATE TABLE public.copilot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mensajes del copilot
CREATE TABLE public.copilot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alertas proactivas del copilot
CREATE TABLE public.copilot_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  priority copilot_alert_priority DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Briefings diarios generados
CREATE TABLE public.daily_briefings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  briefing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  highlights TEXT[],
  alerts_count INTEGER DEFAULT 0,
  recommendations TEXT[],
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, briefing_date)
);

-- =============================================
-- FASE 7: RLS Policies
-- =============================================

-- Sostenibilidad
ALTER TABLE public.carbon_footprint_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_waste_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their carbon footprint items" ON public.carbon_footprint_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their food waste logs" ON public.food_waste_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their sustainability goals" ON public.sustainability_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their sustainability reports" ON public.sustainability_reports FOR ALL USING (auth.uid() = user_id);

-- Ghost Kitchen
ALTER TABLE public.virtual_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregator_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregator_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_production_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their virtual brands" ON public.virtual_brands FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage brand menus" ON public.brand_menus FOR ALL USING (EXISTS (SELECT 1 FROM public.virtual_brands WHERE id = brand_menus.brand_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their aggregator integrations" ON public.aggregator_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their aggregator orders" ON public.aggregator_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their kitchen queue" ON public.kitchen_production_queue FOR ALL USING (auth.uid() = user_id);

-- Consultores
ALTER TABLE public.consultant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their consultant profile" ON public.consultant_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Consultants can manage their clients" ON public.consultant_clients FOR ALL USING (EXISTS (SELECT 1 FROM public.consultant_profiles WHERE id = consultant_clients.consultant_id AND user_id = auth.uid()));
CREATE POLICY "Clients can view their consultant relationship" ON public.consultant_clients FOR SELECT USING (auth.uid() = client_user_id);
CREATE POLICY "Consultants can manage their reports" ON public.consultant_reports FOR ALL USING (EXISTS (SELECT 1 FROM public.consultant_profiles WHERE id = consultant_reports.consultant_id AND user_id = auth.uid()));
CREATE POLICY "Consultants can manage their invoices" ON public.consulting_invoices FOR ALL USING (EXISTS (SELECT 1 FROM public.consultant_profiles WHERE id = consulting_invoices.consultant_id AND user_id = auth.uid()));

-- Cadenas
ALTER TABLE public.restaurant_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_master_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their chains" ON public.restaurant_chains FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Chain owners can manage locations" ON public.chain_locations FOR ALL USING (EXISTS (SELECT 1 FROM public.restaurant_chains WHERE id = chain_locations.chain_id AND owner_id = auth.uid()));
CREATE POLICY "Location managers can view their location" ON public.chain_locations FOR SELECT USING (auth.uid() = local_user_id);
CREATE POLICY "Chain owners can manage master menus" ON public.chain_master_menus FOR ALL USING (EXISTS (SELECT 1 FROM public.restaurant_chains WHERE id = chain_master_menus.chain_id AND owner_id = auth.uid()));
CREATE POLICY "Chain owners can manage transfers" ON public.inventory_transfers FOR ALL USING (EXISTS (SELECT 1 FROM public.restaurant_chains WHERE id = inventory_transfers.chain_id AND owner_id = auth.uid()));
CREATE POLICY "Chain owners can manage checklists" ON public.compliance_checklists FOR ALL USING (EXISTS (SELECT 1 FROM public.restaurant_chains WHERE id = compliance_checklists.chain_id AND owner_id = auth.uid()));
CREATE POLICY "Location users can manage compliance records" ON public.compliance_records FOR ALL USING (EXISTS (SELECT 1 FROM public.chain_locations WHERE id = compliance_records.location_id AND (local_user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.restaurant_chains WHERE id = chain_locations.chain_id AND owner_id = auth.uid()))));

-- Copilot
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their copilot conversations" ON public.copilot_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their copilot messages" ON public.copilot_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.copilot_conversations WHERE id = copilot_messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their copilot alerts" ON public.copilot_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their daily briefings" ON public.daily_briefings FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- FASE 8: Triggers para updated_at
-- =============================================

CREATE TRIGGER update_carbon_footprint_items_updated_at BEFORE UPDATE ON public.carbon_footprint_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sustainability_goals_updated_at BEFORE UPDATE ON public.sustainability_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_virtual_brands_updated_at BEFORE UPDATE ON public.virtual_brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_brand_menus_updated_at BEFORE UPDATE ON public.brand_menus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_aggregator_integrations_updated_at BEFORE UPDATE ON public.aggregator_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultant_profiles_updated_at BEFORE UPDATE ON public.consultant_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultant_clients_updated_at BEFORE UPDATE ON public.consultant_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_chains_updated_at BEFORE UPDATE ON public.restaurant_chains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chain_locations_updated_at BEFORE UPDATE ON public.chain_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chain_master_menus_updated_at BEFORE UPDATE ON public.chain_master_menus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_compliance_checklists_updated_at BEFORE UPDATE ON public.compliance_checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();