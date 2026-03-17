import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';

export type UserType = 'restaurant_owner' | 'consultant';

/** Map common Supabase auth error messages to Spanish */
const translateAuthError = (message: string): string => {
  const map: Record<string, string> = {
    'Invalid login credentials': 'Correo o contraseña incorrectos',
    'Email not confirmed': 'Debes confirmar tu correo antes de iniciar sesión',
    'User not found': 'No se encontró una cuenta con ese correo',
    'Invalid email or password': 'Correo o contraseña incorrectos',
    'Email rate limit exceeded': 'Demasiados intentos. Espera unos minutos.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'User already registered': 'Ya existe una cuenta con ese correo',
    'Signup requires a valid password': 'Se requiere una contraseña válida',
    'Unable to validate email address: invalid format': 'Formato de correo no válido',
    'Anonymous sign-ins are disabled': 'El inicio de sesión anónimo no está habilitado',
    'Email link is invalid or has expired': 'El enlace ha expirado o no es válido',
    'Token has expired or is invalid': 'El enlace ha expirado o no es válido',
    'New password should be different from the old password': 'La nueva contraseña debe ser diferente a la anterior',
  };

  for (const [eng, esp] of Object.entries(map)) {
    if (message.toLowerCase().includes(eng.toLowerCase())) return esp;
  }
  return message;
};

export const useAuth = () => {
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
        description: translateAuthError(error.message),
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión correctamente.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión",
        description: translateAuthError(error.message),
        variant: "destructive",
      });
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` }
      });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error con Google",
        description: translateAuthError(error.message),
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();

      const keysToRemove = ['consultantRef', 'clientInviteToken', 'activeClientId'];
      keysToRemove.forEach((key) => {
        if (localStorage.getItem(key)) localStorage.removeItem(key);
      });

      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const dynamicCaches = cacheNames.filter(
            (name) => name.includes('dynamic') || name.includes('restrowizard')
          );
          await Promise.all(dynamicCaches.map((name) => caches.delete(name)));
        } catch {}
      }

      toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: translateAuthError(error.message),
        variant: "destructive",
      });
      queryClient.clear();
      window.location.href = '/';
    }
  };

  return { user, session, loading, signUp, signIn, signInWithGoogle, signOut };
};
