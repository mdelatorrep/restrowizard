import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { qk } from '@/lib/queryKeys';

interface ConsultantProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  bio: string | null;
  specializations: string[] | null;
  years_experience: number | null;
  hourly_rate: number | null;
  website_url: string | null;
  linkedin_url: string | null;
  logo_url: string | null;
  brand_colors: any;
  is_verified: boolean | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export const useConsultantProfile = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile = null, isLoading, refetch } = useQuery({
    queryKey: qk.consultant.profile(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<ConsultantProfile | null> => {
      const { data, error } = await supabase
        .from('consultant_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const updateProfile = async (updates: Partial<ConsultantProfile>) => {
    if (!user || !profile) return { error: 'No profile found' };
    try {
      const { error } = await supabase.from('consultant_profiles').update(updates).eq('id', profile.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: qk.consultant.profile(user.id) });
      toast({ title: 'Perfil actualizado', description: 'Los cambios han sido guardados.' });
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error: error.message };
    }
  };

  return { profile, loading: isLoading, updateProfile, refetch };
};
