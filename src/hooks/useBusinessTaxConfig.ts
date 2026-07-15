import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { qk } from '@/lib/queryKeys';

export interface TaxConfig {
  type: 'iva' | 'impoconsumo' | 'exento';
  rate: number;
  included_in_price: boolean;
  label: string;
}

const DEFAULT_TAX: TaxConfig = { type: 'exento', rate: 0, included_in_price: false, label: 'Exento' };

export const useBusinessTaxConfig = () => {
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.business.taxConfig(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_businesses')
        .select('id, tax_config, allow_oversell')
        .eq('owner_id', userId!)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error || !data) return { taxConfig: DEFAULT_TAX, allowOversell: true, businessId: null as string | null };
      const cfg = (data as any).tax_config as Partial<TaxConfig> | null;
      const taxConfig: TaxConfig = cfg
        ? {
            type: (cfg.type as TaxConfig['type']) || 'exento',
            rate: Number(cfg.rate ?? 0),
            included_in_price: !!cfg.included_in_price,
            label: cfg.label || 'Exento',
          }
        : DEFAULT_TAX;
      return { taxConfig, allowOversell: (data as any).allow_oversell !== false, businessId: data.id };
    },
  });

  const businessId = data?.businessId ?? null;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.business.taxConfig(userId) });

  const saveTaxConfig = async (next: TaxConfig) => {
    if (!businessId) return false;
    const { error } = await supabase.from('restaurant_businesses').update({ tax_config: next as any }).eq('id', businessId);
    if (!error) await invalidate();
    return !error;
  };

  const saveAllowOversell = async (val: boolean) => {
    if (!businessId) return false;
    const { error } = await supabase.from('restaurant_businesses').update({ allow_oversell: val } as any).eq('id', businessId);
    if (!error) await invalidate();
    return !error;
  };

  return {
    taxConfig: data?.taxConfig ?? DEFAULT_TAX,
    allowOversell: data?.allowOversell ?? true,
    loading: isLoading,
    businessId,
    saveTaxConfig,
    saveAllowOversell,
  };
};
