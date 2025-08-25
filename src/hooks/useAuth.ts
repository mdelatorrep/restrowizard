import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/components/auth/AuthProvider';

export const useAuth = () => {
  // Use AuthProvider context instead of managing own state
  const { user, session, loading } = useAuthContext();
  const { toast } = useToast();

  const signUp = async (email: string, password: string, fullName: string, restaurantName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            restaurant_name: restaurantName
          }
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "¡Registro exitoso!",
        description: "Revisa tu email para confirmar tu cuenta.",
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

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
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