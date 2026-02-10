import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useSavedJobs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const savedJobs = useQuery({
    queryKey: ['saved-jobs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_saved')
        .select('*, jobs(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const toggleSave = useMutation({
    mutationFn: async (jobId: string) => {
      const existing = savedJobs.data?.find(s => s.job_id === jobId);
      if (existing) {
        const { error } = await supabase.from('job_saved').delete().eq('id', existing.id);
        if (error) throw error;
        return { saved: false };
      } else {
        const { error } = await supabase.from('job_saved').insert({ user_id: user!.id, job_id: jobId });
        if (error) throw error;
        return { saved: true };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      toast.success(result.saved ? 'Empleo guardado' : 'Empleo removido de guardados');
    },
    onError: () => toast.error('Error al guardar empleo'),
  });

  const isJobSaved = (jobId: string) => {
    return savedJobs.data?.some(s => s.job_id === jobId) || false;
  };

  return { savedJobs, toggleSave, isJobSaved };
};
