import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UserType = 'restaurant_owner' | 'consultant' | null;

export const useUserType = () => {
  const { user } = useAuth();
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const fetchUserType = async () => {
      if (!user) {
        setUserType(null);
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        // Cast the string to UserType since DB stores it as text
        const type = profile?.user_type as UserType;
        setUserType(type);

        // Check if onboarding is completed based on user type
        if (type === 'restaurant_owner') {
          const { data: business } = await supabase
            .from('restaurant_businesses')
            .select('id')
            .eq('owner_id', user.id)
            .single();
          setHasCompletedOnboarding(!!business);
        } else if (type === 'consultant') {
          const { data: consultantProfile } = await supabase
            .from('consultant_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();
          setHasCompletedOnboarding(!!consultantProfile);
        }
      } catch (error) {
        console.error('Error fetching user type:', error);
        setUserType(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserType();
  }, [user]);

  const updateUserType = async (type: UserType) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: type })
        .eq('user_id', user.id);

      if (error) throw error;
      setUserType(type);
    } catch (error) {
      console.error('Error updating user type:', error);
      throw error;
    }
  };

  return {
    userType,
    loading,
    hasCompletedOnboarding,
    updateUserType,
    isRestaurant: userType === 'restaurant_owner',
    isConsultant: userType === 'consultant',
  };
};
