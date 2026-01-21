import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';

export type UserType = 'restaurant_owner' | 'consultant';

export const useAuth = () => {
  // Use AuthProvider context instead of managing own state
  const { user, session, loading } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    userType: UserType = 'restaurant_owner',
    restaurantName?: string
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            restaurant_name: restaurantName,
            user_type: userType
          }
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "¡Registro exitoso!",
        description: userType === 'consultant' 
          ? "Bienvenido consultor. Completa tu perfil para comenzar."
          : "Revisa tu email para confirmar tu cuenta.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error en el registro",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Starting signIn process:', { email });
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('📡 Supabase signIn response:', { error });
      
      if (error) {
        console.error('❌ Supabase auth error:', error);
        throw error;
      }
      
      console.log('✅ signIn successful, showing toast');
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión correctamente.",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('💥 signIn catch block:', error);
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error con Google",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  /**
   * Comprehensive sign out that clears:
   * 1. Supabase session (server + localStorage tokens)
   * 2. React Query cache (userType, profiles, business data, etc.)
   * 3. Custom localStorage keys (invitation tokens, refs)
   * 4. Service worker caches (to prevent stale auth responses)
   */
  const signOut = async () => {
    console.log('🚪 Starting comprehensive signOut...');
    
    try {
      // 1. Sign out from Supabase (clears sb-* localStorage keys)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Supabase signOut error:', error);
        throw error;
      }
      console.log('✅ Supabase session cleared');

      // 2. Clear React Query cache completely
      queryClient.clear();
      console.log('✅ React Query cache cleared');

      // 3. Clear custom localStorage keys that might cause stale state
      const keysToRemove = [
        'consultantRef',
        'clientInviteToken',
        'activeClientId', // in case we store active client for consultants
      ];
      keysToRemove.forEach((key) => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`✅ Removed localStorage key: ${key}`);
        }
      });

      // 4. Clear service worker caches to prevent stale auth data
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const dynamicCaches = cacheNames.filter(
            (name) => name.includes('dynamic') || name.includes('restrowizard')
          );
          await Promise.all(dynamicCaches.map((name) => caches.delete(name)));
          console.log('✅ Service worker caches cleared:', dynamicCaches);
        } catch (cacheError) {
          console.warn('⚠️ Could not clear SW caches:', cacheError);
        }
      }

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });

      // 5. Force navigation to home page to ensure clean state
      // Using window.location for a hard refresh ensures no stale React state
      console.log('🏠 Redirecting to home...');
      window.location.href = '/';
    } catch (error: any) {
      console.error('💥 signOut error:', error);
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
      
      // Even on error, try to force a clean state
      queryClient.clear();
      window.location.href = '/';
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
};
