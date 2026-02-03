import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConsultantClients } from '@/hooks/useConsultantClients';
import { useUserType } from '@/hooks/useUserType';

interface ClientData {
  id: string;
  client_user_id: string | null;
  status: string;
  monthly_fee: number | null;
  // Direct restaurant info (consultant-managed)
  restaurant_name?: string | null;
  restaurant_city?: string | null;
  restaurant_cuisine_type?: string | null;
  restaurant_email?: string | null;
  invitation_token?: string | null;
  claimed_at?: string | null;
  // Joined data (for linked clients)
  business?: {
    name: string;
    city: string | null;
    cuisine_type: string | null;
    employee_count: number | null;
  } | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  diagnosis?: {
    overall_score: number;
    overall_level: string;
  } | null;
  alerts_count?: number;
}

interface ActiveClientContextType {
  activeClient: ClientData | null;
  setActiveClient: (client: ClientData | null) => void;
  isConsultantMode: boolean;
  clients: ClientData[];
  loading: boolean;
  clearActiveClient: () => void;
  // Helper to get display name for a client
  getClientDisplayName: (client: ClientData | null) => string;
  getClientCity: (client: ClientData | null) => string;
}

// Export the context for direct useContext access (avoids throwing when provider is missing)
export const ActiveClientContext = createContext<ActiveClientContextType | undefined>(undefined);

export const ActiveClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userType } = useUserType();
  const { clients, loading } = useConsultantClients();
  const [activeClient, setActiveClientState] = useState<ClientData | null>(null);

  const isConsultantMode = userType === 'consultant';

  // Persist active client selection in localStorage
  useEffect(() => {
    if (isConsultantMode) {
      const saved = localStorage.getItem('activeClientId');
      if (saved && clients.length > 0) {
        const found = clients.find(c => c.id === saved);
        if (found) {
          setActiveClientState(found as ClientData);
        }
      }
    }
  }, [clients, isConsultantMode]);

  const setActiveClient = (client: ClientData | null) => {
    setActiveClientState(client);
    if (client) {
      localStorage.setItem('activeClientId', client.id);
    } else {
      localStorage.removeItem('activeClientId');
    }
  };

  const clearActiveClient = () => {
    setActiveClientState(null);
    localStorage.removeItem('activeClientId');
  };

  // Helper to get display name - works for both linked and unlinked clients
  const getClientDisplayName = (client: ClientData | null): string => {
    if (!client) return 'Sin cliente';
    return client.business?.name || client.restaurant_name || 'Sin nombre';
  };

  // Helper to get city
  const getClientCity = (client: ClientData | null): string => {
    if (!client) return '';
    return client.business?.city || client.restaurant_city || '';
  };

  return (
    <ActiveClientContext.Provider 
      value={{ 
        activeClient, 
        setActiveClient, 
        isConsultantMode, 
        clients: clients as ClientData[], 
        loading,
        clearActiveClient,
        getClientDisplayName,
        getClientCity
      }}
    >
      {children}
    </ActiveClientContext.Provider>
  );
};

export const useActiveClient = () => {
  const context = useContext(ActiveClientContext);
  if (context === undefined) {
    throw new Error('useActiveClient must be used within an ActiveClientProvider');
  }
  return context;
};
