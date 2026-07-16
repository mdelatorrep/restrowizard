import { supabase } from '@/integrations/supabase/client';

// Types
export interface StaffAvailability {
  id: string;
  staff_member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
  effective_from: string | null;
  effective_until: string | null;
}

export interface TimeOffRequest {
  id: string;
  staff_member_id: string;
  staff_member_name?: string;
  request_type: 'vacation' | 'sick' | 'personal' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
  reason: string | null;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export interface ShiftTemplate {
  id: string;
  template_name: string;
  position: string | null;
  start_time: string;
  end_time: string;
  break_minutes: number;
  color: string | null;
  description: string | null;
  is_active: boolean;
}

export interface ShiftSwapRequest {
  id: string;
  original_shift_id: string;
  original_shift?: {
    shift_date: string;
    start_time: string;
    end_time: string;
    staff_member_name?: string;
  };
  requesting_staff_id: string;
  requesting_staff_name?: string;
  target_staff_id: string | null;
  target_staff_name?: string;
  target_shift_id: string | null;
  swap_type: 'give_away' | 'swap' | 'cover';
  status: 'pending' | 'approved' | 'denied' | 'cancelled' | 'accepted_pending_approval';
  reason: string | null;
  created_at: string;
}

export interface StaffCertification {
  id: string;
  staff_member_id: string;
  staff_member_name?: string;
  certification_name: string;
  certification_type: 'food_safety' | 'alcohol' | 'first_aid' | 'training' | 'other';
  issued_date: string | null;
  expiration_date: string | null;
  issuing_authority: string | null;
  document_url: string | null;
  status: 'valid' | 'expired' | 'pending' | 'revoked';
  notes: string | null;
}

export interface StaffMemberExtended {
  id: string;
  name: string;
  position: string;
  hourly_rate: number | null;
  hire_date: string | null;
  performance_score: number | null;
  training_progress: number | null;
  is_active: boolean;
  email: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  max_hours_per_week: number | null;
  preferred_shifts: string[] | null;
  skills: string[] | null;
  avatar_url: string | null;
  department: string | null;
  employee_id: string | null;
  availability?: StaffAvailability[];
  certifications?: StaffCertification[];
  pending_time_off?: number;
}


export interface TalentAdvancedData {
  staff: StaffMemberExtended[];
  availability: StaffAvailability[];
  timeOffRequests: TimeOffRequest[];
  shiftTemplates: ShiftTemplate[];
  swapRequests: ShiftSwapRequest[];
  certifications: StaffCertification[];
}

/** Carga de Talento avanzado (B-31: extraído del hook). */
export const fetchTalentAdvancedData = async (userId: string): Promise<TalentAdvancedData> => {
  const [staffRes, availRes, timeOffRes, templatesRes, swapRes, certRes] = await Promise.all([
    supabase.from('staff_members').select('*').eq('user_id', userId).order('name'),
    supabase.from('staff_availability').select('*').eq('user_id', userId),
    supabase.from('time_off_requests').select('*, staff_members(name)').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('shift_templates').select('*').eq('user_id', userId).order('template_name'),
    supabase.from('shift_swap_requests').select('*, staff_members!requesting_staff_id(name)').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('staff_certifications').select('*, staff_members(name)').eq('user_id', userId),
  ]);

  if (staffRes.error) throw staffRes.error;
  if (availRes.error) throw availRes.error;
  if (timeOffRes.error) throw timeOffRes.error;
  if (templatesRes.error) throw templatesRes.error;
  if (swapRes.error) throw swapRes.error;
  if (certRes.error) throw certRes.error;

  // Enrich staff with availability and certifications
  const staff: StaffMemberExtended[] = ((staffRes.data || []) as any[]).map((s) => ({
    ...s,
    availability: ((availRes.data || []) as any[]).filter((a) => a.staff_member_id === s.id),
    certifications: ((certRes.data || []) as any[]).filter((c) => c.staff_member_id === s.id),
    pending_time_off: ((timeOffRes.data || []) as any[]).filter((t) => t.staff_member_id === s.id && t.status === 'pending').length,
  }));

  return {
    staff,
    availability: (availRes.data || []) as StaffAvailability[],
    timeOffRequests: ((timeOffRes.data || []) as any[]).map((t) => ({
      ...t,
      staff_member_name: t.staff_members?.name,
    })) as TimeOffRequest[],
    shiftTemplates: (templatesRes.data || []) as ShiftTemplate[],
    swapRequests: ((swapRes.data || []) as any[]).map((s) => ({
      ...s,
      requesting_staff_name: s.staff_members?.name,
    })) as ShiftSwapRequest[],
    certifications: ((certRes.data || []) as any[]).map((c) => ({
      ...c,
      staff_member_name: c.staff_members?.name,
    })) as StaffCertification[],
  };
};
