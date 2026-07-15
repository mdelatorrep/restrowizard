import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { qk } from '@/lib/queryKeys';

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
  const queryClient = useQueryClient();

  const { data: currentSession = null, isLoading: loading } = useQuery({
    queryKey: qk.pos.session(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<POSSession | null> => {
      const { data, error } = await supabase
        .from('pos_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as POSSession | null) ?? null;
    },
  });

  const { data: cashMovements = [] } = useQuery({
    queryKey: qk.pos.cashMovements(currentSession?.id),
    enabled: !!currentSession?.id,
    queryFn: async (): Promise<CashMovement[]> => {
      const { data, error } = await supabase
        .from('pos_cash_movements')
        .select('*')
        .eq('session_id', currentSession!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CashMovement[];
    },
  });

  const refetch = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.pos.session(user?.id) }),
    [queryClient, user?.id]
  );

  // P2-9: otras instancias de usePOSSession (p.ej. la página del POS) piden refresco.
  useEffect(() => {
    const onRefresh = () => { refetch(); };
    window.addEventListener('pos-session:refresh', onRefresh);
    return () => window.removeEventListener('pos-session:refresh', onRefresh);
  }, [refetch]);

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

      await refetch();
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
      // B-01/B-02: cierre server-authoritative (efectivo esperado = apertura + solo ventas en efectivo, por sesión)
      const { data, error } = await (supabase.rpc as any)('pos_close_session', {
        p_session_id: currentSession.id,
        p_actual_cash: actualCash,
        p_notes: notes ?? null,
      });

      if (error) throw error;
      const closed = (Array.isArray(data) ? data[0] : data) as POSSession;
      const difference = Number(closed?.difference ?? (actualCash - Number(closed?.expected_cash ?? actualCash)));

      await refetch();

      const diffText = difference >= 0 ? `+$${difference.toLocaleString()}` : `-$${Math.abs(difference).toLocaleString()}`;
      toast({
        title: "Caja cerrada",
        description: `Diferencia: ${diffText}`
      });

      return closed;
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

      await queryClient.invalidateQueries({ queryKey: qk.pos.cashMovements(currentSession.id) });

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
      // OJO (deuda conocida): read-modify-write. Con dos terminales sobre la misma
      // sesión se pueden perder incrementos. El cuadre de caja NO depende de esto
      // (B-01/B-02 lo recalcula server-side desde pos_transactions); estos campos
      // son informativos. Fix pendiente: RPC con incremento atómico.
      const { error } = await supabase
        .from('pos_sessions')
        .update({
          sales_count: currentSession.sales_count + 1,
          total_sales: Number(currentSession.total_sales) + saleAmount,
          total_tips: Number(currentSession.total_tips) + tipAmount
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      // P2-9: notify other usePOSSession instances (e.g. POS page) to refresh
      window.dispatchEvent(new CustomEvent('pos-session:refresh'));
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  };

  return {
    currentSession,
    cashMovements,
    loading,
    hasOpenSession: !!currentSession,
    openSession,
    closeSession,
    addCashMovement,
    updateSessionStats,
    refetch
  };
};
