
-- =====================================================
-- SISTEMA POS - FASE 1: INFRAESTRUCTURA DE BASE DE DATOS
-- =====================================================

-- 1. Tabla de Mesas del Restaurante
CREATE TABLE public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  table_number TEXT NOT NULL,
  zone_id UUID REFERENCES public.restaurant_zones(id) ON DELETE SET NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'billing', 'maintenance')),
  current_order_id UUID,
  waiter_id UUID,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  shape TEXT DEFAULT 'rectangle' CHECK (shape IN ('rectangle', 'circle', 'square')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, table_number)
);

-- 2. Tabla de Sesiones de Caja (POS Sessions)
CREATE TABLE public.pos_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cashier_name TEXT NOT NULL,
  terminal_id TEXT DEFAULT 'main',
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  opening_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_cash NUMERIC(12,2),
  expected_cash NUMERIC(12,2),
  actual_cash NUMERIC(12,2),
  difference NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'suspended')),
  notes TEXT,
  sales_count INTEGER DEFAULT 0,
  total_sales NUMERIC(12,2) DEFAULT 0,
  total_tips NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabla de Métodos de Pago del POS
CREATE TABLE public.pos_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  method_name TEXT NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('cash', 'card', 'digital_wallet', 'transfer', 'qr', 'credit')),
  provider TEXT CHECK (provider IN ('wompi', 'mercadopago', 'epayco', 'nequi', 'daviplata', 'pse', 'efecty', 'manual')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_reference BOOLEAN DEFAULT false,
  commission_percent NUMERIC(5,2) DEFAULT 0,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabla de Descuentos Predefinidos
CREATE TABLE public.pos_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  value NUMERIC(12,2) NOT NULL,
  min_order_value NUMERIC(12,2) DEFAULT 0,
  max_discount_amount NUMERIC(12,2),
  requires_authorization BOOLEAN DEFAULT false,
  authorization_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Tabla de Transacciones del POS
CREATE TABLE public.pos_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.pos_sessions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.restaurant_orders(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'refund', 'void', 'tip', 'cash_in', 'cash_out')),
  payment_method_id UUID REFERENCES public.pos_payment_methods(id),
  payment_method_name TEXT,
  amount NUMERIC(12,2) NOT NULL,
  reference_number TEXT,
  authorization_code TEXT,
  tip_amount NUMERIC(12,2) DEFAULT 0,
  processor_response JSONB,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Modificar restaurant_orders para campos POS
ALTER TABLE public.restaurant_orders
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.pos_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS waiter_id UUID,
ADD COLUMN IF NOT EXISTS waiter_name TEXT,
ADD COLUMN IF NOT EXISTS split_from_order_id UUID REFERENCES public.restaurant_orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tip_percent NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES public.pos_discounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS guests_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_pos_order BOOLEAN DEFAULT false;

-- 7. Modificar inventory_items para control automático de stock
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_when_low BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS min_stock_level NUMERIC(12,2) DEFAULT 0;

-- 8. Tabla para movimientos de caja
CREATE TABLE public.pos_cash_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.pos_sessions(id) ON DELETE CASCADE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('deposit', 'withdrawal', 'adjustment')),
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT,
  authorized_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_cash_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_tables
CREATE POLICY "Users can view their own tables" ON public.restaurant_tables
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tables" ON public.restaurant_tables
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tables" ON public.restaurant_tables
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tables" ON public.restaurant_tables
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pos_sessions
CREATE POLICY "Users can view their own sessions" ON public.pos_sessions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON public.pos_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.pos_sessions
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for pos_payment_methods
CREATE POLICY "Users can view their own payment methods" ON public.pos_payment_methods
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment methods" ON public.pos_payment_methods
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON public.pos_payment_methods
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON public.pos_payment_methods
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pos_discounts
CREATE POLICY "Users can view their own discounts" ON public.pos_discounts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own discounts" ON public.pos_discounts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discounts" ON public.pos_discounts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discounts" ON public.pos_discounts
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pos_transactions (through session ownership)
CREATE POLICY "Users can view transactions from their sessions" ON public.pos_transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pos_sessions 
    WHERE pos_sessions.id = pos_transactions.session_id 
    AND pos_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create transactions in their sessions" ON public.pos_transactions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pos_sessions 
    WHERE pos_sessions.id = session_id 
    AND pos_sessions.user_id = auth.uid()
  )
);

-- RLS Policies for pos_cash_movements
CREATE POLICY "Users can view movements from their sessions" ON public.pos_cash_movements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pos_sessions 
    WHERE pos_sessions.id = pos_cash_movements.session_id 
    AND pos_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create movements in their sessions" ON public.pos_cash_movements
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pos_sessions 
    WHERE pos_sessions.id = session_id 
    AND pos_sessions.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_restaurant_tables_user_id ON public.restaurant_tables(user_id);
CREATE INDEX idx_restaurant_tables_status ON public.restaurant_tables(status);
CREATE INDEX idx_pos_sessions_user_id ON public.pos_sessions(user_id);
CREATE INDEX idx_pos_sessions_status ON public.pos_sessions(status);
CREATE INDEX idx_pos_transactions_session_id ON public.pos_transactions(session_id);
CREATE INDEX idx_pos_transactions_order_id ON public.pos_transactions(order_id);
CREATE INDEX idx_restaurant_orders_session_id ON public.restaurant_orders(session_id);
CREATE INDEX idx_restaurant_orders_table_id ON public.restaurant_orders(table_id);

-- Update triggers for timestamps
CREATE TRIGGER update_restaurant_tables_updated_at
BEFORE UPDATE ON public.restaurant_tables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pos_sessions_updated_at
BEFORE UPDATE ON public.pos_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pos_payment_methods_updated_at
BEFORE UPDATE ON public.pos_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pos_discounts_updated_at
BEFORE UPDATE ON public.pos_discounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for POS tables (for kitchen display and table updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_sessions;

-- Insert default payment methods for new users (will be inserted per-user when they access POS)
