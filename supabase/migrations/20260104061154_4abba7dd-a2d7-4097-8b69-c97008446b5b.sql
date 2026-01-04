-- Tabla para ventas diarias (entrada de datos financieros)
CREATE TABLE public.daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  covers_count INTEGER DEFAULT 0,
  average_ticket NUMERIC,
  food_cost NUMERIC DEFAULT 0,
  labor_cost NUMERIC DEFAULT 0,
  other_costs NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla para inventario actual
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_cost NUMERIC DEFAULT 0,
  reorder_point NUMERIC DEFAULT 0,
  supplier_name TEXT,
  last_restocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla para empleados/staff
CREATE TABLE public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  hourly_rate NUMERIC DEFAULT 0,
  hire_date DATE,
  performance_score NUMERIC DEFAULT 0,
  training_progress INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla para benchmarks de industria (datos agregados anónimos)
CREATE TABLE public.industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_category TEXT NOT NULL,
  avg_value NUMERIC NOT NULL,
  percentile_25 NUMERIC,
  percentile_75 NUMERIC,
  sample_size INTEGER DEFAULT 0,
  region TEXT DEFAULT 'LATAM',
  restaurant_type TEXT DEFAULT 'casual',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_sales
CREATE POLICY "Users can manage their own daily sales"
ON public.daily_sales FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Consultants can view client daily sales"
ON public.daily_sales FOR SELECT
USING (EXISTS (
  SELECT 1 FROM consultant_clients cc
  JOIN consultant_profiles cp ON cc.consultant_id = cp.id
  WHERE cc.client_user_id = daily_sales.user_id
  AND cp.user_id = auth.uid()
));

-- RLS Policies for inventory_items
CREATE POLICY "Users can manage their own inventory"
ON public.inventory_items FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Consultants can view client inventory"
ON public.inventory_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM consultant_clients cc
  JOIN consultant_profiles cp ON cc.consultant_id = cp.id
  WHERE cc.client_user_id = inventory_items.user_id
  AND cp.user_id = auth.uid()
));

-- RLS Policies for staff_members
CREATE POLICY "Users can manage their own staff"
ON public.staff_members FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Consultants can view client staff"
ON public.staff_members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM consultant_clients cc
  JOIN consultant_profiles cp ON cc.consultant_id = cp.id
  WHERE cc.client_user_id = staff_members.user_id
  AND cp.user_id = auth.uid()
));

-- RLS Policies for industry_benchmarks (public read for all authenticated users)
CREATE POLICY "Authenticated users can view benchmarks"
ON public.industry_benchmarks FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert initial benchmark data
INSERT INTO public.industry_benchmarks (metric_name, metric_category, avg_value, percentile_25, percentile_75, sample_size, region, restaurant_type) VALUES
('food_cost_percentage', 'finances', 28.5, 25.0, 32.0, 450, 'LATAM', 'casual'),
('labor_cost_percentage', 'finances', 22.0, 18.0, 26.0, 450, 'LATAM', 'casual'),
('gross_margin', 'finances', 65.0, 58.0, 72.0, 450, 'LATAM', 'casual'),
('average_ticket', 'finances', 285.0, 180.0, 450.0, 450, 'LATAM', 'casual'),
('staff_turnover_rate', 'talent', 45.0, 30.0, 60.0, 320, 'LATAM', 'casual'),
('training_completion_rate', 'talent', 68.0, 55.0, 80.0, 320, 'LATAM', 'casual'),
('waste_percentage', 'sustainability', 8.5, 5.0, 12.0, 280, 'LATAM', 'casual'),
('carbon_footprint_per_cover', 'sustainability', 2.8, 2.0, 4.0, 150, 'LATAM', 'casual'),
('avg_order_time_minutes', 'operations', 18.0, 12.0, 25.0, 380, 'LATAM', 'casual'),
('customer_satisfaction_score', 'operations', 4.2, 3.8, 4.6, 520, 'LATAM', 'casual');

-- Triggers for updated_at
CREATE TRIGGER update_daily_sales_updated_at
BEFORE UPDATE ON public.daily_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_members_updated_at
BEFORE UPDATE ON public.staff_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();