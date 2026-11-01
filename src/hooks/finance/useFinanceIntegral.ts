import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from '@/hooks/useDataUserId';
import { useToast } from '@/hooks/use-toast';
import { qk } from '@/lib/queryKeys';
import { todayBusinessDay } from '@/lib/businessDay';
import {
  buildPayables, DEFAULT_FINANCE_SETTINGS, summarizeAging,
  type CashFlowProjection, type Expense, type FinanceAccount, type FinanceSettings,
  type Reconciliation, type SettlementChannel, type SupplierInvoiceDue,
} from './financeIntegral';

// Tablas y RPCs nuevas aún no están en los tipos generados de Supabase.
const db = supabase as any;

const errMsg = (e: unknown) => (e as { message?: string })?.message || 'Intenta de nuevo';

/** Invalida todo lo financiero: el P&L, la caja y las cuentas dependen unos de otros. */
const useInvalidateFinance = () => {
  const queryClient = useQueryClient();
  const { userId } = useDataUserId();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.financeIntegral.all(userId) });
    queryClient.invalidateQueries({ queryKey: ['finances-aggregated'] });
  }, [queryClient, userId]);
};

// ── Configuración ─────────────────────────────────────────────────────────
export const useFinanceSettings = () => {
  const { userId, isResolved } = useDataUserId();
  const { toast } = useToast();
  const invalidate = useInvalidateFinance();

  const query = useQuery({
    queryKey: qk.financeIntegral.settings(userId),
    enabled: !!userId && isResolved,
    queryFn: async (): Promise<FinanceSettings & { saved: boolean }> => {
      const { data, error } = await db.from('finance_settings').select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data ? { ...DEFAULT_FINANCE_SETTINGS, ...data, saved: true } : { ...DEFAULT_FINANCE_SETTINGS, saved: false };
    },
  });

  const save = useMutation({
    mutationFn: async (values: FinanceSettings) => {
      const { error } = await db.from('finance_settings')
        .upsert({ ...values, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Supuestos guardados' }); },
    onError: (e) => toast({ title: 'No se pudo guardar', description: errMsg(e), variant: 'destructive' }),
  });

  return { settings: query.data ?? { ...DEFAULT_FINANCE_SETTINGS, saved: false }, loading: query.isLoading, save };
};

// ── Cuentas (saldos) ──────────────────────────────────────────────────────
export const useFinanceAccounts = () => {
  const { userId, isResolved } = useDataUserId();
  const { toast } = useToast();
  const invalidate = useInvalidateFinance();

  const query = useQuery({
    queryKey: qk.financeIntegral.accounts(userId),
    enabled: !!userId && isResolved,
    queryFn: async (): Promise<FinanceAccount[]> => {
      const { data, error } = await db.from('finance_accounts').select('*').eq('user_id', userId)
        .eq('is_active', true).order('created_at');
      if (error) throw error;
      return (data || []).map((a: FinanceAccount) => ({ ...a, balance: Number(a.balance) }));
    },
  });

  const upsert = useMutation({
    mutationFn: async (a: Partial<FinanceAccount> & { name: string; balance: number }) => {
      const row = {
        name: a.name.trim(), account_type: a.account_type || 'bank', balance: a.balance,
        balance_as_of: a.balance_as_of || todayBusinessDay(), updated_at: new Date().toISOString(),
      };
      const { error } = a.id
        ? await db.from('finance_accounts').update(row).eq('id', a.id)
        : await db.from('finance_accounts').insert({ ...row, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Saldo actualizado' }); },
    onError: (e) => toast({ title: 'No se pudo guardar la cuenta', description: errMsg(e), variant: 'destructive' }),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('finance_accounts').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const total = useMemo(() => (query.data || []).reduce((s, a) => s + a.balance, 0), [query.data]);
  return { accounts: query.data || [], total, loading: query.isLoading, upsert, archive };
};

// ── Gastos ────────────────────────────────────────────────────────────────
export type ExpenseInput = Omit<Expense, 'id' | 'recurrence_parent' | 'paid_at' | 'payment_method' | 'account_id'> & {
  id?: string;
  paid_at?: string | null;
  payment_method?: string | null;
  account_id?: string | null;
};

export const useExpenses = (month: string /* yyyy-MM */) => {
  const { userId, isResolved } = useDataUserId();
  const { toast } = useToast();
  const invalidate = useInvalidateFinance();

  const query = useQuery({
    queryKey: qk.financeIntegral.expenses(userId, month),
    enabled: !!userId && isResolved,
    queryFn: async (): Promise<Expense[]> => {
      const [y, m] = month.split('-').map(Number);
      const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const { data, error } = await db.from('restaurant_expenses').select('*').eq('user_id', userId)
        .gte('expense_date', `${month}-01`).lte('expense_date', `${month}-${String(last).padStart(2, '0')}`)
        .order('expense_date', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((e: Expense) => ({ ...e, amount: Number(e.amount) }));
    },
  });

  const save = useMutation({
    mutationFn: async (e: ExpenseInput) => {
      const paid = e.status === 'paid';
      const row = {
        expense_date: e.expense_date, category: e.category, description: e.description.trim(),
        vendor: e.vendor?.trim() || null, amount: e.amount, is_fixed: e.is_fixed, status: e.status,
        due_date: e.due_date || null, recurrence: e.recurrence, notes: e.notes?.trim() || null,
        paid_at: paid ? (e.paid_at || todayBusinessDay()) : null,
        payment_method: paid ? (e.payment_method || 'Transferencia') : null,
        account_id: paid ? (e.account_id || null) : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = e.id
        ? await db.from('restaurant_expenses').update(row).eq('id', e.id)
        : await db.from('restaurant_expenses').insert({ ...row, user_id: userId });
      if (error) throw error;
    },
    onSuccess: (_d, e) => { invalidate(); toast({ title: e.id ? 'Gasto actualizado' : 'Gasto registrado' }); },
    onError: (e) => toast({ title: 'No se pudo guardar el gasto', description: errMsg(e), variant: 'destructive' }),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('restaurant_expenses').update({ status: 'cancelled', paid_at: null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Gasto anulado' }); },
    onError: (e) => toast({ title: 'No se pudo anular', description: errMsg(e), variant: 'destructive' }),
  });

  return { expenses: query.data || [], loading: query.isLoading, save, cancel };
};

// ── Cuentas por pagar ─────────────────────────────────────────────────────
export const usePayables = () => {
  const { userId, isResolved } = useDataUserId();
  const { toast } = useToast();
  const invalidate = useInvalidateFinance();
  const { settings } = useFinanceSettings();

  const query = useQuery({
    queryKey: qk.financeIntegral.payables(userId),
    enabled: !!userId && isResolved,
    queryFn: async () => {
      const [inv, exp] = await Promise.all([
        db.from('supplier_invoices')
          .select('id, supplier_name, invoice_number, invoice_date, due_date, total_amount, status')
          .eq('user_id', userId).not('status', 'in', '("paid","rejected","cancelled")').limit(500),
        db.from('restaurant_expenses').select('*').eq('user_id', userId).eq('status', 'pending').limit(500),
      ]);
      if (inv.error) throw inv.error;
      if (exp.error) throw exp.error;
      return { invoices: (inv.data || []) as SupplierInvoiceDue[], expenses: (exp.data || []) as Expense[] };
    },
  });

  const today = todayBusinessDay();
  const payables = useMemo(
    () => (query.data ? buildPayables(query.data.invoices, query.data.expenses, today, settings.supplier_payment_days) : []),
    [query.data, today, settings.supplier_payment_days],
  );
  const aging = useMemo(() => summarizeAging(payables), [payables]);

  const markPaid = useMutation({
    mutationFn: async (p: { source: 'invoice' | 'expense'; id: string; paid_at: string; payment_method: string; account_id?: string | null }) => {
      const table = p.source === 'invoice' ? 'supplier_invoices' : 'restaurant_expenses';
      const { error } = await db.from(table).update({
        status: 'paid', paid_at: p.paid_at, payment_method: p.payment_method, account_id: p.account_id || null,
      }).eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Pago registrado' }); },
    onError: (e) => toast({ title: 'No se pudo registrar el pago', description: errMsg(e), variant: 'destructive' }),
  });

  return { payables, aging, loading: query.isLoading, markPaid };
};

// ── Flujo de caja ─────────────────────────────────────────────────────────
export const useCashFlow = (weeks = 13) => {
  const { userId, isResolved } = useDataUserId();
  const query = useQuery({
    queryKey: qk.financeIntegral.cashFlow(userId, weeks),
    enabled: !!userId && isResolved,
    staleTime: 60_000,
    queryFn: async (): Promise<CashFlowProjection> => {
      const { data, error } = await db.rpc('finance_cash_flow_projection', { p_owner: userId, p_weeks: weeks });
      if (error) throw error;
      return data as CashFlowProjection;
    },
  });
  return { cashFlow: query.data ?? null, loading: query.isLoading, error: query.error as Error | null, refetch: query.refetch };
};

// ── Conciliación ──────────────────────────────────────────────────────────
export interface SettlementInput {
  channel: SettlementChannel;
  period_start: string;
  period_end: string;
  net_deposited: number;
  gross_reported?: number | null;
  fees_reported?: number;
  withholdings_reported?: number;
  deposit_date?: string | null;
  reference?: string | null;
  notes?: string | null;
}

export const useReconciliation = (from: string, to: string) => {
  const { userId, isResolved } = useDataUserId();
  const { toast } = useToast();
  const invalidate = useInvalidateFinance();

  const query = useQuery({
    queryKey: qk.financeIntegral.reconciliation(userId, from, to),
    enabled: !!userId && isResolved && !!from && !!to,
    queryFn: async (): Promise<Reconciliation> => {
      const { data, error } = await db.rpc('finance_reconciliation', { p_owner: userId, p_from: from, p_to: to });
      if (error) throw error;
      return data as Reconciliation;
    },
  });

  const addSettlement = useMutation({
    mutationFn: async (s: SettlementInput) => {
      const { error } = await db.from('finance_settlements').insert({
        user_id: userId, channel: s.channel, period_start: s.period_start, period_end: s.period_end,
        net_deposited: s.net_deposited, gross_reported: s.gross_reported ?? null,
        fees_reported: s.fees_reported ?? 0, withholdings_reported: s.withholdings_reported ?? 0,
        deposit_date: s.deposit_date || null, reference: s.reference?.trim() || null, notes: s.notes?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Liquidación registrada' }); },
    onError: (e) => toast({ title: 'No se pudo registrar', description: errMsg(e), variant: 'destructive' }),
  });

  const removeSettlement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('finance_settlements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { reconciliation: query.data ?? null, loading: query.isLoading, error: query.error as Error | null, addSettlement, removeSettlement };
};
