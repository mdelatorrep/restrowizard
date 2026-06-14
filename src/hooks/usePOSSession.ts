import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface POSSession {
  id: string;
  user_id: string;
  cashier_name: string;
  terminal_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  closing_cash: number | null;
  expected_cash: number | null;
  actual_cash: number | null;
  difference: number | null;
  status: 'open' | 'closed' | 'suspended';
  notes: string | null;
  sales_count: number;
  total_sales: number;
  total_tips: number;
}

export interface CashMovement {
  id: string;
  session_id: string;
  movement_type: 'deposit' | 'withdrawal' | 'adjustment';
  amount: number;
  reason: string | null;
  authorized_by: string | null;
  created_at: string;
}

export const usePOSSession = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<POSSession | null>(null);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentSession = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pos_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      setCurrentSession(data as POSSession | null);

      if (data) {
        const { data: movements, error: movError } = await supabase
          .from('pos_cash_movements')
          .select('*')
          .eq('session_id', data.id)
          .order('created_at', { ascending: false });

        if (!movError) {
          setCashMovements(movements as CashMovement[]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching POS session:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const openSession = async (cashierName: string, openingCash: number, terminalId: string = 'main') => {
    if (!user?.id) return null;

    // Check if there's already an open session
    if (currentSession) {
      toast({
        title: "Sesión activa",
        description: "Ya existe una sesión de caja abierta. Ciérrela primero.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('pos_sessions')
        .insert({
          user_id: user.id,
          cashier_name: cashierName,
          terminal_id: terminalId,
          opening_cash: openingCash,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data as POSSession);
      toast({
        title: "Caja abierta",
        description: `Sesión iniciada con $${openingCash.toLocaleString()} en efectivo`
      });

      return data as POSSession;
    } catch (error: any) {
      console.error('Error opening session:', error);
      toast({
        title: "Error al abrir caja",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const closeSession = async (actualCash: number, notes?: string) => {
    if (!currentSession) {
      toast({
        title: "Sin sesión activa",
        description: "No hay una sesión de caja abierta",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Calculate expected cash
      const cashSales = await supabase
        .from('pos_transactions')
        .select('amount, transaction_type')
        .eq('session_id', currentSession.id)
        .in('transaction_type', ['sale', 'refund', 'cash_in', 'cash_out']);

      let expectedCash = currentSession.opening_cash;
      
      if (cashSales.data) {
        for (const tx of cashSales.data) {
          if (tx.transaction_type === 'sale' || tx.transaction_type === 'cash_in') {
            expectedCash += Number(tx.amount);
          } else if (tx.transaction_type === 'refund' || tx.transaction_type === 'cash_out') {
            expectedCash -= Number(tx.amount);
          }
        }
      }

      // Add cash movements
      for (const movement of cashMovements) {
        if (movement.movement_type === 'deposit') {
          expectedCash += movement.amount;
        } else if (movement.movement_type === 'withdrawal') {
          expectedCash -= movement.amount;
        }
      }

      const difference = actualCash - expectedCash;

      const { data, error } = await supabase
        .from('pos_sessions')
        .update({
          closed_at: new Date().toISOString(),
          closing_cash: actualCash,
          expected_cash: expectedCash,
          actual_cash: actualCash,
          difference: difference,
          status: 'closed',
          notes: notes
        })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(null);
      setCashMovements([]);

      const diffText = difference >= 0 ? `+$${difference.toLocaleString()}` : `-$${Math.abs(difference).toLocaleString()}`;
      toast({
        title: "Caja cerrada",
        description: `Diferencia: ${diffText}`
      });

      return data as POSSession;
    } catch (error: any) {
      console.error('Error closing session:', error);
      toast({
        title: "Error al cerrar caja",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const addCashMovement = async (
    type: 'deposit' | 'withdrawal' | 'adjustment',
    amount: number,
    reason?: string,
    authorizedBy?: string
  ) => {
    if (!currentSession) {
      toast({
        title: "Sin sesión activa",
        description: "Abra una caja primero",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('pos_cash_movements')
        .insert({
          session_id: currentSession.id,
          movement_type: type,
          amount: amount,
          reason: reason,
          authorized_by: authorizedBy
        })
        .select()
        .single();

      if (error) throw error;

      setCashMovements(prev => [data as CashMovement, ...prev]);
      
      const typeLabels = {
        deposit: 'Depósito',
        withdrawal: 'Retiro',
        adjustment: 'Ajuste'
      };

      toast({
        title: `${typeLabels[type]} registrado`,
        description: `$${amount.toLocaleString()}`
      });

      return data as CashMovement;
    } catch (error: any) {
      console.error('Error adding cash movement:', error);
      toast({
        title: "Error al registrar movimiento",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateSessionStats = async (saleAmount: number, tipAmount: number = 0) => {
    if (!currentSession) return;

    try {
      const { error } = await supabase
        .from('pos_sessions')
        .update({
          sales_count: currentSession.sales_count + 1,
          total_sales: Number(currentSession.total_sales) + saleAmount,
          total_tips: Number(currentSession.total_tips) + tipAmount
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      setCurrentSession(prev => prev ? {
        ...prev,
        sales_count: prev.sales_count + 1,
        total_sales: Number(prev.total_sales) + saleAmount,
        total_tips: Number(prev.total_tips) + tipAmount
      } : null);

      // P2-9: notify other usePOSSession instances (e.g. POS page) to refresh
      window.dispatchEvent(new CustomEvent('pos-session:refresh'));
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  };

  useEffect(() => {
    fetchCurrentSession();
    const onRefresh = () => fetchCurrentSession();
    window.addEventListener('pos-session:refresh', onRefresh);
    return () => window.removeEventListener('pos-session:refresh', onRefresh);
  }, [fetchCurrentSession]);

  return {
    currentSession,
    cashMovements,
    loading,
    hasOpenSession: !!currentSession,
    openSession,
    closeSession,
    addCashMovement,
    updateSessionStats,
    refetch: fetchCurrentSession
  };
};
