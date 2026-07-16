import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { qk } from '@/lib/queryKeys';
import {
  fetchStaffDevelopmentData,
  computeTrainingKPIs,
  computeBenefitKPIs,
  type StaffDevelopmentData,
  type TrainingProgram,
  type TrainingProgress,
  type StaffBenefit,
} from './staffDevelopment/staffDevelopmentData';
import type { TablesUpdate } from '@/integrations/supabase/types';

// B-31: tipos, carga y KPIs viven en ./staffDevelopment/staffDevelopmentData.
export type {
  TrainingProgram, TrainingProgress, StaffBenefit, BenefitAssignment,
  TrainingKPIs, BenefitKPIs,
} from './staffDevelopment/staffDevelopmentData';
export { TRAINING_CATEGORIES, BENEFIT_TYPES } from './staffDevelopment/staffDevelopmentData';

const EMPTY: StaffDevelopmentData = { programs: [], progress: [], benefits: [], assignments: [], staffCount: 0 };

export const useStaffDevelopment = () => {
  const { userId } = useDataUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data = EMPTY, isLoading: loading } = useQuery({
    queryKey: qk.talent.development(userId),
    enabled: !!userId,
    queryFn: async () => {
      try {
        return await fetchStaffDevelopmentData(userId!);
      } catch (error: any) {
        console.error('Error fetching staff development data:', error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        throw error;
      }
    },
  });

  const { programs, progress, benefits, assignments, staffCount } = data;

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.talent.development(userId) });
    // El empleado ve sus formaciones/beneficios en "Mi Desarrollo": si el gerente
    // asigna algo, esa vista debe reflejarlo sin recargar.
    await queryClient.invalidateQueries({ queryKey: ['my-development'] });
  }, [queryClient, userId]);

  // ---- Training CRUD ----
  const createProgram = async (data: Omit<TrainingProgram, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return null;
    try {
      const { data: result, error } = await supabase
        .from('training_programs')
        .insert({ ...data, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Programa de formación creado' });
      await refetch();
      return result;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateProgram = async (id: string, updates: Partial<TrainingProgram>) => {
    try {
      const { error } = await supabase.from('training_programs').update(updates).eq('id', id);
      if (error) throw error;
      toast({ title: 'Programa actualizado' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteProgram = async (id: string) => {
    try {
      const { error } = await supabase.from('training_programs').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Programa eliminado' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const assignTraining = async (staffMemberId: string, programId: string, dueDate?: string) => {
    if (!userId) return null;
    try {
      const { data: result, error } = await supabase
        .from('staff_training_progress')
        .insert({
          user_id: userId,
          staff_member_id: staffMemberId,
          training_program_id: programId,
          due_date: dueDate || null,
          status: 'not_started',
          progress_percent: 0,
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Formación asignada' });
      await refetch();
      return result;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateProgress = async (id: string, updates: Partial<TrainingProgress>) => {
    try {
      const updateData: any = { ...updates };
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
        updateData.progress_percent = 100;
      }
      if (updates.status === 'in_progress' && !updates.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      const { error } = await supabase.from('staff_training_progress').update(updateData).eq('id', id);
      if (error) throw error;
      toast({ title: 'Progreso actualizado' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // ---- Benefits CRUD ----
  const createBenefit = async (data: Omit<StaffBenefit, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return null;
    try {
      const { data: result, error } = await supabase
        .from('staff_benefits')
        .insert({ ...data, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Beneficio creado' });
      await refetch();
      return result;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateBenefit = async (id: string, updates: Partial<StaffBenefit>) => {
    try {
      const { error } = await supabase.from('staff_benefits').update(updates).eq('id', id);
      if (error) throw error;
      toast({ title: 'Beneficio actualizado' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteBenefit = async (id: string) => {
    try {
      const { error } = await supabase.from('staff_benefits').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Beneficio eliminado' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const assignBenefit = async (staffMemberId: string, benefitId: string, notes?: string) => {
    if (!userId) return null;
    try {
      const { data: result, error } = await supabase
        .from('staff_benefit_assignments')
        .insert({
          user_id: userId,
          staff_member_id: staffMemberId,
          benefit_id: benefitId,
          notes: notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Beneficio asignado' });
      await refetch();
      return result;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateAssignment = async (id: string, updates: TablesUpdate<'staff_benefit_assignments'>) => {
    try {
      const { error } = await supabase.from('staff_benefit_assignments').update(updates).eq('id', id);
      if (error) throw error;
      toast({ title: 'Asignación actualizada' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const removeAssignment = async (id: string) => {
    try {
      const { error } = await supabase.from('staff_benefit_assignments').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Asignación eliminada' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // ---- Computed KPIs ----
  const trainingKPIs = useMemo(() => computeTrainingKPIs(programs, progress), [programs, progress]);
  const benefitKPIs = useMemo(() => computeBenefitKPIs(benefits, assignments, staffCount), [benefits, assignments, staffCount]);

  return {
    loading,
    // Training
    programs,
    progress,
    trainingKPIs,
    createProgram,
    updateProgram,
    deleteProgram,
    assignTraining,
    updateProgress,
    // Benefits
    benefits,
    assignments,
    benefitKPIs,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    assignBenefit,
    updateAssignment,
    removeAssignment,
    // Misc
    refetch,
  };
};
