import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UserType = 'restaurant_owner' | 'consultant' | null;

type UserTypeQueryData = {
  userType: UserType;
  hasCompletedOnboarding: boolean;
};

const fetchUserTypeData = async (userId: string): Promise<UserTypeQueryData> => {
  console.log('📊 [useUserType] fetchUserTypeData called for userId:', userId);
  
  // Fetch profile - should always exist due to trigger
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('📊 [useUserType] profiles query result:', { profile, profileError });

  if (profileError) throw profileError;

  const type = (profile?.user_type as UserType) ?? null;

  if (!type) {
    console.log('📊 [useUserType] No user_type found, returning incomplete');
    return { userType: null, hasCompletedOnboarding: false };
  }

  if (type === 'restaurant_owner') {
    const { data: business, error } = await supabase
      .from('restaurant_businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    console.log('📊 [useUserType] restaurant_businesses query result:', { business, error });

    if (error) throw error;

    const result = { userType: type, hasCompletedOnboarding: !!business };
    console.log('📊 [useUserType] Returning for restaurant_owner:', result);
    return result;
  }

  // Consultant - check if they have a company_name set
  const { data: consultantProfile, error } = await supabase
    .from('consultant_profiles')
    .select('id, company_name')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('📊 [useUserType] consultant_profiles query result:', { consultantProfile, error });

  if (error) throw error;

  const result = {
    userType: type,
    hasCompletedOnboarding: !!consultantProfile?.company_name,
  };
  console.log('📊 [useUserType] Returning for consultant:', result);
  return result;
};

export const useUserType = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['userType', user?.id] as const;

  const { data, isLoading, isFetched } = useQuery({
    queryKey,
    enabled: Boolean(user?.id),
    queryFn: () => fetchUserTypeData(user!.id),
    staleTime: 5_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const userType: UserType = data?.userType ?? null;
  const hasCompletedOnboarding = data?.hasCompletedOnboarding ?? false;

  // isReady means we have fetched at least once (even if result is null)
  const isReady = Boolean(user?.id) ? isFetched : true;

  const updateUserType = async (type: UserType) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .upsert(
        { user_id: user.id, user_type: type },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    queryClient.setQueryData<UserTypeQueryData>(queryKey, (prev) => ({
      userType: type,
      hasCompletedOnboarding: prev?.hasCompletedOnboarding ?? false,
    }));

    await queryClient.invalidateQueries({ queryKey });
  };

  const refreshUserType = async () => {
    if (!user?.id) return;
    await queryClient.invalidateQueries({ queryKey });
    // Wait for refetch to complete
    await queryClient.refetchQueries({ queryKey });
  };

  return {
    userType,
    loading: Boolean(user?.id) && isLoading,
    isReady,
    hasCompletedOnboarding,
    updateUserType,
    refreshUserType,
    isRestaurant: userType === 'restaurant_owner',
    isConsultant: userType === 'consultant',
  };
};
