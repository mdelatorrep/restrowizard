import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConsultantClients } from '@/hooks/useConsultantClients';
import { useUserType } from '@/hooks/useUserType';

interface ClientData {
  id: string;
  client_user_id: string;
  status: string;
  monthly_fee: number | null;
  business?: {
    name: string;
    city: string | null;
    cuisine_type: string | null;
    employee_count: number | null;
  };
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  diagnosis?: {
    overall_score: number;
    overall_level: string;
  };
  alerts_count?: number;
}

interface ActiveClientContextType {
  activeClient: ClientData | null;
  setActiveClient: (client: ClientData | null) => void;
  isConsultantMode: boolean;
  clients: ClientData[];
  loading: boolean;
  clearActiveClient: () => void;
}

const ActiveClientContext = createContext<ActiveClientContextType | undefined>(undefined);

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

  return (
    <ActiveClientContext.Provider 
      value={{ 
        activeClient, 
        setActiveClient, 
        isConsultantMode, 
        clients: clients as ClientData[], 
        loading,
        clearActiveClient
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
