
-- ===========================================
-- SISTEMA DE FIDELIZACIÓN DE CLIENTES
-- Para mejorar Customer Lifetime Value (LTV)
-- ===========================================

-- 1. LOYALTY TIERS - Niveles del programa
CREATE TABLE public.loyalty_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  points_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  benefits JSONB DEFAULT '[]'::jsonb,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'star',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. LOYALTY CUSTOMERS - Perfil unificado de clientes
CREATE TABLE public.loyalty_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  tier_id UUID REFERENCES public.loyalty_tiers(id) ON DELETE SET NULL,
  current_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  avg_order_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  first_order_at TIMESTAMP WITH TIME ZONE,
  last_order_at TIMESTAMP WITH TIME ZONE,
  churn_risk_score DECIMAL(3,2) DEFAULT 0,
  predicted_ltv DECIMAL(12,2) DEFAULT 0,
  preferred_items JSONB DEFAULT '[]'::jsonb,
  preferred_order_time TEXT,
  ai_insights JSONB DEFAULT '{}'::jsonb,
  birthday DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, customer_email),
  UNIQUE(user_id, customer_phone)
);

-- 3. LOYALTY POINTS TRANSACTIONS - Historial de puntos
CREATE TABLE public.loyalty_points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.loyalty_customers(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'bonus', 'expire', 'adjustment')),
  source TEXT NOT NULL,
  source_id UUID,
  description TEXT,
  balance_after INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. LOYALTY REWARDS CATALOG - Catálogo de recompensas
CREATE TABLE public.loyalty_rewards_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_percent', 'discount_fixed', 'free_item', 'free_delivery', 'experience', 'upgrade')),
  reward_value DECIMAL(10,2),
  min_tier_id UUID REFERENCES public.loyalty_tiers(id) ON DELETE SET NULL,
  stock_limit INTEGER,
  stock_used INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  terms TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. LOYALTY REWARDS - Canjes realizados
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.loyalty_customers(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES public.loyalty_rewards_catalog(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  redemption_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired', 'cancelled')),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. LOYALTY CAMPAIGNS - Campañas de puntos
CREATE TABLE public.loyalty_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('points_multiplier', 'bonus_points', 'birthday', 'reactivation', 'referral', 'achievement')),
  target_segment TEXT CHECK (target_segment IN ('all', 'new', 'at_risk', 'inactive', 'vip', 'birthday')),
  target_tier_ids UUID[],
  points_multiplier DECIMAL(3,2) DEFAULT 1.00,
  bonus_points INTEGER DEFAULT 0,
  min_order_value DECIMAL(10,2) DEFAULT 0,
  conditions JSONB DEFAULT '{}'::jsonb,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  budget_points INTEGER,
  points_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. LOYALTY ACHIEVEMENTS - Logros desbloqueables
CREATE TABLE public.loyalty_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'trophy',
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('orders_count', 'total_spent', 'streak', 'referrals', 'reviews', 'custom')),
  threshold INTEGER NOT NULL,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. CUSTOMER ACHIEVEMENTS - Logros desbloqueados por cliente
CREATE TABLE public.loyalty_customer_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.loyalty_customers(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.loyalty_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  UNIQUE(customer_id, achievement_id)
);

-- Enable RLS on all tables
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_customer_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_tiers
CREATE POLICY "Users can view their own tiers" ON public.loyalty_tiers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tiers" ON public.loyalty_tiers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tiers" ON public.loyalty_tiers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tiers" ON public.loyalty_tiers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for loyalty_customers
CREATE POLICY "Users can view their own customers" ON public.loyalty_customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own customers" ON public.loyalty_customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers" ON public.loyalty_customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own customers" ON public.loyalty_customers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for loyalty_points_transactions
CREATE POLICY "Users can view their own transactions" ON public.loyalty_points_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.loyalty_points_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for loyalty_rewards_catalog
CREATE POLICY "Users can view their own catalog" ON public.loyalty_rewards_catalog FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own catalog items" ON public.loyalty_rewards_catalog FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own catalog items" ON public.loyalty_rewards_catalog FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own catalog items" ON public.loyalty_rewards_catalog FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for loyalty_rewards
CREATE POLICY "Users can view their own rewards" ON public.loyalty_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own rewards" ON public.loyalty_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rewards" ON public.loyalty_rewards FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for loyalty_campaigns
CREATE POLICY "Users can view their own campaigns" ON public.loyalty_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own campaigns" ON public.loyalty_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own campaigns" ON public.loyalty_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own campaigns" ON public.loyalty_campaigns FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for loyalty_achievements
CREATE POLICY "Users can view their own achievements" ON public.loyalty_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own achievements" ON public.loyalty_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON public.loyalty_achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own achievements" ON public.loyalty_achievements FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for customer achievements (join through customer)
CREATE POLICY "Users can view customer achievements" ON public.loyalty_customer_achievements 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.loyalty_customers lc WHERE lc.id = customer_id AND lc.user_id = auth.uid())
);
CREATE POLICY "Users can create customer achievements" ON public.loyalty_customer_achievements 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.loyalty_customers lc WHERE lc.id = customer_id AND lc.user_id = auth.uid())
);

-- Function to update customer tier based on lifetime points
CREATE OR REPLACE FUNCTION public.update_customer_tier()
RETURNS TRIGGER AS $$
DECLARE
  new_tier_id UUID;
  restaurant_user_id UUID;
BEGIN
  -- Get the user_id from the customer
  SELECT user_id INTO restaurant_user_id FROM public.loyalty_customers WHERE id = NEW.customer_id;
  
  -- Find the appropriate tier based on lifetime points
  SELECT id INTO new_tier_id
  FROM public.loyalty_tiers
  WHERE user_id = restaurant_user_id AND is_active = true AND min_points <= (
    SELECT lifetime_points FROM public.loyalty_customers WHERE id = NEW.customer_id
  )
  ORDER BY min_points DESC
  LIMIT 1;
  
  -- Update customer tier if different
  IF new_tier_id IS NOT NULL THEN
    UPDATE public.loyalty_customers 
    SET tier_id = new_tier_id, updated_at = now()
    WHERE id = NEW.customer_id AND (tier_id IS NULL OR tier_id != new_tier_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update tier after points transaction
CREATE TRIGGER trigger_update_customer_tier
AFTER INSERT ON public.loyalty_points_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_tier();

-- Function to generate unique redemption code
CREATE OR REPLACE FUNCTION public.generate_redemption_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_loyalty_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_loyalty_tiers_updated_at BEFORE UPDATE ON public.loyalty_tiers FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_updated_at();
CREATE TRIGGER update_loyalty_customers_updated_at BEFORE UPDATE ON public.loyalty_customers FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_updated_at();
CREATE TRIGGER update_loyalty_rewards_catalog_updated_at BEFORE UPDATE ON public.loyalty_rewards_catalog FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_updated_at();
CREATE TRIGGER update_loyalty_campaigns_updated_at BEFORE UPDATE ON public.loyalty_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_updated_at();

-- Create indexes for performance
CREATE INDEX idx_loyalty_customers_user_id ON public.loyalty_customers(user_id);
CREATE INDEX idx_loyalty_customers_tier_id ON public.loyalty_customers(tier_id);
CREATE INDEX idx_loyalty_customers_churn_risk ON public.loyalty_customers(user_id, churn_risk_score DESC);
CREATE INDEX idx_loyalty_customers_last_order ON public.loyalty_customers(user_id, last_order_at DESC);
CREATE INDEX idx_loyalty_points_transactions_customer ON public.loyalty_points_transactions(customer_id);
CREATE INDEX idx_loyalty_rewards_customer ON public.loyalty_rewards(customer_id);
CREATE INDEX idx_loyalty_rewards_status ON public.loyalty_rewards(status);
CREATE INDEX idx_loyalty_campaigns_active ON public.loyalty_campaigns(user_id, is_active, starts_at, ends_at);
