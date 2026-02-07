import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useToast } from './use-toast';

export interface MyTrainingProgress {
  id: string;
  training_program_id: string;
  status: string;
  progress_percent: number;
  score: number | null;
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;
  modules_completed: any;
  notes: string | null;
  program_title: string;
  program_description: string | null;
  program_category: string;
  program_estimated_hours: number;
  program_is_mandatory: boolean;
  program_content: any;
  program_passing_score: number;
}

export interface MyBenefitAssignment {
  id: string;
  benefit_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  usage_count: number;
  benefit_name: string;
  benefit_type: string;
  benefit_description: string | null;
  benefit_value: number;
  benefit_value_type: string;
}

export interface MyBenefitRequest {
  id: string;
  benefit_id: string;
  status: string;
  message: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  benefit_name?: string;
  benefit_type?: string;
}

export const useMyDevelopment = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [staffMemberId, setStaffMemberId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string>('');
  const [staffPosition, setStaffPosition] = useState<string>('');
  const [training, setTraining] = useState<MyTrainingProgress[]>([]);
  const [benefits, setBenefits] = useState<MyBenefitAssignment[]>([]);
  const [requests, setRequests] = useState<MyBenefitRequest[]>([]);
  const [availableBenefits, setAvailableBenefits] = useState<Array<{ id: string; benefit_name: string; benefit_type: string; description: string | null; value: number; value_type: string }>>([]);

  const fetchData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      // 1. Find the staff_member linked to this auth user
      // First try direct linking via linked_user_id
      let staffMember: any = null;
      
      const { data: directLink, error: directError } = await supabase
        .from('staff_members')
        .select('id, name, position, user_id')
        .eq('linked_user_id', user.id)
        .maybeSingle();

      if (directError) throw directError;
      
      if (directLink) {
        staffMember = directLink;
      } else {
        // Fallback: check via restaurant_team_members.staff_member_id
        const { data: teamLink } = await supabase
          .from('restaurant_team_members')
          .select('staff_member_id, restaurant_businesses!inner(owner_id)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .not('staff_member_id', 'is', null)
          .maybeSingle();
        
        if (teamLink?.staff_member_id) {
          const { data: linkedStaff } = await supabase
            .from('staff_members')
            .select('id, name, position, user_id')
            .eq('id', teamLink.staff_member_id)
            .single();
          
          if (linkedStaff) {
            staffMember = linkedStaff;
            // Auto-link for future queries
            await supabase
              .from('staff_members')
              .update({ linked_user_id: user.id })
              .eq('id', linkedStaff.id);
          }
        }
      }

      if (!staffMember) {
        setLoading(false);
        return;
      }

      setStaffMemberId(staffMember.id);
      setStaffName(staffMember.name);
      setStaffPosition(staffMember.position);

      // 2. Fetch training progress with program details
      const [progressRes, assignmentsRes, requestsRes, benefitsCatalogRes] = await Promise.all([
        supabase
          .from('staff_training_progress')
          .select('*, training_programs(title, description, category, estimated_hours, is_mandatory, content, passing_score)')
          .eq('staff_member_id', staffMember.id),
        supabase
          .from('staff_benefit_assignments')
          .select('*, staff_benefits(benefit_name, benefit_type, description, value, value_type)')
          .eq('staff_member_id', staffMember.id),
        supabase
          .from('benefit_requests')
          .select('*, staff_benefits(benefit_name, benefit_type)')
          .eq('staff_member_id', staffMember.id)
          .order('created_at', { ascending: false }),
        // Get all active benefits for this restaurant (to allow requesting)
        supabase
          .from('staff_benefits')
          .select('id, benefit_name, benefit_type, description, value, value_type')
          .eq('user_id', staffMember.user_id)
          .eq('is_active', true),
      ]);

      if (progressRes.error) throw progressRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      if (requestsRes.error) throw requestsRes.error;

      setTraining((progressRes.data || []).map((p: any) => ({
        id: p.id,
        training_program_id: p.training_program_id,
        status: p.status,
        progress_percent: p.progress_percent,
        score: p.score,
        started_at: p.started_at,
        completed_at: p.completed_at,
        due_date: p.due_date,
        modules_completed: p.modules_completed,
        notes: p.notes,
        program_title: p.training_programs?.title || '',
        program_description: p.training_programs?.description,
        program_category: p.training_programs?.category || '',
        program_estimated_hours: p.training_programs?.estimated_hours || 0,
        program_is_mandatory: p.training_programs?.is_mandatory || false,
        program_content: p.training_programs?.content,
        program_passing_score: p.training_programs?.passing_score || 70,
      })));

      setBenefits((assignmentsRes.data || []).map((a: any) => ({
        id: a.id,
        benefit_id: a.benefit_id,
        status: a.status,
        start_date: a.start_date,
        end_date: a.end_date,
        usage_count: a.usage_count,
        benefit_name: a.staff_benefits?.benefit_name || '',
        benefit_type: a.staff_benefits?.benefit_type || '',
        benefit_description: a.staff_benefits?.description,
        benefit_value: a.staff_benefits?.value || 0,
        benefit_value_type: a.staff_benefits?.value_type || 'fixed',
      })));

      setRequests((requestsRes.data || []).map((r: any) => ({
        ...r,
        benefit_name: r.staff_benefits?.benefit_name,
        benefit_type: r.staff_benefits?.benefit_type,
      })));

      setAvailableBenefits(benefitsCatalogRes.data || []);
    } catch (error: any) {
      console.error('Error fetching my development data:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Mark a training module as in progress or completed
  const updateMyProgress = async (progressId: string, updates: { status?: string; progress_percent?: number; score?: number; modules_completed?: any }) => {
    try {
      const updateData: any = { ...updates };
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.progress_percent = 100;
      }
      if (updates.status === 'in_progress' && !training.find(t => t.id === progressId)?.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      const { error } = await supabase.from('staff_training_progress').update(updateData).eq('id', progressId);
      if (error) throw error;
      toast({ title: 'Progreso actualizado' });
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Request a benefit
  const requestBenefit = async (benefitId: string, message?: string) => {
    if (!staffMemberId || !user?.id) return;
    try {
      // Find the owner's user_id from staff_member
      const { data: staff } = await supabase
        .from('staff_members')
        .select('user_id')
        .eq('id', staffMemberId)
        .single();

      if (!staff) throw new Error('Staff member not found');

      const { error } = await supabase.from('benefit_requests').insert({
        user_id: staff.user_id, // owner's user_id for RLS
        staff_member_id: staffMemberId,
        benefit_id: benefitId,
        message: message || null,
      });
      if (error) throw error;
      toast({ title: 'Solicitud enviada', description: 'Tu solicitud ha sido enviada al administrador' });
      await fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Computed stats
  const stats = useMemo(() => {
    const totalTraining = training.length;
    const completedTraining = training.filter(t => t.status === 'completed').length;
    const inProgressTraining = training.filter(t => t.status === 'in_progress').length;
    const mandatoryTotal = training.filter(t => t.program_is_mandatory).length;
    const mandatoryCompleted = training.filter(t => t.program_is_mandatory && t.status === 'completed').length;
    const today = new Date().toISOString().split('T')[0];
    const overdueTraining = training.filter(t => t.due_date && t.due_date < today && t.status !== 'completed');
    const activeBenefits = benefits.filter(b => b.status === 'active').length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;

    return {
      totalTraining,
      completedTraining,
      inProgressTraining,
      completionRate: totalTraining > 0 ? Math.round((completedTraining / totalTraining) * 100) : 0,
      mandatoryCompliance: mandatoryTotal > 0 ? Math.round((mandatoryCompleted / mandatoryTotal) * 100) : 100,
      overdueCount: overdueTraining.length,
      activeBenefits,
      pendingRequests,
    };
  }, [training, benefits, requests]);

  return {
    loading,
    isLinked: !!staffMemberId,
    staffName,
    staffPosition,
    training,
    benefits,
    requests,
    availableBenefits,
    stats,
    updateMyProgress,
    requestBenefit,
    refetch: fetchData,
  };
};
