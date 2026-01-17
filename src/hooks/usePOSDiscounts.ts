import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface POSDiscount {
  id: string;
  user_id: string;
  name: string;
  discount_type: 'percent' | 'fixed';
  value: number;
  min_order_value: number;
  max_discount_amount: number | null;
  requires_authorization: boolean;
  authorization_code: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  usage_count: number;
}

export const usePOSDiscounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<POSDiscount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDiscounts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pos_discounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDiscounts((data || []) as POSDiscount[]);
    } catch (error: any) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

      setDiscounts(prev => [...prev, data as POSDiscount]);
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
    const discount = discounts.find(d => d.id === discountId);
    
    if (!discount) {
      return { valid: false, amount: 0, message: "Descuento no encontrado" };
    }

    // Check authorization
    if (discount.requires_authorization) {
      if (!authCode || authCode !== discount.authorization_code) {
        return { valid: false, amount: 0, message: "Código de autorización inválido" };
      }
    }

    // Check min order value
    if (orderTotal < discount.min_order_value) {
      return { 
        valid: false, 
        amount: 0, 
        message: `Pedido mínimo: $${discount.min_order_value.toLocaleString()}` 
      };
    }

    // Check validity dates
    const now = new Date();
    if (discount.valid_from && new Date(discount.valid_from) > now) {
      return { valid: false, amount: 0, message: "Descuento aún no válido" };
    }
    if (discount.valid_until && new Date(discount.valid_until) < now) {
      return { valid: false, amount: 0, message: "Descuento expirado" };
    }

    // Calculate discount amount
    let amount = discount.discount_type === 'percent' 
      ? orderTotal * (discount.value / 100)
      : discount.value;

    // Apply max discount cap
    if (discount.max_discount_amount && amount > discount.max_discount_amount) {
      amount = discount.max_discount_amount;
    }

    // Increment usage count
    await supabase
      .from('pos_discounts')
      .update({ usage_count: discount.usage_count + 1 })
      .eq('id', discountId);

    return { valid: true, amount };
  };

  const deleteDiscount = async (discountId: string) => {
    try {
      const { error } = await supabase
        .from('pos_discounts')
        .update({ is_active: false })
        .eq('id', discountId);

      if (error) throw error;

      setDiscounts(prev => prev.filter(d => d.id !== discountId));
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

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  return {
    discounts,
    loading,
    createDiscount,
    applyDiscount,
    deleteDiscount,
    refetch: fetchDiscounts
  };
};
