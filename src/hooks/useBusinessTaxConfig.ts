import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';

export interface TaxConfig {
  type: 'iva' | 'impoconsumo' | 'exento';
  rate: number; // 0..1
  included_in_price: boolean;
  label: string;
}

const DEFAULT_TAX: TaxConfig = {
  type: 'exento',
  rate: 0,
  included_in_price: false,
  label: 'Exento',
};

export const useBusinessTaxConfig = () => {
  const { userId } = useDataUserId();
  const [taxConfig, setTaxConfig] = useState<TaxConfig>(DEFAULT_TAX);
  const [allowOversell, setAllowOversell] = useState<boolean>(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchConfig = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('restaurant_businesses')
        .select('id, tax_config, allow_oversell')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) {
        setBusinessId(data.id);
        const cfg = (data as any).tax_config as Partial<TaxConfig> | null;
        if (cfg) {
          setTaxConfig({
            type: (cfg.type as TaxConfig['type']) || 'exento',
            rate: Number(cfg.rate ?? 0),
            included_in_price: !!cfg.included_in_price,
            label: cfg.label || 'Exento',
          });
        }
        setAllowOversell((data as any).allow_oversell !== false);
      }
      setLoading(false);
    };
    fetchConfig();
    return () => { cancelled = true; };
  }, [userId]);

  const saveTaxConfig = async (next: TaxConfig) => {
    if (!businessId) return false;
    const { error } = await supabase
      .from('restaurant_businesses')
      .update({ tax_config: next as any })
      .eq('id', businessId);
    if (!error) setTaxConfig(next);
    return !error;
  };

  const saveAllowOversell = async (val: boolean) => {
    if (!businessId) return false;
    const { error } = await supabase
      .from('restaurant_businesses')
      .update({ allow_oversell: val } as any)
      .eq('id', businessId);
    if (!error) setAllowOversell(val);
    return !error;
  };

  return { taxConfig, allowOversell, loading, businessId, saveTaxConfig, saveAllowOversell };
};
