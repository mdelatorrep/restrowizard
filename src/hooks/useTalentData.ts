import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { qk } from '@/lib/queryKeys';

export interface StaffMember {
  id: string;
  name: string;
  position: string;
  hourly_rate: number | null;
  hire_date: string | null;
  performance_score: number | null;
  training_progress: number | null;
  is_active: boolean;
}

export interface TalentKPIs {
  totalStaff: number;
  activeStaff: number;
  avgPerformance: number;
  avgTrainingProgress: number;
  avgHourlyRate: number;
  topPerformers: StaffMember[];
  needsAttention: StaffMember[];
  positionBreakdown: Record<string, number>;
}

export interface TalentBenchmarks {
  turnoverRate: number;
  trainingCompletion: number;
}

const computeKPIs = (data: StaffMember[]): TalentKPIs | null => {
  if (!data || data.length === 0) return null;
  const activeStaff = data.filter(s => s.is_active);
  const denom = activeStaff.length || 1;
  const avgPerformance = activeStaff.reduce((sum, s) => sum + Number(s.performance_score || 0), 0) / denom;
  const avgTrainingProgress = activeStaff.reduce((sum, s) => sum + (s.training_progress || 0), 0) / denom;
  const avgHourlyRate = activeStaff.reduce((sum, s) => sum + Number(s.hourly_rate || 0), 0) / denom;

  const topPerformers = [...activeStaff]
    .sort((a, b) => Number(b.performance_score || 0) - Number(a.performance_score || 0))
    .slice(0, 3);

  const needsAttention = activeStaff
    .filter(s => Number(s.performance_score || 0) < 60 || (s.training_progress || 0) < 50)
    .slice(0, 3);

  const positionBreakdown: Record<string, number> = {};
  activeStaff.forEach(s => {
    positionBreakdown[s.position] = (positionBreakdown[s.position] || 0) + 1;
  });

  return {
    totalStaff: data.length,
    activeStaff: activeStaff.length,
    avgPerformance,
    avgTrainingProgress,
    avgHourlyRate,
    topPerformers,
    needsAttention,
    positionBreakdown,
  };
};

export const useTalentData = () => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff = [], isLoading: loading } = useQuery({
    queryKey: qk.talent.staff(userId),
    enabled: !!userId,
    queryFn: async (): Promise<StaffMember[]> => {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .eq('user_id', userId!)
        .order('name');
      if (error) throw error;
      return (data || []) as StaffMember[];
    },
  });

  const { data: benchmarks = null } = useQuery({
    queryKey: qk.talent.benchmarks(),
    queryFn: async (): Promise<TalentBenchmarks | null> => {
      const { data, error } = await supabase
        .from('industry_benchmarks')
        .select('*')
        .eq('metric_category', 'talent');
      if (error) throw error;
      if (!data || data.length === 0) return null;
      const benchmarkMap: Record<string, number> = {};
      data.forEach(b => { benchmarkMap[b.metric_name] = Number(b.avg_value); });
      return {
        turnoverRate: benchmarkMap['staff_turnover_rate'] || 45,
        trainingCompletion: benchmarkMap['training_completion_rate'] || 68,
      };
    },
  });

  const kpis = useMemo(() => computeKPIs(staff), [staff]);
  const hasData = staff.length > 0;

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.talent.staff(userId) }),
    [queryClient, userId]
  );

  const addStaffMember = async (member: Omit<StaffMember, 'id'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('staff_members')
        .insert({ ...member, user_id: userId })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Empleado agregado", description: "El empleado se ha registrado correctamente" });
      await invalidate();
      return data;
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateStaffMember = async (id: string, updates: Partial<StaffMember>) => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Empleado actualizado" });
      await invalidate();
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    }
  };

  const deleteStaffMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Empleado eliminado" });
      await invalidate();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    }
  };

  return {
    staff,
    kpis,
    benchmarks,
    loading,
    hasData,
    isViewingClient,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    refetch: invalidate,
  };
};
