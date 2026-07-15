import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { qk } from '@/lib/queryKeys';

export interface POSDiscount {
  id: string;
  user_id: string;
  name: string;
  discount_type: 'percent' | 'fixed';
  value: number;
  min_order_value: number;
  max_discount_amount: number | null;
  requires_authorization: boolean;
  authorization_code?: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  usage_count: number;
}

export const usePOSDiscounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: discounts = [], isLoading: loading } = useQuery({
    queryKey: qk.pos.discounts(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<POSDiscount[]> => {
      const { data, error } = await supabase
        .from('pos_discounts')
        .select('id, user_id, name, discount_type, value, min_order_value, max_discount_amount, requires_authorization, is_active, valid_from, valid_until, usage_count, created_at, updated_at')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as POSDiscount[];
    },
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.pos.discounts(user?.id) }),
    [queryClient, user?.id]
  );

  const createDiscount = async (discountData: {
    name: string;
    discount_type: 'percent' | 'fixed';
    value: number;
    min_order_value?: number;
    max_discount_amount?: number;
    requires_authorization?: boolean;
    authorization_code?: string;
    valid_from?: string;
    valid_until?: string;
  }) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('pos_discounts')
        .insert({
          user_id: user.id,
          ...discountData,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      await invalidate();
      toast({
        title: "Descuento creado",
        description: discountData.name
      });

      return data as POSDiscount;
    } catch (error: any) {
      console.error('Error creating discount:', error);
      toast({
        title: "Error al crear descuento",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const applyDiscount = async (
    discountId: string,
    orderTotal: number,
    authCode?: string
  ): Promise<{ valid: boolean; amount: number; message?: string }> => {
    // B-10: validación server-side (código, mínimo, vigencia, tope, incremento atómico)
    const { data, error } = await (supabase.rpc as any)('validate_pos_discount', {
      p_discount_id: discountId,
      p_auth_code: authCode ?? null,
      p_order_total: orderTotal,
    });
    if (error) {
      return { valid: false, amount: 0, message: error.message };
    }
    const res = (data ?? {}) as { valid?: boolean; amount?: number; message?: string };
    return { valid: !!res.valid, amount: Number(res.amount ?? 0), message: res.message };
  };

  const deleteDiscount = async (discountId: string) => {
    try {
      const { error } = await supabase
        .from('pos_discounts')
        .update({ is_active: false })
        .eq('id', discountId);

      if (error) throw error;

      await invalidate();
      toast({ title: "Descuento eliminado" });
      return true;
    } catch (error: any) {
      console.error('Error deleting discount:', error);
      toast({
        title: "Error al eliminar descuento",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    discounts,
    loading,
    createDiscount,
    applyDiscount,
    deleteDiscount,
    refetch: invalidate
  };
};
