import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDashboard } from '@/hooks/useDashboard';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { checkUserDiagnosis } = useDashboard();

  const handleSuccessfulLogin = async (session: Session) => {
    // Solo navegar si estamos en la página de auth y hay una sesión activa
    if (location.pathname === '/auth' && session?.user) {
      try {
        const hasDiagnosis = await checkUserDiagnosis(session.user.id);
        navigate(hasDiagnosis ? '/dashboard' : '/diagnosis', { replace: true });
      } catch (error) {
        console.error('Error during navigation:', error);
        navigate('/diagnosis', { replace: true });
      }
    }
  };

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Configurar listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Solo navegar en eventos de login activo, no en carga inicial
        if (event === 'SIGNED_IN' && session) {
          await handleSuccessfulLogin(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // Sin dependencias para evitar reinicializaciones

  const value = {
    user,
    session,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};