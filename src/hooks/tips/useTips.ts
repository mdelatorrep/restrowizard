import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from '@/hooks/useDataUserId';
import { qk } from '@/lib/queryKeys';
import {
  quincenaFor,
  summarizeTipPeriod,
  type TipAllocation,
  type TipPeriod,
  type TipPolicy,
  type TipRoleWeight,
} from './tipsData';

// Las tablas y RPC de propinas son nuevas: hasta regenerar types.ts se accede sin tipos estrictos.
const db = supabase as unknown as {
  from: (t: string) => any;
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: any; error: { message: string } | null }>;
};

const asError = (e: { message: string } | null) => (e ? new Error(e.message) : null);

export const useTips = (selectedPeriodId: string | null) => {
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();

  const periodsQuery = useQuery({
    queryKey: qk.talent.tipPeriods(userId),
    enabled: !!userId,
    queryFn: async (): Promise<TipPeriod[]> => {
      const { data, error } = await db.from('tip_periods').select('*').eq('user_id', userId).order('start_date', { ascending: false });
      if (error) throw asError(error);
      return data || [];
    },
  });

  const periods = periodsQuery.data || [];
  const period = periods.find(p => p.id === selectedPeriodId) || periods[0] || null;

  const allocationsQuery = useQuery({
    queryKey: qk.talent.tipAllocations(period?.id),
    enabled: !!period?.id,
    queryFn: async (): Promise<TipAllocation[]> => {
      const { data, error } = await db
        .from('tip_allocations')
        .select('*')
        .eq('period_id', period!.id)
        .order('total_amount', { ascending: false });
      if (error) throw asError(error);
      return data || [];
    },
  });

  const settingsQuery = useQuery({
    queryKey: qk.talent.tipSettings(userId),
    enabled: !!userId,
    queryFn: async (): Promise<{ policy: TipPolicy | null; weights: TipRoleWeight[] }> => {
      const [{ data: policy, error: e1 }, { data: weights, error: e2 }] = await Promise.all([
        db.from('tip_policies').select('*').eq('user_id', userId).maybeSingle(),
        db.from('tip_role_weights').select('*').eq('user_id', userId).order('weight', { ascending: false }),
      ]);
      if (e1) throw asError(e1);
      if (e2) throw asError(e2);
      return { policy: policy || null, weights: weights || [] };
    },
  });

  const allocations = allocationsQuery.data || [];
  const summary = useMemo(() => summarizeTipPeriod(period, allocations), [period, allocations]);

  const invalidate = (periodId?: string) => {
    queryClient.invalidateQueries({ queryKey: qk.talent.tipPeriods(userId) });
    if (periodId) queryClient.invalidateQueries({ queryKey: qk.talent.tipAllocations(periodId) });
  };

  const compute = useMutation({
    mutationFn: async (periodId: string) => {
      const { data, error } = await db.rpc('compute_tip_period', { p_period_id: periodId });
      if (error) throw asError(error);
      return data as { total_tips: number; unassigned_pool: number };
    },
    onSuccess: (_d, periodId) => invalidate(periodId),
  });

  const close = useMutation({
    mutationFn: async (periodId: string) => {
      const { error } = await db.rpc('close_tip_period', { p_period_id: periodId });
      if (error) throw asError(error);
    },
    onSuccess: (_d, periodId) => invalidate(periodId),
  });

  /** Crea (si no existe) la quincena que contiene la fecha y la calcula. */
  const openPeriod = useMutation({
    mutationFn: async (date: Date) => {
      const q = quincenaFor(date);
      const existing = periods.find(p => p.start_date === q.start && p.end_date === q.end);
      let id = existing?.id;
      if (!id) {
        const { data, error } = await db
          .from('tip_periods')
          .insert({ user_id: userId, label: q.label, start_date: q.start, end_date: q.end })
          .select('id')
          .single();
        if (error) throw asError(error);
        id = data.id as string;
      }
      const { error: e2 } = await db.rpc('compute_tip_period', { p_period_id: id });
      if (e2) throw asError(e2);
      return id;
    },
    onSuccess: id => invalidate(id),
  });

  /** Guarda factor/ajuste y recalcula: el factor cambia los puntos de todos. */
  const saveAllocation = useMutation({
    mutationFn: async (edit: Pick<TipAllocation, 'id' | 'period_id' | 'manager_factor' | 'factor_reason' | 'adjustment' | 'adjustment_reason'>) => {
      const { error } = await db
        .from('tip_allocations')
        .update({
          manager_factor: edit.manager_factor,
          factor_reason: edit.manager_factor === 1 ? null : edit.factor_reason?.trim() || null,
          adjustment: edit.adjustment,
          adjustment_reason: edit.adjustment === 0 ? null : edit.adjustment_reason?.trim() || null,
        })
        .eq('id', edit.id);
      if (error) throw asError(error);
      const { error: e2 } = await db.rpc('compute_tip_period', { p_period_id: edit.period_id });
      if (e2) throw asError(e2);
    },
    onSuccess: (_d, edit) => invalidate(edit.period_id),
  });

  const saveSettings = useMutation({
    mutationFn: async (input: { policy: Omit<TipPolicy, 'user_id'>; weights: Pick<TipRoleWeight, 'position' | 'tip_group' | 'weight' | 'earns_table_tips'>[] }) => {
      const { error } = await db.from('tip_policies').upsert({ user_id: userId, ...input.policy, updated_at: new Date().toISOString() });
      if (error) throw asError(error);
      if (input.weights.length) {
        const { error: e2 } = await db
          .from('tip_role_weights')
          .upsert(input.weights.map(w => ({ ...w, user_id: userId })), { onConflict: 'user_id,position' });
        if (e2) throw asError(e2);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.talent.tipSettings(userId) });
    },
  });

  return {
    userId,
    periods,
    period,
    allocations,
    summary,
    settings: settingsQuery.data,
    loading: periodsQuery.isLoading || (allocationsQuery.isLoading && !!period),
    error: periodsQuery.error || allocationsQuery.error,
    compute,
    close,
    openPeriod,
    saveAllocation,
    saveSettings,
  };
};
