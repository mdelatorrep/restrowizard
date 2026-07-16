import { supabase } from '@/integrations/supabase/client';

export interface LoyaltyTier {
  id: string;
  user_id: string;
  name: string;
  min_points: number;
  points_multiplier: number;
  benefits: string[];
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface LoyaltyCustomer {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  tier_id: string | null;
  tier?: LoyaltyTier;
  current_points: number;
  lifetime_points: number;
  total_spent: number;
  total_orders: number;
  avg_order_value: number;
  first_order_at: string | null;
  last_order_at: string | null;
  days_since_last_order: number | null;
  churn_risk_score: number;
  predicted_ltv: number;
  preferred_items: string[];
  preferred_order_time: string | null;
  ai_insights: Record<string, unknown>;
  birthday: string | null;
  notes: string | null;
  is_active: boolean;
  loyalty_code: string;
  created_at: string;
}

export interface PointsTransaction {
  id: string;
  customer_id: string;
  points: number;
  transaction_type: 'earn' | 'redeem' | 'bonus' | 'expire' | 'adjustment';
  source: string;
  source_id: string | null;
  description: string | null;
  balance_after: number;
  expires_at: string | null;
  created_at: string;
}

export interface RewardsCatalogItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_required: number;
  reward_type: 'discount_percent' | 'discount_fixed' | 'free_item' | 'free_delivery' | 'experience' | 'upgrade';
  reward_value: number | null;
  min_tier_id: string | null;
  stock_limit: number | null;
  stock_used: number;
  valid_from: string | null;
  valid_until: string | null;
  terms: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface LoyaltyCampaign {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  campaign_type: 'points_multiplier' | 'bonus_points' | 'birthday' | 'reactivation' | 'referral' | 'achievement';
  target_segment: 'all' | 'new' | 'at_risk' | 'inactive' | 'vip' | 'birthday' | null;
  target_tier_ids: string[] | null;
  points_multiplier: number;
  bonus_points: number;
  min_order_value: number;
  conditions: Record<string, unknown>;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  uses_count: number;
  max_uses: number | null;
  budget_points: number | null;
  points_spent: number;
}

export interface LoyaltyReward {
  id: string;
  customer_id: string;
  catalog_item_id: string;
  catalog_item?: RewardsCatalogItem;
  points_spent: number;
  redemption_code: string;
  status: 'pending' | 'redeemed' | 'expired' | 'cancelled';
  redeemed_at: string | null;
  expires_at: string | null;
  order_id: string | null;
  created_at: string;
}

export interface LoyaltyAchievement {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  achievement_type: 'orders_count' | 'total_spent' | 'streak' | 'referrals' | 'reviews' | 'custom';
  threshold: number;
  bonus_points: number;
  is_active: boolean;
}

export interface LoyaltyKPIs {
  totalCustomers: number;
  activeCustomers: number;
  totalPointsCirculating: number;
  avgLTV: number;
  atRiskCustomers: number;
  retentionRate: number;
  avgPointsPerCustomer: number;
  redemptionRate: number;
}


export interface LoyaltyData {
  tiers: LoyaltyTier[];
  customers: LoyaltyCustomer[];
  catalog: RewardsCatalogItem[];
  campaigns: LoyaltyCampaign[];
  achievements: LoyaltyAchievement[];
  kpis: LoyaltyKPIs;
}

const EMPTY_KPIS: LoyaltyKPIs = {
  totalCustomers: 0,
  activeCustomers: 0,
  totalPointsCirculating: 0,
  avgLTV: 0,
  atRiskCustomers: 0,
  retentionRate: 0,
  avgPointsPerCustomer: 0,
  redemptionRate: 0,
};

export const calculateDaysSinceLastOrder = (lastOrderAt: string | null): number | null => {
  if (!lastOrderAt) return null;
  const lastOrder = new Date(lastOrderAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastOrder.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * @param pointsEarned  Σ puntos otorgados (transaction_type='earn')
 * @param pointsRedeemed Σ puntos canjeados (valor absoluto de type='redeem')
 */
export const computeLoyaltyKPIs = (
  customersData: LoyaltyCustomer[],
  pointsEarned: number,
  pointsRedeemed: number
): LoyaltyKPIs => {
  const total = customersData.length;
  if (total === 0) return EMPTY_KPIS;

  const active = customersData.filter(c => c.is_active).length;
  const totalPoints = customersData.reduce((sum, c) => sum + c.current_points, 0);
  const totalSpent = customersData.reduce((sum, c) => sum + c.total_spent, 0);
  const atRisk = customersData.filter(c => c.churn_risk_score >= 0.6).length;

  // Clientes con más de 1 pedido en los últimos 90 días
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const retained = customersData.filter(c =>
    c.last_order_at && new Date(c.last_order_at) >= ninetyDaysAgo && c.total_orders > 1
  ).length;

  return {
    totalCustomers: total,
    activeCustomers: active,
    totalPointsCirculating: totalPoints,
    avgLTV: Math.round(totalSpent / total),
    atRiskCustomers: atRisk,
    retentionRate: Math.round((retained / total) * 100),
    avgPointsPerCustomer: Math.round(totalPoints / total),
    // Antes: `redemptionRate: 0 // Will be calculated separately` — nunca se
    // calculó en ningún lado, así que el tablero mostraba 0% de canje aunque
    // los clientes canjearan. Es la métrica que dice si el programa sirve:
    // 0% significa "nadie usa las recompensas" (programa muerto), no "sin datos".
    redemptionRate: pointsEarned > 0 ? Math.round((pointsRedeemed / pointsEarned) * 100) : 0,
  };
};

/** Carga del módulo de fidelización (B-31: extraído del hook). */
export const fetchLoyaltyData = async (userId: string): Promise<LoyaltyData> => {
  const [tiersRes, customersRes, catalogRes, campaignsRes, achievementsRes, txRes] = await Promise.all([
    supabase.from('loyalty_tiers').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('loyalty_customers').select('*').eq('user_id', userId).order('lifetime_points', { ascending: false }),
    supabase.from('loyalty_rewards_catalog').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('loyalty_campaigns').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('loyalty_achievements').select('*').eq('user_id', userId).order('threshold'),
    supabase.from('loyalty_points_transactions').select('points, transaction_type').eq('user_id', userId),
  ]);

  const tiers = ((tiersRes.data || []) as any[]).map(t => ({
    ...t,
    benefits: Array.isArray(t.benefits) ? t.benefits : [],
  })) as LoyaltyTier[];

  const customers = ((customersRes.data || []) as any[]).map(c => {
    const tier = tiers.find(t => t.id === c.tier_id);
    return {
      ...c,
      tier,
      days_since_last_order: calculateDaysSinceLastOrder(c.last_order_at),
      preferred_items: Array.isArray(c.preferred_items) ? c.preferred_items : [],
      ai_insights: typeof c.ai_insights === 'object' && c.ai_insights !== null ? c.ai_insights : {},
      loyalty_code: c.loyalty_code || '',
    };
  }) as LoyaltyCustomer[];

  const txs = (txRes.data || []) as Array<{ points: number; transaction_type: string }>;
  const pointsEarned = txs.filter(t => t.transaction_type === 'earn').reduce((s, t) => s + Math.abs(t.points || 0), 0);
  const pointsRedeemed = txs.filter(t => t.transaction_type === 'redeem').reduce((s, t) => s + Math.abs(t.points || 0), 0);

  return {
    tiers,
    customers,
    catalog: (catalogRes.data || []) as RewardsCatalogItem[],
    campaigns: (campaignsRes.data || []) as LoyaltyCampaign[],
    achievements: (achievementsRes.data || []) as LoyaltyAchievement[],
    kpis: computeLoyaltyKPIs(customers, pointsEarned, pointsRedeemed),
  };
};
