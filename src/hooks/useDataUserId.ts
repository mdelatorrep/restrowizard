import { useContext } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { ActiveClientContext } from '@/contexts/ActiveClientContext';

/**
 * Hook that returns the correct user_id to use for data queries.
 * For consultants working on a client, it returns the client's user_id.
 * For restaurant owners, it returns their own user_id.
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

