import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { usePOSSession } from './usePOSSession';

export interface PaymentMethod {
  id: string;
  user_id: string;
  method_name: string;
  method_type: 'cash' | 'card' | 'digital_wallet' | 'transfer' | 'qr' | 'credit';
  provider: string | null;
  is_active: boolean;
  requires_reference: boolean;
  commission_percent: number;
  icon: string | null;
  display_order: number;
}

export interface PaymentSplit {
  method_id: string;
  method_name: string;
  amount: number;
  reference?: string;
}

export interface POSTransaction {
  id: string;
  session_id: string;
  order_id: string | null;
  transaction_type: 'sale' | 'refund' | 'void' | 'tip' | 'cash_in' | 'cash_out';
  payment_method_id: string | null;
  payment_method_name: string | null;
  amount: number;
  reference_number: string | null;
  tip_amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  processed_at: string;
}

export const usePOSPayment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentSession, updateSessionStats } = usePOSSession();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchPaymentMethods = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pos_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      // If no methods exist, create defaults
      if (!data || data.length === 0) {
        await createDefaultPaymentMethods();
        return;
      }

      setPaymentMethods(data as PaymentMethod[]);
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPaymentMethods = async () => {
    if (!user?.id) return;

    const defaults = [
      { method_name: 'Efectivo', method_type: 'cash', provider: 'manual', icon: 'banknote', display_order: 1 },
      { method_name: 'Tarjeta Débito', method_type: 'card', provider: 'manual', icon: 'credit-card', display_order: 2 },
      { method_name: 'Tarjeta Crédito', method_type: 'card', provider: 'manual', icon: 'credit-card', display_order: 3 },
      { method_name: 'Nequi', method_type: 'digital_wallet', provider: 'nequi', icon: 'smartphone', display_order: 4 },
      { method_name: 'Daviplata', method_type: 'digital_wallet', provider: 'daviplata', icon: 'smartphone', display_order: 5 },
      { method_name: 'Transferencia', method_type: 'transfer', provider: 'manual', icon: 'arrow-right-left', display_order: 6 },
    ];

    try {
      const { data, error } = await supabase
        .from('pos_payment_methods')
        .insert(defaults.map(m => ({
          ...m,
          user_id: user.id,
          is_active: true,
          requires_reference: m.method_type !== 'cash'
        })))
        .select();

      if (error) throw error;
      setPaymentMethods(data as PaymentMethod[]);
    } catch (error) {
      console.error('Error creating default payment methods:', error);
    }
  };

  const processPayment = async (
    orderId: string,
    payments: PaymentSplit[],
    tipAmount: number = 0
  ): Promise<POSTransaction[] | null> => {
    if (!currentSession) {
      toast({
        title: "Sin sesión activa",
        description: "Debe abrir caja para procesar pagos",
        variant: "destructive"
      });
      return null;
    }

    setProcessing(true);

    try {
      const transactions: POSTransaction[] = [];
      let totalPaid = 0;

      for (const payment of payments) {
        const { data, error } = await supabase
          .from('pos_transactions')
          .insert({
            session_id: currentSession.id,
            order_id: orderId,
            transaction_type: 'sale',
            payment_method_id: payment.method_id,
            payment_method_name: payment.method_name,
            amount: payment.amount,
            reference_number: payment.reference,
            tip_amount: tipAmount / payments.length, // Distribute tip
            status: 'completed',
            processed_by: currentSession.cashier_name
          })
          .select()
          .single();

        if (error) throw error;
        transactions.push(data as POSTransaction);
        totalPaid += payment.amount;
      }

      // Update session stats
      await updateSessionStats(totalPaid, tipAmount);

      toast({
        title: "Pago procesado",
        description: `Total: $${totalPaid.toLocaleString()}`
      });

      return transactions;
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error al procesar pago",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const processRefund = async (
    orderId: string,
    amount: number,
    paymentMethodId: string,
    reason?: string
  ): Promise<POSTransaction | null> => {
    if (!currentSession) {
      toast({
        title: "Sin sesión activa",
        description: "Debe abrir caja para procesar devoluciones",
        variant: "destructive"
      });
      return null;
    }

    setProcessing(true);

    try {
      const method = paymentMethods.find(m => m.id === paymentMethodId);

      const { data, error } = await supabase
        .from('pos_transactions')
        .insert({
          session_id: currentSession.id,
          order_id: orderId,
          transaction_type: 'refund',
          payment_method_id: paymentMethodId,
          payment_method_name: method?.method_name,
          amount: amount,
          status: 'completed',
          processed_by: currentSession.cashier_name,
          notes: reason
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Devolución procesada",
        description: `$${amount.toLocaleString()} devueltos`
      });

      return data as POSTransaction;
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error al procesar devolución",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const calculateChange = (totalDue: number, cashReceived: number): number => {
    return Math.max(0, cashReceived - totalDue);
  };

  const addPaymentMethod = async (method: Omit<PaymentMethod, 'id' | 'user_id'>) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('pos_payment_methods')
        .insert({
          ...method,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setPaymentMethods(prev => [...prev, data as PaymentMethod]);
      toast({
        title: "Método de pago agregado"
      });

      return data as PaymentMethod;
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Error al agregar método",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  // Initialize on mount
  useState(() => {
    fetchPaymentMethods();
  });

  return {
    paymentMethods,
    loading,
    processing,
    processPayment,
    processRefund,
    calculateChange,
    addPaymentMethod,
    refetch: fetchPaymentMethods
  };
};
