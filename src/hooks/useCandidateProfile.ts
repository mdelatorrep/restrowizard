import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type CandidateProfile = Tables<'candidate_profiles'>;
export type CandidateExperience = Tables<'candidate_experience'>;

export const useCandidateProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['candidate-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const experienceQuery = useQuery({
    queryKey: ['candidate-experience', profileQuery.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_experience')
        .select('*')
        .eq('candidate_id', profileQuery.data!.id)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileQuery.data?.id,
  });

  const upsertProfile = useMutation({
    mutationFn: async (profileData: Partial<TablesInsert<'candidate_profiles'>>) => {
      const payload = { ...profileData, user_id: user!.id };
      if (profileQuery.data?.id) {
        const { data, error } = await supabase
          .from('candidate_profiles')
          .update(payload as TablesUpdate<'candidate_profiles'>)
          .eq('id', profileQuery.data.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('candidate_profiles')
          .insert(payload as TablesInsert<'candidate_profiles'>)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
      toast.success('Perfil actualizado');
    },
    onError: (e: any) => toast.error(e.message || 'Error al guardar perfil'),
  });

  const addExperience = useMutation({
    mutationFn: async (exp: Omit<TablesInsert<'candidate_experience'>, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('candidate_experience')
        .insert(exp)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-experience'] });
      toast.success('Experiencia agregada');
    },
    onError: () => toast.error('Error al agregar experiencia'),
  });

  const deleteExperience = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('candidate_experience').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-experience'] });
      toast.success('Experiencia eliminada');
    },
  });

  return {
    profile: profileQuery.data,
    profileLoading: profileQuery.isLoading,
    experience: experienceQuery.data || [],
    experienceLoading: experienceQuery.isLoading,
    upsertProfile,
    addExperience,
    deleteExperience,
  };
};
