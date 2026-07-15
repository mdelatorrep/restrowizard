import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { qk } from '@/lib/queryKeys';
import type {
  LoyaltyCustomer,
  LoyaltyTier,
  PointsTransaction,
  RewardItem,
  RedeemedReward,
  Achievement,
  CustomerAchievement,
} from '@/components/loyalty-public/loyaltyTypes';

interface PublicLoyaltyData {
  customer: LoyaltyCustomer;
  transactions: PointsTransaction[];
  availableRewards: RewardItem[];
  redeemedRewards: RedeemedReward[];
  achievements: Achievement[];
  unlockedAchievements: CustomerAchievement[];
  allTiers: LoyaltyTier[];
}

// Error centinela para distinguir "perfil no encontrado" del resto.
const NOT_FOUND = 'No se encontró tu perfil de fidelidad. Verifica el código.';

export const usePublicLoyalty = (codigo?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.loyalty.public(codigo),
    enabled: !!codigo,
    queryFn: async (): Promise<PublicLoyaltyData> => {
      const { data: customerData, error: customerError } = await supabase
        .from('loyalty_customers')
        .select(`*, tier:loyalty_tiers(*)`)
        .eq('loyalty_code', codigo!)
        .single();

      if (customerError || !customerData) {
        throw new Error(NOT_FOUND);
      }

      const mapped: LoyaltyCustomer = {
        id: customerData.id,
        customer_name: customerData.customer_name,
        customer_email: customerData.customer_email,
        customer_phone: customerData.customer_phone,
        current_points: customerData.current_points,
        lifetime_points: customerData.lifetime_points,
        total_spent: Number(customerData.total_spent),
        total_orders: customerData.total_orders,
        tier_id: customerData.tier_id,
        loyalty_code: customerData.loyalty_code || '',
        restaurant_name: customerData.restaurant_name || 'Restaurante',
        user_id: customerData.user_id,
        tier: customerData.tier
          ? { ...customerData.tier, benefits: (customerData.tier.benefits as string[]) || [] }
          : null,
      };

      const [tiersRes, txRes, rewardsRes, redeemedRes, achRes, unlockedRes] = await Promise.all([
        supabase.from('loyalty_tiers').select('*').eq('user_id', customerData.user_id).order('min_points', { ascending: true }),
        supabase.from('loyalty_points_transactions').select('*').eq('customer_id', customerData.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('loyalty_rewards_catalog').select('*').eq('user_id', customerData.user_id).eq('is_active', true),
        supabase.from('loyalty_rewards').select(`*, reward:loyalty_rewards_catalog(name, reward_type, reward_value)`).eq('customer_id', customerData.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('loyalty_achievements').select('*').eq('user_id', customerData.user_id).eq('is_active', true).order('threshold', { ascending: true }),
        supabase.from('loyalty_customer_achievements').select('*').eq('customer_id', customerData.id),
      ]);

      const allTiers = (tiersRes.data || []).map(t => ({ ...t, benefits: (t.benefits as string[]) || [] })) as LoyaltyTier[];
      const transactions = (txRes.data || []) as PointsTransaction[];

      const availableRewards = (rewardsRes.data || [])
        .filter(r => !r.min_tier_id || r.min_tier_id === customerData.tier_id)
        .map(r => ({
          id: r.id, name: r.name, description: r.description,
          points_required: r.points_required, reward_type: r.reward_type,
          reward_value: Number(r.reward_value), is_active: r.is_active,
          min_tier_id: r.min_tier_id,
        })) as RewardItem[];

      const redeemedRewards = (redeemedRes.data || []).map((r: any) => ({
        id: r.id, status: r.status, redeemed_at: r.redeemed_at,
        expires_at: r.expires_at, redemption_code: r.redemption_code,
        reward: r.reward ? { name: r.reward.name, reward_type: r.reward.reward_type, reward_value: Number(r.reward.reward_value) } : null,
      })) as RedeemedReward[];

      const achievements = (achRes.data || []) as Achievement[];
      const unlockedAchievements = (unlockedRes.data || []) as CustomerAchievement[];

      return { customer: mapped, transactions, availableRewards, redeemedRewards, achievements, unlockedAchievements, allTiers };
    },
  });

  const data = query.data;
  const error = query.error
    ? ((query.error as Error).message === NOT_FOUND ? NOT_FOUND : 'Error al cargar los datos. Intenta de nuevo.')
    : null;

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.loyalty.public(codigo) }),
    [queryClient, codigo]
  );

  const redeemReward = async (reward: RewardItem) => {
    const customer = data?.customer;
    if (!customer) return null;
    const redemptionCode = `RW${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    try {
      const { data: rewardData, error: rewardError } = await supabase
        .from('loyalty_rewards')
        .insert({
          user_id: customer.user_id,
          customer_id: customer.id,
          catalog_item_id: reward.id,
          points_spent: reward.points_required,
          redemption_code: redemptionCode,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        }).select().single();
      if (rewardError) throw rewardError;

      const newPoints = customer.current_points - reward.points_required;
      const { error: updateError } = await supabase
        .from('loyalty_customers').update({ current_points: newPoints }).eq('id', customer.id);
      if (updateError) throw updateError;

      await supabase.from('loyalty_points_transactions').insert({
        user_id: customer.user_id,
        customer_id: customer.id,
        points: -reward.points_required,
        transaction_type: 'redeem',
        source: 'reward_redemption',
        source_id: rewardData.id,
        description: `Canje: ${reward.name}`,
        balance_after: newPoints,
      });

      await refresh();
      return { code: redemptionCode, expiresAt: expiresAt.toISOString() };
    } catch (err) {
      console.error('Error redeeming reward:', err);
      toast({ title: 'Error', description: 'No se pudo canjear la recompensa.', variant: 'destructive' });
      return null;
    }
  };

  return {
    customer: data?.customer ?? null,
    transactions: data?.transactions ?? [],
    availableRewards: data?.availableRewards ?? [],
    redeemedRewards: data?.redeemedRewards ?? [],
    achievements: data?.achievements ?? [],
    unlockedAchievements: data?.unlockedAchievements ?? [],
    allTiers: data?.allTiers ?? [],
    loading: query.isLoading,
    error,
    redeemReward,
    refresh,
  };
};
