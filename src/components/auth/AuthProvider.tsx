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
      currentPath 
    });

    // Skip if already in protected routes
    const protectedPrefixes = ['/r/', '/c/', '/diagnosis', '/onboarding'];
    const isInProtectedRoute = protectedPrefixes.some(prefix => currentPath.startsWith(prefix));
    
    if (!session?.user || isInProtectedRoute) {
      console.log('❌ Navigation skipped:', { currentPath, hasUser: !!session?.user, isInProtectedRoute });
      return;
    }

    console.log('📍 Checking user type for navigation...');

    try {
      // Best-effort: claim pending client invite
      const token = localStorage.getItem('clientInviteToken');
      if (token) {
        try {
          const { error } = await supabase.rpc('claim_consultant_client', { p_invitation_token: token });
          if (!error) {
            localStorage.removeItem('clientInviteToken');
            console.log('🔗 Client invite claimed successfully');
          }
        } catch (e) {
          console.warn('⚠️ Could not claim client invite:', e);
        }
      }

      // Small delay to ensure profile trigger has completed
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get user profile
      console.log('🔍 Fetching profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', session.user.id)
        .maybeSingle();

      console.log('📋 Profile result:', { profile, profileError });

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        throw profileError;
      }

      if (!profile?.user_type) {
        console.log('🎯 No user type, navigating to /onboarding');
        navigate('/onboarding', { replace: true });
        return;
      }

      const userType = profile.user_type;
      console.log('👤 User type:', userType);

      if (userType === 'consultant') {
        console.log('🔍 Fetching consultant profile...');
        const { data: consultantProfile, error: cpError } = await supabase
          .from('consultant_profiles')
          .select('id, company_name')
          .eq('user_id', session.user.id)
          .maybeSingle();

        console.log('📋 Consultant profile result:', { consultantProfile, cpError });

        if (!consultantProfile || !consultantProfile.company_name) {
          console.log('🎯 Navigating to /c/onboarding');
          navigate('/c/onboarding', { replace: true });
        } else {
          console.log('🎯 Navigating to /c/dashboard');
          navigate('/c/dashboard', { replace: true });
        }
      } else {
        // Restaurant owner
        console.log('🔍 Fetching restaurant business...');
        const { data: business, error: bizError } = await supabase
          .from('restaurant_businesses')
          .select('id')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        console.log('📋 Business result:', { business, bizError });

        if (!business) {
          console.log('🎯 Navigating to /r/onboarding');
          navigate('/r/onboarding', { replace: true });
          return;
        }

        // Check for maturity diagnosis
        console.log('🔍 Fetching diagnosis...');
        const { data: diagnosis, error: diagError } = await supabase
          .from('maturity_diagnoses')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        console.log('📋 Diagnosis result:', { diagnosis, diagError });

        if (!diagnosis) {
          console.log('🎯 Navigating to /diagnosis');
          navigate('/diagnosis', { replace: true });
        } else {
          console.log('🎯 Navigating to /r/dashboard');
          navigate('/r/dashboard', { replace: true });
        }
      }
    } catch (error) {
      console.error('💥 Error during navigation:', error);
      navigate('/onboarding', { replace: true });
    }
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
