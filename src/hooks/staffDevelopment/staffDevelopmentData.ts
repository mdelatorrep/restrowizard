import { supabase } from '@/integrations/supabase/client';

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


export interface StaffDevelopmentData {
  programs: TrainingProgram[];
  progress: TrainingProgress[];
  benefits: StaffBenefit[];
  assignments: BenefitAssignment[];
  staffCount: number;
}

/** Carga de Formación + Beneficios (B-31: extraído del hook). */
export const fetchStaffDevelopmentData = async (userId: string): Promise<StaffDevelopmentData> => {
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

  return {
    programs: (programsRes.data || []) as TrainingProgram[],
    progress: ((progressRes.data || []) as any[]).map((p) => ({
      ...p,
      staff_name: p.staff_members?.name,
      program_title: p.training_programs?.title,
      program_category: p.training_programs?.category,
    })) as TrainingProgress[],
    benefits: (benefitsRes.data || []) as StaffBenefit[],
    assignments: ((assignmentsRes.data || []) as any[]).map((a) => ({
      ...a,
      staff_name: a.staff_members?.name,
      benefit_name: a.staff_benefits?.benefit_name,
      benefit_type: a.staff_benefits?.benefit_type,
    })) as BenefitAssignment[],
    staffCount: staffRes.count || 0,
  };
};

export const computeTrainingKPIs = (programs: TrainingProgram[], progress: TrainingProgress[]): TrainingKPIs => {
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
};

export const computeBenefitKPIs = (
  benefits: StaffBenefit[], assignments: BenefitAssignment[], staffCount: number
): BenefitKPIs => {
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
};
