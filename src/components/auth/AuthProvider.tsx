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

    // Best-effort: if user came with a client invitation token, claim it now.
    // This prevents "invite → login/signup → nothing happens" loops.
    const claimPendingClientInvite = async () => {
      const token = localStorage.getItem('clientInviteToken');
      if (!token) return;

      try {
        const { error } = await supabase.rpc('claim_consultant_client', {
          p_invitation_token: token,
        });

        if (!error) {
          localStorage.removeItem('clientInviteToken');
          console.log('🔗 Client invite claimed successfully');
        } else {
          console.warn('⚠️ Could not claim client invite:', error);
        }
      } catch (e) {
        console.warn('⚠️ Could not claim client invite (exception):', e);
      }
    };

    // Ensure a public.profiles row exists for this user.
    // Some historical signups are missing it, which breaks user_type + onboarding routing.
    const ensureProfileRow = async () => {
      const meta = (session.user.user_metadata ?? {}) as Record<string, any>;

      const { data: existing, error: existingError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (existingError) throw existingError;

       if (!existing) {
         const { error: upsertError } = await supabase
           .from('profiles')
           .upsert(
             {
               user_id: session.user.id,
               full_name: typeof meta.full_name === 'string' ? meta.full_name : null,
               restaurant_name:
                 typeof meta.restaurant_name === 'string' ? meta.restaurant_name : null,
               user_type:
                 meta.user_type === 'consultant' || meta.user_type === 'restaurant_owner'
                   ? meta.user_type
                   : null,
             },
             { onConflict: 'user_id' }
           );

         if (upsertError) throw upsertError;
         return;
       }

      // If the row exists but user_type is missing, hydrate from metadata when possible.
      if (
        !existing.user_type &&
        (meta.user_type === 'consultant' || meta.user_type === 'restaurant_owner')
      ) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_type: meta.user_type })
          .eq('user_id', session.user.id);

        if (updateError) throw updateError;
      }
    };
    
    // Skip if already in protected routes
    const protectedPrefixes = ['/r/', '/c/', '/diagnosis', '/onboarding'];
    const isInProtectedRoute = protectedPrefixes.some(prefix => currentPath.startsWith(prefix));
    
    if (session?.user && !isInProtectedRoute) {
      console.log('📍 Checking user type for navigation...');

      // Attempt invite claim without blocking the rest of navigation
      await claimPendingClientInvite();
      
       // Small delay to ensure profile trigger has completed
       await new Promise(resolve => setTimeout(resolve, 500));
       
       try {
         // Make sure profiles row exists (some accounts were created without it)
         await ensureProfileRow();

         // Get user profile to determine type (retry logic for new users)
         let profile = null;
         let retries = 3;
         
         while (retries > 0 && !profile) {
           const { data, error } = await supabase
             .from('profiles')
             .select('user_type')
             .eq('user_id', session.user.id)
             .maybeSingle();
           
           if (error) throw error;

           if (data) {
             profile = data;
             break;
           }

           // No row yet; wait briefly and retry
           if (retries > 1) {
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
            .select('id, company_name')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!consultantProfile || !consultantProfile.company_name) {
            console.log('🎯 Consultant without complete profile, navigating to /c/onboarding');
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
        currentPath,
        hasUser: !!session?.user,
        isInProtectedRoute
      });
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
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
        
        // Navigate on login events
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ SIGNED_IN event detected, calling handleSuccessfulLogin');
          // Use window.location.pathname for accurate current path
          await handleSuccessfulLogin(session, window.location.pathname);
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
        handleSuccessfulLogin(session, '/auth');
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
