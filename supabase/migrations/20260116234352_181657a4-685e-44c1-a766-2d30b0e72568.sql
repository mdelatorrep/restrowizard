
-- =============================================
-- 1. BRAND MANAGEMENT TABLES
-- =============================================
CREATE TABLE public.restaurant_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  tagline TEXT,
  primary_color TEXT DEFAULT '#6B46C1',
  secondary_color TEXT DEFAULT '#F7FAFC',
  accent_color TEXT DEFAULT '#ED8936',
  font_primary TEXT DEFAULT 'Lato',
  font_secondary TEXT DEFAULT 'Montserrat',
  brand_voice TEXT,
  brand_values JSONB DEFAULT '[]'::jsonb,
  brand_manual_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.restaurant_brands(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  asset_name TEXT,
  asset_url TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  prompt_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. CUSTOMER FEEDBACK TABLES
-- =============================================
CREATE TABLE public.customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  source TEXT DEFAULT 'in_store',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  ambiance_rating INTEGER CHECK (ambiance_rating >= 1 AND ambiance_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  comment TEXT,
  sentiment_score NUMERIC,
  sentiment_label TEXT,
  key_topics JSONB DEFAULT '[]'::jsonb,
  ai_response_suggestion TEXT,
  responded BOOLEAN DEFAULT FALSE,
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.feedback_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  qr_code_url TEXT,
  short_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  incentive TEXT,
  responses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. RECIPE MANAGEMENT TABLES
-- =============================================
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'plato_fuerte',
  portions INTEGER DEFAULT 1,
  preparation_time_minutes INTEGER,
  difficulty TEXT DEFAULT 'media',
  instructions TEXT,
  tips TEXT,
  photo_url TEXT,
  video_url TEXT,
  is_secret BOOLEAN DEFAULT FALSE,
  total_cost NUMERIC DEFAULT 0,
  cost_per_portion NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  cost_per_unit NUMERIC DEFAULT 0,
  notes TEXT,
  is_optional BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE public.recipe_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes_description TEXT,
  ingredients_snapshot JSONB,
  instructions_snapshot TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. ORDERS MANAGEMENT TABLES
-- =============================================
CREATE TABLE public.restaurant_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_number SERIAL,
  source TEXT DEFAULT 'in_store',
  order_type TEXT DEFAULT 'dine_in',
  status TEXT DEFAULT 'pending',
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  delivery_address TEXT,
  delivery_notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  estimated_time_minutes INTEGER,
  assigned_driver TEXT,
  driver_phone TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.restaurant_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  zone_name TEXT NOT NULL,
  polygon JSONB,
  delivery_fee NUMERIC DEFAULT 0,
  min_order NUMERIC DEFAULT 0,
  estimated_time_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. SALES GOALS TABLES
-- =============================================
CREATE TABLE public.sales_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type TEXT DEFAULT 'monthly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue_goal NUMERIC,
  covers_goal INTEGER,
  avg_ticket_goal NUMERIC,
  category_goals JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sales_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  projection_date DATE NOT NULL,
  projected_revenue NUMERIC,
  projected_covers INTEGER,
  confidence_level NUMERIC,
  factors JSONB DEFAULT '{}'::jsonb,
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. SUPPORT TICKETS (PQRS) TABLES
-- =============================================
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticket_number SERIAL,
  type TEXT NOT NULL DEFAULT 'peticion',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  order_id UUID REFERENCES public.restaurant_orders(id) ON DELETE SET NULL,
  assigned_to UUID,
  resolution TEXT,
  satisfaction_rating INTEGER,
  ai_category TEXT,
  ai_priority_suggestion TEXT,
  ai_response_draft TEXT,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'staff',
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.support_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  subject_template TEXT,
  body_template TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. SOCIAL SENTIMENT TABLES
-- =============================================
CREATE TABLE public.social_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  external_id TEXT,
  author_name TEXT,
  author_url TEXT,
  content TEXT,
  rating INTEGER,
  sentiment_score NUMERIC,
  sentiment_label TEXT,
  key_topics JSONB DEFAULT '[]'::jsonb,
  engagement_likes INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  responded BOOLEAN DEFAULT FALSE,
  response_text TEXT,
  fetched_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  account_name TEXT,
  account_url TEXT,
  access_token_encrypted TEXT,
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sentiment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_date DATE NOT NULL,
  total_mentions INTEGER DEFAULT 0,
  avg_sentiment NUMERIC,
  positive_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  trending_topics JSONB DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.restaurant_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Restaurant Brands
CREATE POLICY "Users can manage their own brands" ON public.restaurant_brands FOR ALL USING (auth.uid() = user_id);

-- Brand Assets
CREATE POLICY "Users can manage assets of their brands" ON public.brand_assets FOR ALL USING (EXISTS (SELECT 1 FROM public.restaurant_brands WHERE id = brand_assets.brand_id AND user_id = auth.uid()));

-- Customer Feedback
CREATE POLICY "Users can manage their feedback" ON public.customer_feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can submit feedback" ON public.customer_feedback FOR INSERT WITH CHECK (true);

-- Feedback Campaigns
CREATE POLICY "Users can manage their campaigns" ON public.feedback_campaigns FOR ALL USING (auth.uid() = user_id);

-- Recipes
CREATE POLICY "Users can manage their recipes" ON public.recipes FOR ALL USING (auth.uid() = user_id);

-- Recipe Ingredients
CREATE POLICY "Users can manage ingredients of their recipes" ON public.recipe_ingredients FOR ALL USING (EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_ingredients.recipe_id AND user_id = auth.uid()));

-- Recipe Versions
CREATE POLICY "Users can manage versions of their recipes" ON public.recipe_versions FOR ALL USING (EXISTS (SELECT 1 FROM public.recipes WHERE id = recipe_versions.recipe_id AND user_id = auth.uid()));

-- Restaurant Orders
CREATE POLICY "Users can manage their orders" ON public.restaurant_orders FOR ALL USING (auth.uid() = user_id);

-- Order Status History
CREATE POLICY "Users can view order history" ON public.order_status_history FOR ALL USING (EXISTS (SELECT 1 FROM public.restaurant_orders WHERE id = order_status_history.order_id AND user_id = auth.uid()));

-- Delivery Zones
CREATE POLICY "Users can manage their delivery zones" ON public.delivery_zones FOR ALL USING (auth.uid() = user_id);

-- Sales Goals
CREATE POLICY "Users can manage their sales goals" ON public.sales_goals FOR ALL USING (auth.uid() = user_id);

-- Sales Projections
CREATE POLICY "Users can manage their projections" ON public.sales_projections FOR ALL USING (auth.uid() = user_id);

-- Support Tickets
CREATE POLICY "Users can manage their tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id);

-- Ticket Messages
CREATE POLICY "Users can manage messages of their tickets" ON public.ticket_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()));

-- Support Templates
CREATE POLICY "Users can manage their templates" ON public.support_templates FOR ALL USING (auth.uid() = user_id);

-- Social Mentions
CREATE POLICY "Users can manage their social mentions" ON public.social_mentions FOR ALL USING (auth.uid() = user_id);

-- Social Accounts
CREATE POLICY "Users can manage their social accounts" ON public.social_accounts FOR ALL USING (auth.uid() = user_id);

-- Sentiment Reports
CREATE POLICY "Users can manage their sentiment reports" ON public.sentiment_reports FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================
CREATE TRIGGER update_restaurant_brands_updated_at BEFORE UPDATE ON public.restaurant_brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_orders_updated_at BEFORE UPDATE ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_goals_updated_at BEFORE UPDATE ON public.sales_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ADD COLUMNS TO EXISTING TABLES
-- =============================================
ALTER TABLE public.restaurant_menus ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.restaurant_brands(id) ON DELETE SET NULL;
ALTER TABLE public.restaurant_menus ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.restaurant_menus ADD COLUMN IF NOT EXISTS ai_recommendations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.restaurant_menus ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.restaurant_menus ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;

ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS ai_description TEXT;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS suggested_price NUMERIC;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS profitability_score NUMERIC;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS popularity_score NUMERIC;
