import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  LoyaltyCustomer,
  LoyaltyTier,
  PointsTransaction,
  RewardItem,
  RedeemedReward,
  Achievement,
  CustomerAchievement,
} from '@/components/loyalty-public/loyaltyTypes';

export const usePublicLoyalty = (codigo?: string) => {
  const { toast } = useToast();
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [availableRewards, setAvailableRewards] = useState<RewardItem[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<CustomerAchievement[]>([]);
  const [allTiers, setAllTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerData = useCallback(async () => {
    if (!codigo) return;
    try {
      setLoading(true);
      setError(null);

      const { data: customerData, error: customerError } = await supabase
        .from('loyalty_customers')
        .select(`*, tier:loyalty_tiers(*)`)
        .eq('loyalty_code', codigo)
        .single();

      if (customerError || !customerData) {
        setError('No se encontró tu perfil de fidelidad. Verifica el código.');
        setLoading(false);
        return;
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
      setCustomer(mapped);

      const [tiersRes, txRes, rewardsRes, redeemedRes, achRes, unlockedRes] = await Promise.all([
        supabase.from('loyalty_tiers').select('*').eq('user_id', customerData.user_id).order('min_points', { ascending: true }),
        supabase.from('loyalty_points_transactions').select('*').eq('customer_id', customerData.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('loyalty_rewards_catalog').select('*').eq('user_id', customerData.user_id).eq('is_active', true),
        supabase.from('loyalty_rewards').select(`*, reward:loyalty_rewards_catalog(name, reward_type, reward_value)`).eq('customer_id', customerData.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('loyalty_achievements').select('*').eq('user_id', customerData.user_id).eq('is_active', true).order('threshold', { ascending: true }),
        supabase.from('loyalty_customer_achievements').select('*').eq('customer_id', customerData.id),
      ]);

      if (tiersRes.data) setAllTiers(tiersRes.data.map(t => ({ ...t, benefits: (t.benefits as string[]) || [] })));
      if (txRes.data) setTransactions(txRes.data as PointsTransaction[]);
      if (rewardsRes.data) {
        const filtered = rewardsRes.data.filter(r => !r.min_tier_id || r.min_tier_id === customerData.tier_id);
        setAvailableRewards(filtered.map(r => ({
          id: r.id, name: r.name, description: r.description,
          points_required: r.points_required, reward_type: r.reward_type,
          reward_value: Number(r.reward_value), is_active: r.is_active,
          min_tier_id: r.min_tier_id,
        })));
      }
      if (redeemedRes.data) {
        setRedeemedRewards(redeemedRes.data.map((r: any) => ({
          id: r.id, status: r.status, redeemed_at: r.redeemed_at,
          expires_at: r.expires_at, redemption_code: r.redemption_code,
          reward: r.reward ? { name: r.reward.name, reward_type: r.reward.reward_type, reward_value: Number(r.reward.reward_value) } : null,
        })));
      }
      if (achRes.data) setAchievements(achRes.data as Achievement[]);
      if (unlockedRes.data) setUnlockedAchievements(unlockedRes.data as CustomerAchievement[]);
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
      setError('Error al cargar los datos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [codigo]);

  useEffect(() => { fetchCustomerData(); }, [fetchCustomerData]);

  const redeemReward = async (reward: RewardItem) => {
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

      setCustomer(prev => prev ? { ...prev, current_points: newPoints } : null);
      fetchCustomerData();
      return { code: redemptionCode, expiresAt: expiresAt.toISOString() };
    } catch (err) {
      console.error('Error redeeming reward:', err);
      toast({ title: 'Error', description: 'No se pudo canjear la recompensa.', variant: 'destructive' });
      return null;
    }
  };

  return {
    customer, transactions, availableRewards, redeemedRewards,
    achievements, unlockedAchievements, allTiers, loading, error,
    redeemReward, refresh: fetchCustomerData,
  };
};
