import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { TablesUpdate } from '@/integrations/supabase/types';

export const useJobApplications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Candidate: my applications
  const myApplications = useQuery({
    queryKey: ['my-job-applications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*, jobs(*)')
        .eq('applicant_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Apply to a job
  const applyToJob = useMutation({
    mutationFn: async (params: {
      job_id: string;
      cover_letter?: string;
      resume_url?: string;
      candidate_profile_id?: string;
      applicant_name?: string;
      applicant_email?: string;
      applicant_phone?: string;
    }) => {
      const { data, error } = await supabase
        .from('job_applications')
        .insert({
          job_id: params.job_id,
          applicant_id: user!.id,
          cover_letter: params.cover_letter || null,
          resume_url: params.resume_url || null,
          candidate_profile_id: params.candidate_profile_id || null,
          applicant_name: params.applicant_name || null,
          applicant_email: params.applicant_email || null,
          applicant_phone: params.applicant_phone || null,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-job-applications'] });
      toast.success('¡Postulación enviada exitosamente!');
    },
    onError: (e: any) => {
      if (e.message?.includes('duplicate')) {
        toast.error('Ya te postulaste a esta oferta');
      } else {
        toast.error('Error al enviar postulación');
      }
    },
  });

  // Employer: get applications for a specific job
  const getJobApplications = (jobId: string) => {
    return useQuery({
      queryKey: ['job-applications', jobId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('job_applications')
          .select('*, candidate_profiles:candidate_profile_id(*)')
          .eq('job_id', jobId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      enabled: !!jobId,
    });
  };

  // Employer: update application status
  const updateApplicationStatus = useMutation({
    mutationFn: async ({ id, status, notes, interview_date, rejection_reason }: {
      // `status` es un enum de la BD, no un string libre: tiparlo evita mandar
      // valores que Postgres rechaza en runtime.
      id: string; status: TablesUpdate<'job_applications'>['status']; notes?: string; interview_date?: string; rejection_reason?: string;
    }) => {
      const update: TablesUpdate<'job_applications'> = { status };
      if (notes !== undefined) update.employer_notes = notes;
      if (interview_date !== undefined) update.interview_date = interview_date;
      if (rejection_reason !== undefined) update.rejection_reason = rejection_reason;
      
      const { error } = await supabase.from('job_applications').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  return {
    myApplications,
    applyToJob,
    getJobApplications,
    updateApplicationStatus,
  };
};
