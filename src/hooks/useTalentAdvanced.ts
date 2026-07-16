import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { qk } from '@/lib/queryKeys';
import {
  fetchTalentAdvancedData,
  type TalentAdvancedData,
  type StaffAvailability,
  type TimeOffRequest,
  type ShiftTemplate,
  type ShiftSwapRequest,
  type StaffCertification,
} from './talentAdvanced/talentAdvancedData';
import type { TablesUpdate } from '@/integrations/supabase/types';

// B-31: tipos y carga viven en ./talentAdvanced/talentAdvancedData.
export type {
  StaffAvailability, TimeOffRequest, ShiftTemplate, ShiftSwapRequest,
  StaffCertification, StaffMemberExtended,
} from './talentAdvanced/talentAdvancedData';

const EMPTY: TalentAdvancedData = {
  staff: [], availability: [], timeOffRequests: [],
  shiftTemplates: [], swapRequests: [], certifications: [],
};

export const useTalentAdvanced = () => {
  const { userId } = useDataUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data = EMPTY, isLoading: loading } = useQuery({
    queryKey: qk.talent.advanced(userId),
    enabled: !!userId,
    queryFn: async () => {
      try {
        return await fetchTalentAdvancedData(userId!);
      } catch (error: any) {
        console.error('Error fetching talent data:', error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        throw error;
      }
    },
  });

  const { staff, availability, timeOffRequests, shiftTemplates, swapRequests, certifications } = data;

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.talent.advanced(userId) });
    // La lista base de empleados es la misma que usa useTalentData.
    await queryClient.invalidateQueries({ queryKey: qk.talent.staff(userId) });
  }, [queryClient, userId]);

  // CRUD Operations
  const setStaffAvailability = async (staffId: string, slots: Omit<StaffAvailability, 'id' | 'staff_member_id'>[]) => {
    if (!userId) return;
    try {
      // Delete existing availability for this staff member
      await supabase.from('staff_availability').delete().eq('staff_member_id', staffId);
      
      // Insert new availability
      if (slots.length > 0) {
        const { error } = await supabase.from('staff_availability').insert(
          slots.map(s => ({ ...s, user_id: userId, staff_member_id: staffId }))
        );
        if (error) throw error;
      }
      toast({ title: 'Disponibilidad actualizada' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const createTimeOffRequest = async (data: Omit<TimeOffRequest, 'id' | 'status' | 'reviewed_by' | 'reviewed_at' | 'review_notes' | 'created_at' | 'staff_member_name'>) => {
    if (!userId) return null;
    try {
      const { data: result, error } = await supabase
        .from('time_off_requests')
        .insert({ ...data, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Solicitud creada' });
      await refetch();
      return result;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateTimeOffRequest = async (id: string, status: 'approved' | 'denied' | 'cancelled', reviewNotes?: string) => {
    try {
      const { error } = await supabase
        .from('time_off_requests')
        .update({ 
          status, 
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
      toast({ title: `Solicitud ${status === 'approved' ? 'aprobada' : status === 'denied' ? 'denegada' : 'cancelada'}` });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const createShiftTemplate = async (data: Omit<ShiftTemplate, 'id' | 'is_active'>) => {
    if (!userId) return null;
    try {
      const { data: result, error } = await supabase
        .from('shift_templates')
        .insert({ ...data, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Plantilla creada' });
      await refetch();
      return result;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteShiftTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from('shift_templates').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Plantilla eliminada' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const createSwapRequest = async (data: Omit<ShiftSwapRequest, 'id' | 'status' | 'created_at' | 'original_shift' | 'requesting_staff_name' | 'target_staff_name'>) => {
    if (!userId) return null;
    try {
      const { data: result, error } = await supabase
        .from('shift_swap_requests')
        .insert({ ...data, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Solicitud de cambio creada' });
      await refetch();
      return result;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateSwapRequest = async (id: string, status: 'approved' | 'denied' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('shift_swap_requests')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast({ title: `Cambio ${status === 'approved' ? 'aprobado' : status === 'denied' ? 'denegado' : 'cancelado'}` });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const addCertification = async (data: Omit<StaffCertification, 'id' | 'staff_member_name'>) => {
    if (!userId) return null;
    try {
      const { data: result, error } = await supabase
        .from('staff_certifications')
        .insert({ ...data, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Certificación agregada' });
      await refetch();
      return result;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteCertification = async (id: string) => {
    try {
      const { error } = await supabase.from('staff_certifications').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Certificación eliminada' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const updateStaffMember = async (id: string, updates: TablesUpdate<'staff_members'>) => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Empleado actualizado' });
      await refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Check for scheduling conflicts
  const checkAvailabilityConflict = (staffId: string, date: Date, startTime: string, endTime: string): boolean => {
    const dayOfWeek = date.getDay();
    const staffAvail = availability.filter(a => a.staff_member_id === staffId && a.day_of_week === dayOfWeek);
    
    if (staffAvail.length === 0) return true; // No availability set = conflict
    
    // Check if any availability slot covers the shift
    return !staffAvail.some(a => {
      if (!a.is_available) return false;
      return a.start_time <= startTime && a.end_time >= endTime;
    });
  };

  // Check for time off conflicts
  const checkTimeOffConflict = (staffId: string, date: string): boolean => {
    return timeOffRequests.some(t => 
      t.staff_member_id === staffId && 
      t.status === 'approved' &&
      date >= t.start_date && 
      date <= t.end_date
    );
  };

  // Get expiring certifications
  const getExpiringCertifications = (daysAhead: number = 30): StaffCertification[] => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    
    return certifications.filter(c => 
      c.expiration_date && 
      c.expiration_date <= futureDateStr &&
      c.expiration_date >= todayStr &&
      c.status === 'valid'
    );
  };

  return {
    loading,
    staff,
    availability,
    timeOffRequests,
    shiftTemplates,
    swapRequests,
    certifications,
    refetch,
    // Availability
    setStaffAvailability,
    checkAvailabilityConflict,
    // Time Off
    createTimeOffRequest,
    updateTimeOffRequest,
    checkTimeOffConflict,
    // Templates
    createShiftTemplate,
    deleteShiftTemplate,
    // Swap Requests
    createSwapRequest,
    updateSwapRequest,
    // Certifications
    addCertification,
    deleteCertification,
    getExpiringCertifications,
    // Staff
    updateStaffMember
  };
};
