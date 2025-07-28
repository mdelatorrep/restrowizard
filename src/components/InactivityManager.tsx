import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import InactivityWarning from './InactivityWarning';

const InactivityManager: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isWarningActive, timeLeft, extendSession } = useInactivityTimer({
    timeout: 10, // 10 minutos
    warningTime: 30 // 30 segundos de aviso
  });

  // Solo mostrar para usuarios autenticados
  if (!user) return null;

  return (
    <InactivityWarning
      isOpen={isWarningActive}
      timeLeft={timeLeft}
      onExtend={extendSession}
      onLogout={signOut}
    />
  );
};

export default InactivityManager;