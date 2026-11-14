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
      // Todo pasa por la RPC public_loyalty_profile: el código de lealtad es la
      // llave, y el navegador ya no lee ni escribe las tablas de lealtad.
      const { data: raw, error: rpcError } = await (supabase as any).rpc('public_loyalty_profile', {
        p_code: codigo!,
      });
      if (rpcError) throw rpcError;
      if (!raw?.customer) throw new Error(NOT_FOUND);

      const c = raw.customer;
      const toTier = (t: any): LoyaltyTier => ({ ...t, benefits: (t?.benefits as string[]) || [] });
      const mapped: LoyaltyCustomer = {
        id: c.id,
        customer_name: c.customer_name,
        customer_email: c.customer_email,
        customer_phone: c.customer_phone,
        current_points: Number(c.current_points) || 0,
        lifetime_points: Number(c.lifetime_points) || 0,
        total_spent: Number(c.total_spent) || 0,
        total_orders: Number(c.total_orders) || 0,
        tier_id: c.tier_id,
        loyalty_code: c.loyalty_code || '',
        restaurant_name: c.restaurant_name || 'Restaurante',
        user_id: c.user_id,
        tier: c.tier ? toTier(c.tier) : null,
      };

      const availableRewards = ((raw.catalog || []) as any[]).map(r => ({
        id: r.id, name: r.name, description: r.description,
        points_required: r.points_required, reward_type: r.reward_type,
        reward_value: Number(r.reward_value), is_active: r.is_active,
        min_tier_id: r.min_tier_id,
      })) as RewardItem[];

      const redeemedRewards = ((raw.redeemed || []) as any[]).map(r => ({
        id: r.id, status: r.status, redeemed_at: r.redeemed_at,
        expires_at: r.expires_at, redemption_code: r.redemption_code,
        reward: r.reward
          ? { name: r.reward.name, reward_type: r.reward.reward_type, reward_value: Number(r.reward.reward_value) }
          : null,
      })) as RedeemedReward[];

      return {
        customer: mapped,
        transactions: (raw.transactions || []) as PointsTransaction[],
        availableRewards,
        redeemedRewards,
        achievements: (raw.achievements || []) as Achievement[],
        unlockedAchievements: (raw.unlocked || []) as CustomerAchievement[],
        allTiers: ((raw.allTiers || []) as any[]).map(toTier),
      };
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
    try {
      // Canje atómico en la base: valida puntos, nivel, vigencia y existencias.
      const { data: res, error } = await (supabase as any).rpc('public_loyalty_redeem', {
        p_code: customer.loyalty_code,
        p_catalog_item_id: reward.id,
      });
      if (error) throw error;
      if (!res?.ok) {
        toast({ title: 'No se pudo canjear', description: res?.message ?? 'Intenta de nuevo.', variant: 'destructive' });
        return null;
      }
      await refresh();
      return { code: res.redemption_code as string, expiresAt: res.expires_at as string };
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
