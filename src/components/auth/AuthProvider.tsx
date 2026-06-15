import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';



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

    // Check for team invitation token
    const teamInviteToken = localStorage.getItem('teamInviteToken');
    if (teamInviteToken) {
      console.log('🎟️ Found team invite token, claiming...');
      try {
        const { data, error } = await supabase.rpc('claim_team_invitation', {
          p_token: teamInviteToken
        });
        
        const result = data as { success?: boolean; error?: string; business_id?: string } | null;
        
        if (error) {
          console.error('❌ Team invitation claim error:', error);
        } else if (result?.success) {
          console.log('✅ Team invitation claimed:', result);
          localStorage.removeItem('teamInviteToken');
          // Navigate to restaurant dashboard
          navigate('/r/dashboard', { replace: true });
          return;
        } else {
          console.warn('⚠️ Team invitation claim failed:', result?.error);
        }
      } catch (err) {
        console.error('💥 Team invitation claim exception:', err);
      }
      localStorage.removeItem('teamInviteToken');
    }

    // We intentionally avoid any other backend calls here.
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('📋 Initial session check:', { hasSession: !!session, userId: session?.user?.id });

      // Set session FIRST so route guards see the authenticated state and don't bounce to /auth.
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Validate user existence in the background; only clear session if the server
      // explicitly says the user is gone (404/user_not_found). A transient network
      // error must NOT log the user out.
      if (session) {
        try {
          const { data: { user: validUser }, error: userError } = await supabase.auth.getUser();
          const msg = (userError?.message || '').toLowerCase();
          const isUserGone =
            !validUser && !!userError && (
              msg.includes('user not found') ||
              msg.includes('user_not_found') ||
              (userError as any)?.status === 404 ||
              (userError as any)?.status === 403
            );
          if (isUserGone) {
            console.warn('⚠️ Session belongs to a deleted user. Clearing.');
            await supabase.auth.signOut({ scope: 'local' });
            setSession(null);
            setUser(null);
          }
        } catch (e) {
          // Network/transient error — keep the session and let the next request retry.
          console.warn('⚠️ Could not validate session right now, keeping it.', e);
        }
      }

      
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
