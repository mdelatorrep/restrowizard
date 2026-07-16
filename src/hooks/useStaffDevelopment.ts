import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import type { TablesUpdate } from '@/integrations/supabase/types';

// Types
export interface TrainingProgram {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  position: string | null;
  estimated_hours: number;
  is_mandatory: boolean;
  is_active: boolean;
  content: any;
  passing_score: number;
  created_at: string;
}

export interface TrainingProgress {
  id: string;
  user_id: string;
  staff_member_id: string;
  training_program_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired';
  progress_percent: number;
  score: number | null;
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;
  modules_completed: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  staff_name?: string;
  program_title?: string;
  program_category?: string;
}

export interface StaffBenefit {
  id: string;
  user_id: string;
  benefit_name: string;
  benefit_type: string;
  description: string | null;
  value: number;
  value_type: string;
  eligibility_months: number;
  is_active: boolean;
  applicable_positions: string[] | null;
  created_at: string;
}

export interface BenefitAssignment {
  id: string;
  user_id: string;
  staff_member_id: string;
  benefit_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  usage_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  staff_name?: string;
  benefit_name?: string;
  benefit_type?: string;
}

export interface TrainingKPIs {
  totalPrograms: number;
  activePrograms: number;
  completionRate: number;
  staffCertified: number;
  mandatoryComplianceRate: number;
  overdueCount: number;
}

export interface BenefitKPIs {
  totalBenefits: number;
  activeBenefits: number;
  staffCovered: number;
  totalStaff: number;
  coverageRate: number;
  estimatedMonthlyCost: number;
}

export const TRAINING_CATEGORIES = [
  { value: 'onboarding', label: 'Onboarding', icon: '🎓' },
  { value: 'food_safety', label: 'Seguridad Alimentaria', icon: '🛡️' },
  { value: 'service', label: 'Servicio al Cliente', icon: '⭐' },
  { value: 'leadership', label: 'Liderazgo', icon: '👑' },
  { value: 'compliance', label: 'Cumplimiento', icon: '📋' },
  { value: 'custom', label: 'Personalizado', icon: '🔧' },
];

export const BENEFIT_TYPES = [
  { value: 'meal_discount', label: 'Descuento en Comida', icon: '🍽️' },
  { value: 'health', label: 'Salud', icon: '🏥' },
  { value: 'bonus', label: 'Bono', icon: '💰' },
  { value: 'referral', label: 'Programa de Referidos', icon: '🤝' },
  { value: 'transport', label: 'Transporte', icon: '🚌' },
  { value: 'education', label: 'Educación', icon: '📚' },
  { value: 'wellness', label: 'Bienestar', icon: '🧘' },
  { value: 'other', label: 'Otro', icon: '📦' },
];

export const useStaffDevelopment = () => {
  const { userId } = useDataUserId();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [benefits, setBenefits] = useState<StaffBenefit[]>([]);
  const [assignments, setAssignments] = useState<BenefitAssignment[]>([]);
  const [staffCount, setStaffCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [programsRes, progressRes, benefitsRes, assignmentsRes, staffRes] = await Promise.all([
        supabase.from('training_programs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('staff_training_progress').select('*, staff_members(name), training_programs(title, category)').eq('user_id', userId),
        supabase.from('staff_benefits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('staff_benefit_assignments').select('*, staff_members(name), staff_benefits(benefit_name, benefit_type)').eq('user_id', userId),
        supabase.from('staff_members').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true),
      ]);

      if (programsRes.error) throw programsRes.error;
      if (progressRes.error) throw progressRes.error;
      if (benefitsRes.error) throw benefitsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      setPrograms(programsRes.data || []);
      setProgress((progressRes.data || []).map((p: any) => ({
        ...p,
        staff_name: p.staff_members?.name,
        program_title: p.training_programs?.title,
        program_category: p.training_programs?.category,
      })));
      setBenefits(benefitsRes.data || []);
      setAssignments((assignmentsRes.data || []).map((a: any) => ({
        ...a,
        staff_name: a.staff_members?.name,
        benefit_name: a.staff_benefits?.benefit_name,
        benefit_type: a.staff_benefits?.benefit_type,
      })));
      setStaffCount(staffRes.count || 0);
    } catch (error: any) {
      console.error('Error fetching staff development data:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      await fetchData();
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
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteProgram = async (id: string) => {
    try {
      const { error } = await supabase.from('training_programs').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Programa eliminado' });
      await fetchData();
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
      await fetchData();
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
      await fetchData();
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
      await fetchData();
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
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteBenefit = async (id: string) => {
    try {
      const { error } = await supabase.from('staff_benefits').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Beneficio eliminado' });
      await fetchData();
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
      await fetchData();
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
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const removeAssignment = async (id: string) => {
    try {
      const { error } = await supabase.from('staff_benefit_assignments').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Asignación eliminada' });
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // ---- Computed KPIs ----
  const trainingKPIs: TrainingKPIs = useMemo(() => {
    const activePrograms = programs.filter(p => p.is_active);
    const completed = progress.filter(p => p.status === 'completed');
    const totalAssigned = progress.length;
    const mandatoryPrograms = programs.filter(p => p.is_mandatory && p.is_active);
    const mandatoryProgress = progress.filter(p => mandatoryPrograms.some(mp => mp.id === p.training_program_id));
    const mandatoryCompleted = mandatoryProgress.filter(p => p.status === 'completed');
    const today = new Date().toISOString().split('T')[0];
    const overdue = progress.filter(p => p.due_date && p.due_date < today && p.status !== 'completed');

    return {
      totalPrograms: programs.length,
      activePrograms: activePrograms.length,
      completionRate: totalAssigned > 0 ? Math.round((completed.length / totalAssigned) * 100) : 0,
      staffCertified: new Set(completed.map(p => p.staff_member_id)).size,
      mandatoryComplianceRate: mandatoryProgress.length > 0
        ? Math.round((mandatoryCompleted.length / mandatoryProgress.length) * 100) : 100,
      overdueCount: overdue.length,
    };
  }, [programs, progress]);

  const benefitKPIs: BenefitKPIs = useMemo(() => {
    const activeBenefits = benefits.filter(b => b.is_active);
    const activeAssignments = assignments.filter(a => a.status === 'active');
    const uniqueStaff = new Set(activeAssignments.map(a => a.staff_member_id));
    const monthlyCost = activeBenefits.reduce((sum, b) => {
      if (b.value_type === 'fixed') return sum + (b.value || 0);
      return sum;
    }, 0);

    return {
      totalBenefits: benefits.length,
      activeBenefits: activeBenefits.length,
      staffCovered: uniqueStaff.size,
      totalStaff: staffCount,
      coverageRate: staffCount > 0 ? Math.round((uniqueStaff.size / staffCount) * 100) : 0,
      estimatedMonthlyCost: monthlyCost,
    };
  }, [benefits, assignments, staffCount]);

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
    refetch: fetchData,
  };
};
