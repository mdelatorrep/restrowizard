import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

/**
 * Hook to check if the current user is a platform super admin.
 * Uses the user_roles table with the 'admin' role.
 */
export const useSuperAdmin = () => {
  const { user } = useAuthContext();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['super-admin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  return {
    isAdmin: isAdmin ?? false,
    isLoading,
    user,
  };
};

/**
 * Hook to get platform-wide statistics.
 * Only works for admin users.
 */
export const usePlatformStats = () => {
  const { isAdmin } = useSuperAdmin();

  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_platform_stats');
      if (error) throw error;
      return data as {
        total_users: number;
        total_restaurants: number;
        total_consultants: number;
        active_jobs: number;
        total_candidates: number;
        total_applications: number;
        active_providers: number;
        open_requests: number;
        total_proposals: number;
        total_reviews: number;
        published_courses: number;
        total_enrollments: number;
        total_certificates: number;
        growth_preregistrations: number;
      };
    },
    enabled: isAdmin,
    staleTime: 2 * 60 * 1000,
  });
};
