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

  const handleSuccessfulLogin = async (session: Session, currentPath: string) => {
    console.log('🚀 handleSuccessfulLogin called:', {
      userId: session?.user?.id,
      currentPath,
    });

    // We intentionally avoid any backend calls here.
    // Those calls were causing the app to hang right after login.
    // Instead, we navigate immediately and let route guards/hooks fetch what they need.

    const protectedPrefixes = ['/r/', '/c/', '/diagnosis', '/onboarding'];
    const isInProtectedRoute = protectedPrefixes.some((prefix) => currentPath.startsWith(prefix));
    if (!session?.user || isInProtectedRoute) {
      console.log('❌ Navigation skipped:', { currentPath, hasUser: !!session?.user, isInProtectedRoute });
      return;
    }

    // If user was redirected to /auth from a protected page, go back there first.
    const fromPath = (location.state as any)?.from?.pathname as string | undefined;
    if (fromPath && fromPath !== '/auth') {
      console.log('↩️ Returning to protected route:', fromPath);
      navigate(fromPath, { replace: true });
      return;
    }

    const meta = (session.user.user_metadata ?? {}) as Record<string, any>;
    const metaUserType = meta.user_type;

    // Navigate to a safe default; guards will redirect if onboarding is incomplete.
    if (metaUserType === 'consultant') {
      console.log('🎯 Navigating to /c/dashboard (guard will redirect if needed)');
      navigate('/c/dashboard', { replace: true });
      return;
    }

    if (metaUserType === 'restaurant_owner') {
      console.log('🎯 Navigating to /r/dashboard (guard will redirect if needed)');
      navigate('/r/dashboard', { replace: true });
      return;
    }

    console.log('🎯 No user_type in metadata, navigating to /onboarding');
    navigate('/onboarding', { replace: true });
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state change:', { 
          event, 
          userId: session?.user?.id,
          hasSession: !!session 
        });
        
        // CRITICAL: Only synchronous state updates in callback to prevent deadlock
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Defer navigation/Supabase calls with setTimeout to prevent deadlock
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ SIGNED_IN event detected, deferring handleSuccessfulLogin');
          setTimeout(() => {
            handleSuccessfulLogin(session, window.location.pathname);
          }, 0);
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📋 Initial session check:', { hasSession: !!session, userId: session?.user?.id });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // If already logged in on page load at /auth, navigate appropriately
      if (session && window.location.pathname === '/auth') {
        setTimeout(() => {
          handleSuccessfulLogin(session, '/auth');
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
