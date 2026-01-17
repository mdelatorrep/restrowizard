import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';
import type { Json } from '@/integrations/supabase/types';

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

export const useLoyaltyData = () => {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [catalog, setCatalog] = useState<RewardsCatalogItem[]>([]);
  const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>([]);
  const [achievements, setAchievements] = useState<LoyaltyAchievement[]>([]);
  const [kpis, setKpis] = useState<LoyaltyKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const { toast } = useToast();
  const { userId } = useDataUserId();

  const calculateDaysSinceLastOrder = (lastOrderAt: string | null): number | null => {
    if (!lastOrderAt) return null;
    const lastOrder = new Date(lastOrderAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastOrder.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateKPIs = useCallback((customersData: LoyaltyCustomer[]): LoyaltyKPIs => {
    const total = customersData.length;
    if (total === 0) {
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        totalPointsCirculating: 0,
        avgLTV: 0,
        atRiskCustomers: 0,
        retentionRate: 0,
        avgPointsPerCustomer: 0,
        redemptionRate: 0,
      };
    }

    const active = customersData.filter(c => c.is_active).length;
    const totalPoints = customersData.reduce((sum, c) => sum + c.current_points, 0);
    const totalSpent = customersData.reduce((sum, c) => sum + c.total_spent, 0);
    const atRisk = customersData.filter(c => c.churn_risk_score >= 0.6).length;
    
    // Customers with more than 1 order in the last 90 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);
    const retained = customersData.filter(c => 
      c.last_order_at && new Date(c.last_order_at) >= thirtyDaysAgo && c.total_orders > 1
    ).length;

    return {
      totalCustomers: total,
      activeCustomers: active,
      totalPointsCirculating: totalPoints,
      avgLTV: Math.round(totalSpent / total),
      atRiskCustomers: atRisk,
      retentionRate: total > 0 ? Math.round((retained / total) * 100) : 0,
      avgPointsPerCustomer: Math.round(totalPoints / total),
      redemptionRate: 0, // Will be calculated separately
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch all data in parallel
      const [tiersRes, customersRes, catalogRes, campaignsRes, achievementsRes] = await Promise.all([
        supabase
          .from('loyalty_tiers')
          .select('*')
          .eq('user_id', userId)
          .order('sort_order'),
        supabase
          .from('loyalty_customers')
          .select('*')
          .eq('user_id', userId)
          .order('lifetime_points', { ascending: false }),
        supabase
          .from('loyalty_rewards_catalog')
          .select('*')
          .eq('user_id', userId)
          .order('sort_order'),
        supabase
          .from('loyalty_campaigns')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('loyalty_achievements')
          .select('*')
          .eq('user_id', userId)
          .order('threshold'),
      ]);

      const tiersData = (tiersRes.data || []).map(t => ({
        ...t,
        benefits: Array.isArray(t.benefits) ? t.benefits : [],
      })) as LoyaltyTier[];
      setTiers(tiersData);

      // Map customers with their tiers and calculated days
      const customersData = (customersRes.data || []).map(c => {
        const tier = tiersData.find(t => t.id === c.tier_id);
        return {
          ...c,
          tier,
          days_since_last_order: calculateDaysSinceLastOrder(c.last_order_at),
          preferred_items: Array.isArray(c.preferred_items) ? c.preferred_items : [],
          ai_insights: typeof c.ai_insights === 'object' && c.ai_insights !== null ? c.ai_insights : {},
        };
      }) as LoyaltyCustomer[];
      setCustomers(customersData);

      setCatalog((catalogRes.data || []) as RewardsCatalogItem[]);
      setCampaigns((campaignsRes.data || []) as LoyaltyCampaign[]);
      setAchievements((achievementsRes.data || []) as LoyaltyAchievement[]);

      setKpis(calculateKPIs(customersData));
      setHasData(customersData.length > 0 || tiersData.length > 0);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, calculateKPIs]);

  // === TIER MANAGEMENT ===
  const createTier = async (tierData: Partial<LoyaltyTier>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .insert([{
          user_id: userId,
          name: tierData.name || 'Nuevo Nivel',
          min_points: tierData.min_points || 0,
          points_multiplier: tierData.points_multiplier || 1.0,
          benefits: (tierData.benefits || []) as unknown as Json,
          color: tierData.color || '#6B7280',
          icon: tierData.icon || 'star',
          sort_order: tierData.sort_order || tiers.length,
        }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Nivel creado', description: `${data.name} ha sido añadido` });
      await fetchData();
      return data;
    } catch (error) {
      console.error('Error creating tier:', error);
      toast({ title: 'Error', description: 'No se pudo crear el nivel', variant: 'destructive' });
      return null;
    }
  };

  const updateTier = async (id: string, updates: Partial<LoyaltyTier>) => {
    try {
      const { error } = await supabase
        .from('loyalty_tiers')
        .update({
          ...updates,
          benefits: updates.benefits as unknown as Json,
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Nivel actualizado' });
      await fetchData();
    } catch (error) {
      console.error('Error updating tier:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el nivel', variant: 'destructive' });
    }
  };

  // === CUSTOMER MANAGEMENT ===
  const createCustomer = async (customerData: Partial<LoyaltyCustomer>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('loyalty_customers')
        .insert([{
          user_id: userId,
          customer_name: customerData.customer_name || 'Cliente',
          customer_email: customerData.customer_email,
          customer_phone: customerData.customer_phone,
          birthday: customerData.birthday,
          notes: customerData.notes,
        }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Cliente registrado', description: `${data.customer_name} se ha unido al programa` });
      await fetchData();
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({ title: 'Error', description: 'No se pudo registrar el cliente', variant: 'destructive' });
      return null;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<LoyaltyCustomer>) => {
    try {
      const { error } = await supabase
        .from('loyalty_customers')
        .update({
          customer_name: updates.customer_name,
          customer_email: updates.customer_email,
          customer_phone: updates.customer_phone,
          birthday: updates.birthday,
          notes: updates.notes,
          is_active: updates.is_active,
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Cliente actualizado' });
      await fetchData();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el cliente', variant: 'destructive' });
    }
  };

  // === POINTS MANAGEMENT ===
  const awardPoints = async (
    customerId: string,
    points: number,
    source: string,
    description?: string,
    sourceId?: string
  ) => {
    if (!userId) return null;

    try {
      // Get current balance
      const customer = customers.find(c => c.id === customerId);
      if (!customer) throw new Error('Cliente no encontrado');

      const newBalance = customer.current_points + points;
      const newLifetime = customer.lifetime_points + points;

      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from('loyalty_points_transactions')
        .insert([{
          user_id: userId,
          customer_id: customerId,
          points,
          transaction_type: 'earn',
          source,
          source_id: sourceId,
          description: description || `+${points} puntos por ${source}`,
          balance_after: newBalance,
        }])
        .select()
        .single();

      if (txError) throw txError;

      // Update customer points
      const { error: updateError } = await supabase
        .from('loyalty_customers')
        .update({
          current_points: newBalance,
          lifetime_points: newLifetime,
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      toast({ title: 'Puntos otorgados', description: `+${points} puntos para ${customer.customer_name}` });
      await fetchData();
      return transaction;
    } catch (error) {
      console.error('Error awarding points:', error);
      toast({ title: 'Error', description: 'No se pudieron otorgar los puntos', variant: 'destructive' });
      return null;
    }
  };

  // === REWARDS CATALOG ===
  const createCatalogItem = async (itemData: Partial<RewardsCatalogItem>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('loyalty_rewards_catalog')
        .insert([{
          user_id: userId,
          name: itemData.name || 'Nueva Recompensa',
          description: itemData.description,
          points_required: itemData.points_required || 100,
          reward_type: itemData.reward_type || 'discount_percent',
          reward_value: itemData.reward_value,
          min_tier_id: itemData.min_tier_id,
          stock_limit: itemData.stock_limit,
          terms: itemData.terms,
          sort_order: catalog.length,
        }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Recompensa creada', description: `${data.name} añadida al catálogo` });
      await fetchData();
      return data;
    } catch (error) {
      console.error('Error creating catalog item:', error);
      toast({ title: 'Error', description: 'No se pudo crear la recompensa', variant: 'destructive' });
      return null;
    }
  };

  const updateCatalogItem = async (id: string, updates: Partial<RewardsCatalogItem>) => {
    try {
      const { error } = await supabase
        .from('loyalty_rewards_catalog')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Recompensa actualizada' });
      await fetchData();
    } catch (error) {
      console.error('Error updating catalog item:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar la recompensa', variant: 'destructive' });
    }
  };

  // === REDEMPTIONS ===
  const redeemReward = async (customerId: string, catalogItemId: string) => {
    if (!userId) return null;

    try {
      const customer = customers.find(c => c.id === customerId);
      const item = catalog.find(i => i.id === catalogItemId);

      if (!customer || !item) throw new Error('Cliente o recompensa no encontrada');
      if (customer.current_points < item.points_required) {
        toast({ title: 'Puntos insuficientes', description: 'El cliente no tiene suficientes puntos', variant: 'destructive' });
        return null;
      }

      // Generate redemption code
      const { data: codeData } = await supabase.rpc('generate_redemption_code');
      const redemptionCode = codeData || `RW${Date.now().toString(36).toUpperCase()}`;

      // Create redemption
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data: reward, error: rewardError } = await supabase
        .from('loyalty_rewards')
        .insert([{
          user_id: userId,
          customer_id: customerId,
          catalog_item_id: catalogItemId,
          points_spent: item.points_required,
          redemption_code: redemptionCode,
          expires_at: expiresAt.toISOString(),
        }])
        .select()
        .single();

      if (rewardError) throw rewardError;

      // Deduct points
      const newBalance = customer.current_points - item.points_required;

      await supabase
        .from('loyalty_points_transactions')
        .insert([{
          user_id: userId,
          customer_id: customerId,
          points: -item.points_required,
          transaction_type: 'redeem',
          source: 'reward_redemption',
          source_id: reward.id,
          description: `Canje: ${item.name}`,
          balance_after: newBalance,
        }]);

      await supabase
        .from('loyalty_customers')
        .update({ current_points: newBalance })
        .eq('id', customerId);

      // Update stock
      if (item.stock_limit) {
        await supabase
          .from('loyalty_rewards_catalog')
          .update({ stock_used: item.stock_used + 1 })
          .eq('id', catalogItemId);
      }

      toast({ 
        title: 'Recompensa canjeada', 
        description: `Código: ${redemptionCode}` 
      });
      await fetchData();
      return reward;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast({ title: 'Error', description: 'No se pudo canjear la recompensa', variant: 'destructive' });
      return null;
    }
  };

  // === CAMPAIGNS ===
  const createCampaign = async (campaignData: Partial<LoyaltyCampaign>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('loyalty_campaigns')
        .insert([{
          user_id: userId,
          name: campaignData.name || 'Nueva Campaña',
          description: campaignData.description,
          campaign_type: campaignData.campaign_type || 'bonus_points',
          target_segment: campaignData.target_segment || 'all',
          target_tier_ids: campaignData.target_tier_ids,
          points_multiplier: campaignData.points_multiplier || 1.0,
          bonus_points: campaignData.bonus_points || 0,
          min_order_value: campaignData.min_order_value || 0,
          conditions: (campaignData.conditions || {}) as unknown as Json,
          starts_at: campaignData.starts_at || new Date().toISOString(),
          ends_at: campaignData.ends_at,
          max_uses: campaignData.max_uses,
          budget_points: campaignData.budget_points,
        }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Campaña creada', description: `${data.name} está activa` });
      await fetchData();
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({ title: 'Error', description: 'No se pudo crear la campaña', variant: 'destructive' });
      return null;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<LoyaltyCampaign>) => {
    try {
      const { error } = await supabase
        .from('loyalty_campaigns')
        .update({
          ...updates,
          conditions: updates.conditions as unknown as Json,
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Campaña actualizada' });
      await fetchData();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar la campaña', variant: 'destructive' });
    }
  };

  // === ACHIEVEMENTS ===
  const createAchievement = async (achievementData: Partial<LoyaltyAchievement>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('loyalty_achievements')
        .insert([{
          user_id: userId,
          name: achievementData.name || 'Nuevo Logro',
          description: achievementData.description,
          icon: achievementData.icon || 'trophy',
          achievement_type: achievementData.achievement_type || 'orders_count',
          threshold: achievementData.threshold || 10,
          bonus_points: achievementData.bonus_points || 100,
        }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Logro creado', description: `${data.name} configurado` });
      await fetchData();
      return data;
    } catch (error) {
      console.error('Error creating achievement:', error);
      toast({ title: 'Error', description: 'No se pudo crear el logro', variant: 'destructive' });
      return null;
    }
  };

  // === ANALYTICS ===
  const getAtRiskCustomers = useCallback(() => {
    return customers
      .filter(c => c.churn_risk_score >= 0.5 || (c.days_since_last_order && c.days_since_last_order > 30))
      .sort((a, b) => b.churn_risk_score - a.churn_risk_score);
  }, [customers]);

  const getVIPCustomers = useCallback(() => {
    return customers
      .filter(c => c.tier?.name?.toLowerCase().includes('oro') || c.tier?.name?.toLowerCase().includes('platino') || c.lifetime_points > 5000)
      .sort((a, b) => b.lifetime_points - a.lifetime_points);
  }, [customers]);

  const getCustomersByTier = useCallback(() => {
    const tierCounts: Record<string, number> = {};
    tiers.forEach(t => { tierCounts[t.name] = 0; });
    tierCounts['Sin nivel'] = 0;
    
    customers.forEach(c => {
      if (c.tier) {
        tierCounts[c.tier.name] = (tierCounts[c.tier.name] || 0) + 1;
      } else {
        tierCounts['Sin nivel']++;
      }
    });
    
    return tierCounts;
  }, [customers, tiers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    // Data
    customers,
    tiers,
    catalog,
    campaigns,
    achievements,
    kpis,
    loading,
    hasData,

    // Tier actions
    createTier,
    updateTier,

    // Customer actions
    createCustomer,
    updateCustomer,

    // Points actions
    awardPoints,

    // Catalog actions
    createCatalogItem,
    updateCatalogItem,

    // Redemption actions
    redeemReward,

    // Campaign actions
    createCampaign,
    updateCampaign,

    // Achievement actions
    createAchievement,

    // Analytics
    getAtRiskCustomers,
    getVIPCustomers,
    getCustomersByTier,

    // Refresh
    refetch: fetchData,
  };
};
