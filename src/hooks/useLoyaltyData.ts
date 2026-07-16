import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useDataUserId } from './useDataUserId';
import { qk } from '@/lib/queryKeys';
import type { Json } from '@/integrations/supabase/types';
import {
  fetchLoyaltyData,
  type LoyaltyData,
  type LoyaltyTier,
  type LoyaltyCustomer,
  type RewardsCatalogItem,
  type LoyaltyCampaign,
  type LoyaltyAchievement,
} from './loyalty/loyaltyData';

// B-31: tipos, carga y KPIs viven en ./loyalty/loyaltyData.
export type {
  LoyaltyTier, LoyaltyCustomer, PointsTransaction, RewardsCatalogItem,
  LoyaltyCampaign, LoyaltyReward, LoyaltyAchievement, LoyaltyKPIs,
} from './loyalty/loyaltyData';

const EMPTY: LoyaltyData = {
  tiers: [], customers: [], catalog: [], campaigns: [], achievements: [],
  kpis: {
    totalCustomers: 0, activeCustomers: 0, totalPointsCirculating: 0, avgLTV: 0,
    atRiskCustomers: 0, retentionRate: 0, avgPointsPerCustomer: 0, redemptionRate: 0,
  },
};

export const useLoyaltyData = () => {
  const { toast } = useToast();
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();

  const { data = EMPTY, isLoading: loading } = useQuery({
    queryKey: qk.loyalty.customers(userId),
    enabled: !!userId,
    queryFn: async () => {
      try {
        return await fetchLoyaltyData(userId!);
      } catch (error) {
        console.error('Error fetching loyalty data:', error);
        throw error;
      }
    },
  });

  const { tiers, customers, catalog, campaigns, achievements, kpis } = data;
  const hasData = customers.length > 0 || tiers.length > 0;

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.loyalty.customers(userId) });
    // El cliente ve su saldo y sus recompensas en la página pública de fidelidad.
    await queryClient.invalidateQueries({ queryKey: ['public-loyalty'] });
  }, [queryClient, userId]);

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
      await refetch();
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
      await refetch();
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
      await refetch();
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
      await refetch();
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
    try {
      // B-42: incremento atómico server-side. Antes se leía el saldo del ESTADO
      // LOCAL, se calculaba saldo+puntos y se escribía ese absoluto: dos cajas
      // otorgando a la vez se pisaban (100 +50 +30 daba 130, no 180) y la base
      // del cálculo podía venir de una caché vieja.
      const { data, error } = await (supabase.rpc as any)('award_loyalty_points', {
        p_customer_id: customerId,
        p_points: points,
        p_source: source,
        p_description: description ?? null,
        p_source_id: sourceId ?? null,
      });
      if (error) throw error;

      const res = (data ?? {}) as { ok?: boolean; message?: string; transaction_id?: string; balance_after?: number };
      if (!res.ok) {
        toast({ title: 'No se pudieron otorgar los puntos', description: res.message || 'Error', variant: 'destructive' });
        return null;
      }

      const customer = customers.find(c => c.id === customerId);
      toast({
        title: 'Puntos otorgados',
        description: `+${points} puntos${customer ? ` para ${customer.customer_name}` : ''}`,
      });
      await refetch();
      return { id: res.transaction_id, balance_after: res.balance_after } as any;
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
      await refetch();
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
      await refetch();
    } catch (error) {
      console.error('Error updating catalog item:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar la recompensa', variant: 'destructive' });
    }
  };

  // === REDEMPTIONS ===
  const redeemReward = async (customerId: string, catalogItemId: string) => {
    if (!userId) return null;

    try {
      // B-22: canje atómico server-side (valida puntos, stock y vigencia; sin race conditions)
      const { data, error } = await (supabase.rpc as any)('redeem_loyalty_reward', {
        p_customer_id: customerId,
        p_catalog_item_id: catalogItemId,
      });
      if (error) throw error;
      const res = (data ?? {}) as { ok?: boolean; message?: string; redemption_code?: string; reward_id?: string };
      if (!res.ok) {
        toast({ title: 'No se pudo canjear', description: res.message || 'Error', variant: 'destructive' });
        return null;
      }
      toast({ title: 'Recompensa canjeada', description: `Código: ${res.redemption_code}` });
      await refetch();
      return { id: res.reward_id, redemption_code: res.redemption_code } as any;
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
      await refetch();
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
      await refetch();
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
      await refetch();
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
    refetch,
  };
};
