import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UserType = 'restaurant_owner' | 'consultant' | null;

type UserTypeQueryData = {
  userType: UserType;
  hasCompletedOnboarding: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchUserTypeData = async (userId: string): Promise<UserTypeQueryData> => {
  // Fetch profile (retry a few times because profile triggers can be slightly delayed on fresh signups)
  let profile: { user_type: string | null } | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      profile = data;
      break;
    }

    // No row yet; wait briefly and retry
    await sleep(250);
  }

  const type = (profile?.user_type as UserType) ?? null;

  if (!type) {
    return { userType: null, hasCompletedOnboarding: false };
  }

  if (type === 'restaurant_owner') {
    const { data: business, error } = await supabase
      .from('restaurant_businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (error) throw error;

    return { userType: type, hasCompletedOnboarding: !!business };
  }

  // Consultant
  const { data: consultantProfile, error } = await supabase
    .from('consultant_profiles')
    .select('id, company_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    userType: type,
    hasCompletedOnboarding: !!consultantProfile?.company_name,
  };
};

export const useUserType = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['userType', user?.id] as const;

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    enabled: Boolean(user?.id),
    queryFn: () => fetchUserTypeData(user!.id),
    // Keep it fresh-ish without overfetching
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  const userType: UserType = data?.userType ?? null;
  const hasCompletedOnboarding = data?.hasCompletedOnboarding ?? false;

  const updateUserType = async (type: UserType) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ user_type: type })
      .eq('user_id', user.id);

    if (error) throw error;

    // Optimistic cache update + refetch onboarding status
    queryClient.setQueryData<UserTypeQueryData>(queryKey, (prev) => ({
      userType: type,
      hasCompletedOnboarding: prev?.hasCompletedOnboarding ?? false,
    }));

    await queryClient.invalidateQueries({ queryKey });
  };

  const refreshUserType = async () => {
    if (!user?.id) return;
    await queryClient.invalidateQueries({ queryKey });
  };

  return {
    userType,
    loading: Boolean(user?.id) ? isLoading || isFetching : false,
    hasCompletedOnboarding,
    updateUserType,
    refreshUserType,
    isRestaurant: userType === 'restaurant_owner',
    isConsultant: userType === 'consultant',
  };
};
