import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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

  const handleSuccessfulLogin = async (session: Session) => {
    console.log('🚀 handleSuccessfulLogin called:', { 
      userId: session?.user?.id, 
      currentPath: location.pathname 
    });
    
    // Skip if already in protected routes
    const protectedPrefixes = ['/r/', '/c/', '/diagnosis', '/onboarding'];
    const isInProtectedRoute = protectedPrefixes.some(prefix => location.pathname.startsWith(prefix));
    
    if (session?.user && !isInProtectedRoute) {
      console.log('📍 Checking user type for navigation...');
      
      // Small delay to ensure profile trigger has completed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Get user profile to determine type (retry logic for new users)
        let profile = null;
        let retries = 3;
        
        while (retries > 0 && !profile) {
          const { data, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', session.user.id)
            .single();
          
          if (data) {
            profile = data;
          } else if (error && retries > 1) {
            console.log('⏳ Profile not found yet, retrying...', retries - 1);
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          retries--;
        }

        console.log('🔍 User profile:', profile);

        if (!profile?.user_type) {
          // No profile yet, go to type selection onboarding
          console.log('🎯 No user type, navigating to /onboarding');
          navigate('/onboarding', { replace: true });
          return;
        }

        const userType = profile.user_type;

        // Check if user has completed type-specific onboarding
        if (userType === 'consultant') {
          const { data: consultantProfile } = await supabase
            .from('consultant_profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!consultantProfile) {
            console.log('🎯 Consultant without profile, navigating to /c/onboarding');
            navigate('/c/onboarding', { replace: true });
          } else {
            console.log('🎯 Consultant with profile, navigating to /c/dashboard');
            navigate('/c/dashboard', { replace: true });
          }
        } else {
          // Restaurant owner - check for business first
          const { data: business } = await supabase
            .from('restaurant_businesses')
            .select('id')
            .eq('owner_id', session.user.id)
            .maybeSingle();

          if (!business) {
            console.log('🎯 Restaurant owner without business, navigating to /r/onboarding');
            navigate('/r/onboarding', { replace: true });
            return;
          }

          // Check for maturity diagnosis
          const { data: diagnosis } = await supabase
            .from('maturity_diagnoses')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!diagnosis) {
            console.log('🎯 Restaurant owner without diagnosis, navigating to /diagnosis');
            navigate('/diagnosis', { replace: true });
          } else {
            console.log('🎯 Restaurant owner with diagnosis, navigating to /r/dashboard');
            navigate('/r/dashboard', { replace: true });
          }
        }
      } catch (error) {
        console.error('💥 Error during navigation:', error);
        navigate('/onboarding', { replace: true });
      }
    } else {
      console.log('❌ Navigation skipped:', {
        currentPath: location.pathname,
        hasUser: !!session?.user,
        isInProtectedRoute
      });
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
        console.log('🔄 Auth state change:', { 
          event, 
          userId: session?.user?.id,
          hasSession: !!session 
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Solo navegar en eventos de login activo, no en carga inicial
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ SIGNED_IN event detected, calling handleSuccessfulLogin');
          await handleSuccessfulLogin(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
