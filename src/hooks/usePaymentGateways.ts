import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { qk } from '@/lib/queryKeys';

export interface PaymentGatewayCredential {
  id: string;
  user_id: string;
  gateway: 'wompi' | 'bold' | 'mercadopago' | 'epayco';
  public_key: string | null;
  private_key: string | null;
  is_sandbox: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  reference?: string;
  status?: string;
  message?: string;
  error?: string;
}

export const usePaymentGateways = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);

  const { data: credentials = [], isLoading: loading } = useQuery({
    queryKey: qk.payments.gateways(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<PaymentGatewayCredential[]> => {
      const { data, error } = await supabase
        .from('payment_gateway_credentials')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data || []) as PaymentGatewayCredential[];
    },
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.payments.gateways(user?.id) }),
    [queryClient, user?.id]
  );

  const saveCredentials = async (
    gateway: PaymentGatewayCredential['gateway'],
    publicKey: string,
    privateKey: string,
    isSandbox: boolean = true
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('payment_gateway_credentials')
        .upsert({
          user_id: user.id,
          gateway,
          public_key: publicKey,
          private_key: privateKey,
          is_sandbox: isSandbox,
          is_active: true
        }, {
          onConflict: 'user_id,gateway'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Credenciales de ${gateway} guardadas`);
      await invalidate();
      return data;
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Error al guardar credenciales');
      return null;
    }
  };

  const toggleGateway = async (gateway: PaymentGatewayCredential['gateway'], isActive: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('payment_gateway_credentials')
        .update({ is_active: isActive })
        .eq('user_id', user.id)
        .eq('gateway', gateway);

      if (error) throw error;

      toast.success(`${gateway} ${isActive ? 'activado' : 'desactivado'}`);
      await invalidate();
    } catch (error) {
      console.error('Error toggling gateway:', error);
      toast.error('Error al actualizar pasarela');
    }
  };

  const deleteCredentials = async (gateway: PaymentGatewayCredential['gateway']) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('payment_gateway_credentials')
        .delete()
        .eq('user_id', user.id)
        .eq('gateway', gateway);

      if (error) throw error;

      toast.success(`Credenciales de ${gateway} eliminadas`);
      await invalidate();
    } catch (error) {
      console.error('Error deleting credentials:', error);
      toast.error('Error al eliminar credenciales');
    }
  };

  // Process payment through edge function
  const processPayment = async (
    gateway: PaymentGatewayCredential['gateway'],
    amount: number,
    currency: string = 'COP',
    paymentMethod: string,
    customerEmail?: string,
    customerName?: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResult> => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('pos-payment-processor', {
        body: {
          gateway,
          amount,
          currency,
          payment_method: paymentMethod,
          customer_email: customerEmail,
          customer_name: customerName,
          description,
          metadata
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Pago procesado exitosamente');
      } else {
        toast.error(data.error || 'Error en el pago');
      }

      return data;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Error al procesar el pago');
      return { success: false, error: error.message };
    } finally {
      setProcessing(false);
    }
  };

  // Create payment link (for QR payments)
  const createPaymentLink = async (
    gateway: PaymentGatewayCredential['gateway'],
    amount: number,
    description: string,
    expiresIn?: number // minutes
  ): Promise<{ success: boolean; url?: string; qrCode?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('pos-payment-processor', {
        body: {
          action: 'create_payment_link',
          gateway,
          amount,
          description,
          expires_in: expiresIn
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      return { success: false, error: error.message };
    }
  };

  const getActiveGateways = () => credentials.filter(c => c.is_active);

  const hasGateway = (gateway: PaymentGatewayCredential['gateway']) =>
    credentials.some(c => c.gateway === gateway && c.is_active);

  return {
    credentials,
    loading,
    processing,
    saveCredentials,
    toggleGateway,
    deleteCredentials,
    processPayment,
    createPaymentLink,
    getActiveGateways,
    hasGateway,
    refetch: invalidate
  };
};
