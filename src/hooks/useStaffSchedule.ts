import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { calcShiftHours, calcShiftLaborCost } from '@/lib/laborCost';
import type { TablesUpdate } from '@/integrations/supabase/types';



export interface StaffShift {
  id: string;
  staff_member_id: string;
  staff_member_name?: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  hourly_rate_override: number | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  hours_worked?: number;
  cost?: number;
}

export interface StaffMemberWithShifts {
  id: string;
  name: string;
  position: string | null;
  hourly_rate: number | null;
  shifts: StaffShift[];
  total_hours: number;
  total_cost: number;
}

export interface ScheduleKPIs {
  totalShifts: number;
  totalHoursScheduled: number;
  totalHoursWorked: number;
  totalLaborCost: number;
  staffCount: number;
  avgHoursPerStaff: number;
  avgCostPerHour: number;
  completionRate: number;
  noShowRate: number;
}

export const useStaffSchedule = (weekStart?: Date) => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [staffWithShifts, setStaffWithShifts] = useState<StaffMemberWithShifts[]>([]);
  const [kpis, setKpis] = useState<ScheduleKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  // Estabilizar el rango de fechas a primitivos (timestamps) para evitar loops
  // de useEffect cuando weekStart se recrea en cada render del padre.
  const weekStartTs = weekStart ? weekStart.getTime() : null;
  const { weekStartStr, weekEndStr } = useMemo(() => {
    const base = weekStartTs ? new Date(weekStartTs) : new Date();
    const s = startOfWeek(base, { weekStartsOn: 1 });
    const e = endOfWeek(s, { weekStartsOn: 1 });
    return {
      weekStartStr: format(s, 'yyyy-MM-dd'),
      weekEndStr: format(e, 'yyyy-MM-dd'),
    };
  }, [weekStartTs]);


  // TK-2: fórmula única compartida con Finanzas.
  const calculateHoursWorked = (shift: StaffShift): number => calcShiftHours(shift);

  const fetchSchedule = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch staff members
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff_members')
        .select('id, name, position, hourly_rate')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Fetch shifts for the week
      // C8-01: alinear con Finanzas → excluir cancelled / no_show del costo laboral.
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('staff_shifts')
        .select('*')
        .eq('user_id', userId)
        .gte('shift_date', weekStartStr)
        .lte('shift_date', weekEndStr)
        .in('status', ['scheduled', 'confirmed', 'in_progress', 'completed'])
        .order('shift_date')
        .order('start_time');

      if (shiftsError) throw shiftsError;

      // Enrich shifts with staff names and calculated fields
      const enrichedShifts: StaffShift[] = (shiftsData || []).map(shift => {
        const staffMember = staffMembers?.find(s => s.id === shift.staff_member_id);
        const hours = calculateHoursWorked(shift as StaffShift);
        const cost = calcShiftLaborCost(shift as StaffShift, staffMember?.hourly_rate);

        return {
          ...shift,
          staff_member_name: staffMember?.name || 'Unknown',
          hours_worked: hours,
          cost,
        } as StaffShift;
      });

      setShifts(enrichedShifts);
      setHasData(enrichedShifts.length > 0);

      // Group shifts by staff member
      const staffMap = new Map<string, StaffMemberWithShifts>();
      
      for (const member of (staffMembers || [])) {
        staffMap.set(member.id, {
          id: member.id,
          name: member.name,
          position: member.position,
          hourly_rate: member.hourly_rate,
          shifts: [],
          total_hours: 0,
          total_cost: 0
        });
      }

      for (const shift of enrichedShifts) {
        const staff = staffMap.get(shift.staff_member_id);
        if (staff) {
          staff.shifts.push(shift);
          staff.total_hours += shift.hours_worked || 0;
          staff.total_cost += shift.cost || 0;
        }
      }

      setStaffWithShifts(Array.from(staffMap.values()).filter(s => s.shifts.length > 0));

      // Calculate KPIs
      const totalShifts = enrichedShifts.length;
      const completedShifts = enrichedShifts.filter(s => s.status === 'completed').length;
      const noShowShifts = enrichedShifts.filter(s => s.status === 'no_show').length;
      const totalHoursScheduled = enrichedShifts.reduce((sum, s) => {
        const [startH, startM] = s.start_time.split(':').map(Number);
        const [endH, endM] = s.end_time.split(':').map(Number);
        return sum + ((endH * 60 + endM) - (startH * 60 + startM) - s.break_minutes) / 60;
      }, 0);
      const totalHoursWorked = enrichedShifts
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.hours_worked || 0), 0);
      const totalLaborCost = enrichedShifts.reduce((sum, s) => sum + (s.cost || 0), 0);
      const staffCount = new Set(enrichedShifts.map(s => s.staff_member_id)).size;

      setKpis({
        totalShifts,
        totalHoursScheduled,
        totalHoursWorked,
        totalLaborCost,
        staffCount,
        avgHoursPerStaff: staffCount > 0 ? totalHoursScheduled / staffCount : 0,
        avgCostPerHour: totalHoursWorked > 0 ? totalLaborCost / totalHoursWorked : 0,
        completionRate: totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 0,
        noShowRate: totalShifts > 0 ? (noShowShifts / totalShifts) * 100 : 0
      });
    } catch (error: any) {
      console.error('Error fetching schedule:', error);
      toast({
        title: "Error al cargar horarios",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, weekStartStr, weekEndStr, toast]);

  const addShift = useCallback(async (shift: Omit<StaffShift, 'id' | 'hours_worked' | 'cost' | 'staff_member_name'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('staff_shifts')
        .insert({
          user_id: userId,
          staff_member_id: shift.staff_member_id,
          shift_date: shift.shift_date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          break_minutes: shift.break_minutes || 0,
          hourly_rate_override: shift.hourly_rate_override,
          status: shift.status || 'scheduled',
          notes: shift.notes
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Turno creado" });
      await fetchSchedule();
      return data;
    } catch (error: any) {
      console.error('Error adding shift:', error);
      toast({
        title: "Error al crear turno",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  }, [userId, fetchSchedule, toast]);

  const updateShift = useCallback(async (id: string, updates: TablesUpdate<'staff_shifts'>) => {
    try {
      const { error } = await supabase
        .from('staff_shifts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Turno actualizado" });
      await fetchSchedule();
    } catch (error: any) {
      console.error('Error updating shift:', error);
      toast({
        title: "Error al actualizar turno",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [fetchSchedule, toast]);

  const deleteShift = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff_shifts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Turno eliminado" });
      await fetchSchedule();
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      toast({
        title: "Error al eliminar turno",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [fetchSchedule, toast]);

  const clockIn = useCallback(async (shiftId: string) => {
    const now = format(new Date(), 'HH:mm:ss');
    await updateShift(shiftId, { 
      status: 'in_progress', 
      actual_start_time: now 
    });
  }, [updateShift]);

  const clockOut = useCallback(async (shiftId: string) => {
    const now = format(new Date(), 'HH:mm:ss');
    await updateShift(shiftId, { 
      status: 'completed', 
      actual_end_time: now 
    });
  }, [updateShift]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return {
    shifts,
    staffWithShifts,
    kpis,
    loading,
    hasData,
    isViewingClient,
    addShift,
    updateShift,
    deleteShift,
    clockIn,
    clockOut,
    refetch: fetchSchedule
  };
};
