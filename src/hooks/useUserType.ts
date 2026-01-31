import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UserType = 'restaurant_owner' | 'consultant' | null;

type UserTypeQueryData = {
  userType: UserType;
  hasCompletedOnboarding: boolean;
};

const fetchUserTypeData = async (userId: string, metaUserType?: string): Promise<UserTypeQueryData> => {
  console.log('📊 [useUserType] fetchUserTypeData called for userId:', userId, 'metaUserType:', metaUserType);
  
  // First, try to use metadata if available (avoids DB call)
  const type: UserType = metaUserType === 'restaurant_owner' || metaUserType === 'consultant' 
    ? metaUserType 
    : null;

  // If we have a type from metadata, check onboarding status
  if (type === 'restaurant_owner') {
    const { data: business, error } = await supabase
      .from('restaurant_businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    console.log('📊 [useUserType] restaurant_businesses query result:', { business, error });

    if (error) {
      console.error('📊 [useUserType] Error fetching business:', error);
      // Don't throw - return incomplete status
      return { userType: type, hasCompletedOnboarding: false };
    }

    return { userType: type, hasCompletedOnboarding: !!business };
  }

  if (type === 'consultant') {
    const { data: consultantProfile, error } = await supabase
      .from('consultant_profiles')
      .select('id, company_name')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('📊 [useUserType] consultant_profiles query result:', { consultantProfile, error });

    if (error) {
      console.error('📊 [useUserType] Error fetching consultant profile:', error);
      return { userType: type, hasCompletedOnboarding: false };
    }

    return {
      userType: type,
      hasCompletedOnboarding: !!consultantProfile?.company_name,
    };
  }

  // No type in metadata - fall back to checking profiles table
  console.log('📊 [useUserType] No type in metadata, checking profiles table...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('📊 [useUserType] profiles query result:', { profile, profileError });

  if (profileError) {
    console.error('📊 [useUserType] Error fetching profile:', profileError);
    return { userType: null, hasCompletedOnboarding: false };
  }

  const profileType = (profile?.user_type as UserType) ?? null;

  if (!profileType) {
    console.log('📊 [useUserType] No user_type found, returning incomplete');
    return { userType: null, hasCompletedOnboarding: false };
  }

  // Check onboarding for the type found in profile
  if (profileType === 'restaurant_owner') {
    const { data: business } = await supabase
      .from('restaurant_businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    return { userType: profileType, hasCompletedOnboarding: !!business };
  }

  const { data: consultantProfile } = await supabase
    .from('consultant_profiles')
    .select('id, company_name')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    userType: profileType,
    hasCompletedOnboarding: !!consultantProfile?.company_name,
  };
};

export const useUserType = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Extract user_type from metadata if available
  const metaUserType = (user?.user_metadata as Record<string, any>)?.user_type;

  const queryKey = ['userType', user?.id] as const;

  const { data, isLoading, isFetched, isError } = useQuery({
    queryKey,
    enabled: Boolean(user?.id),
    queryFn: () => fetchUserTypeData(user!.id, metaUserType),
    staleTime: 5_000,
    refetchOnWindowFocus: false,
    retry: 1,
    // Add a timeout to prevent hanging forever
    gcTime: 30_000,
  });

  const userType: UserType = data?.userType ?? null;
  const hasCompletedOnboarding = data?.hasCompletedOnboarding ?? false;

  // isReady means we have fetched at least once (even if result is null) OR there was an error
  const isReady = Boolean(user?.id) ? (isFetched || isError) : true;

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
