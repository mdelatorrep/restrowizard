import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

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
  const [profile, setProfile] = useState<ConsultantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('consultant_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching consultant profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<ConsultantProfile>) => {
    if (!user || !profile) return { error: 'No profile found' };

    try {
      const { error } = await supabase
        .from('consultant_profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: "Perfil actualizado", description: "Los cambios han sido guardados." });
      return { error: null };
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile
  };
};
