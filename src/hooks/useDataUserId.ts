import { logger } from '@/lib/logger';
import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { ActiveClientContext } from '@/contexts/ActiveClientContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that returns the correct user_id to use for data queries.
 * 
 * Priority:
 * 1. For consultants working on a client - returns the client's user_id
 * 2. For restaurant owners - returns their own user_id
 * 3. For team members - returns the owner's user_id of the business they belong to
 * 
 * This hook is safe to use even if ActiveClientProvider is not present -
 * it will simply fall back to the user's own ID.
 */
export const useDataUserId = () => {
  const { user } = useAuthContext();
  
  // Use useContext directly instead of useActiveClient to avoid throwing
  // when the provider is not present in the component tree
  const activeClientContext = useContext(ActiveClientContext);

  const activeClient = activeClientContext?.activeClient ?? null;
  const isConsultantMode = activeClientContext?.isConsultantMode ?? false;

  // Check if current user is a team member and get the owner's user_id
  const { data: teamMemberData } = useQuery({
    queryKey: ['team-member-owner', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // First check if user owns a business (they are the owner)
      const { data: ownedBusiness, error: ownerError } = await supabase
        .from('restaurant_businesses')
        .select('id, owner_id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (ownerError) {
        logger.warn('⚠️ [useDataUserId] Error checking ownership:', ownerError.message);
      }
      
      if (ownedBusiness) {
        // User is owner, no need to look up team membership
        return { isOwner: true, ownerId: user.id, businessId: ownedBusiness.id };
      }
      
      // Check if user is a team member
      const { data: membership } = await supabase
        .from('restaurant_team_members')
        .select(`
          business_id,
          role,
          restaurant_businesses!inner(id, owner_id, name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (membership) {
        const business = membership.restaurant_businesses as { id: string; owner_id: string; name: string };
        return {
          isOwner: false,
          ownerId: business.owner_id,
          businessId: business.id,
          businessName: business.name,
          role: membership.role
        };
      }
      
      return null;
    },
    enabled: !!user?.id && !isConsultantMode,
    staleTime: 5 * 60 * 1000
  });

  // If consultant mode and has active client, use client's user_id
  if (isConsultantMode && activeClient) {
    return {
      userId: activeClient.client_user_id,
      isViewingClient: true,
      clientName: activeClient.business?.name || 'Cliente',
      businessId: null,
      isTeamMember: false,
      teamRole: null
    };
  }

  // If user is a team member, use the owner's user_id for data queries
  if (teamMemberData && !teamMemberData.isOwner) {
    return {
      userId: teamMemberData.ownerId,
      isViewingClient: false,
      clientName: null,
      businessId: teamMemberData.businessId,
      isTeamMember: true,
      teamRole: teamMemberData.role,
      businessName: teamMemberData.businessName
    };
  }

  // Otherwise use own user_id (owner or no team membership)
  return {
    userId: user?.id || null,
    isViewingClient: false,
    clientName: null,
    businessId: teamMemberData?.businessId || null,
    isTeamMember: false,
    teamRole: null
  };
};

