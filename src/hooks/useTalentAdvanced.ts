 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useDataUserId } from './useDataUserId';
 import { useToast } from './use-toast';
 import type { TablesUpdate } from '@/integrations/supabase/types';
 
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
 
 export const useTalentAdvanced = () => {
   const { userId } = useDataUserId();
   const { toast } = useToast();
   const [loading, setLoading] = useState(true);
   const [staff, setStaff] = useState<StaffMemberExtended[]>([]);
   const [availability, setAvailability] = useState<StaffAvailability[]>([]);
   const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
   const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
   const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>([]);
   const [certifications, setCertifications] = useState<StaffCertification[]>([]);
 
   // Fetch all data
   const fetchData = useCallback(async () => {
     if (!userId) {
       setLoading(false);
       return;
     }
     setLoading(true);
     try {
       const [staffRes, availRes, timeOffRes, templatesRes, swapRes, certRes] = await Promise.all([
         supabase.from('staff_members').select('*').eq('user_id', userId).order('name'),
         supabase.from('staff_availability').select('*').eq('user_id', userId),
         supabase.from('time_off_requests').select('*, staff_members(name)').eq('user_id', userId).order('created_at', { ascending: false }),
         supabase.from('shift_templates').select('*').eq('user_id', userId).order('template_name'),
         supabase.from('shift_swap_requests').select('*, staff_members!requesting_staff_id(name)').eq('user_id', userId).order('created_at', { ascending: false }),
         supabase.from('staff_certifications').select('*, staff_members(name)').eq('user_id', userId)
       ]);
 
       if (staffRes.error) throw staffRes.error;
       if (availRes.error) throw availRes.error;
       if (timeOffRes.error) throw timeOffRes.error;
       if (templatesRes.error) throw templatesRes.error;
       if (swapRes.error) throw swapRes.error;
       if (certRes.error) throw certRes.error;
 
       // Enrich staff with availability and certifications
       const enrichedStaff: StaffMemberExtended[] = (staffRes.data || []).map((s: any) => ({
         ...s,
         availability: (availRes.data || []).filter((a: any) => a.staff_member_id === s.id),
         certifications: (certRes.data || []).filter((c: any) => c.staff_member_id === s.id),
         pending_time_off: (timeOffRes.data || []).filter((t: any) => t.staff_member_id === s.id && t.status === 'pending').length
       }));
 
       setStaff(enrichedStaff);
       setAvailability(availRes.data || []);
       setTimeOffRequests((timeOffRes.data || []).map((t: any) => ({
         ...t,
         staff_member_name: t.staff_members?.name
       })));
       setShiftTemplates(templatesRes.data || []);
       setSwapRequests((swapRes.data || []).map((s: any) => ({
         ...s,
         requesting_staff_name: s.staff_members?.name
       })));
       setCertifications((certRes.data || []).map((c: any) => ({
         ...c,
         staff_member_name: c.staff_members?.name
       })));
     } catch (error: any) {
       console.error('Error fetching talent data:', error);
       toast({ title: 'Error', description: error.message, variant: 'destructive' });
     } finally {
       setLoading(false);
     }
   }, [userId, toast]);
 
   useEffect(() => {
     fetchData();
   }, [fetchData]);
 
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
       await fetchData();
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
       await fetchData();
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
       await fetchData();
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
       await fetchData();
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
       await fetchData();
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
       await fetchData();
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
       await fetchData();
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
       await fetchData();
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
       await fetchData();
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
       await fetchData();
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
     refetch: fetchData,
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