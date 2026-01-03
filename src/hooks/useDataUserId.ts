import { useActiveClient } from '@/contexts/ActiveClientContext';
import { useAuthContext } from '@/components/auth/AuthProvider';

/**
 * Hook that returns the correct user_id to use for data queries.
 * For consultants working on a client, it returns the client's user_id.
 * For restaurant owners, it returns their own user_id.
 */
export const useDataUserId = () => {
  const { user } = useAuthContext();
  const { activeClient, isConsultantMode } = useActiveClient();

  // If consultant mode and has active client, use client's user_id
  if (isConsultantMode && activeClient) {
    return {
      userId: activeClient.client_user_id,
      isViewingClient: true,
      clientName: activeClient.business?.name || 'Cliente',
    };
  }

  // Otherwise use own user_id
  return {
    userId: user?.id || null,
    isViewingClient: false,
    clientName: null,
  };
};

