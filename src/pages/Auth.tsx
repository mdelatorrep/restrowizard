import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    restaurantName: '' 
  });
  
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const { checkUserDiagnosis } = useDashboard();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await signIn(loginForm.email, loginForm.password);
    
    if (!result.error) {
      // Obtener el usuario directamente de Supabase después del login
      setTimeout(async () => {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error) throw error;
          
          if (user) {
            const hasDiagnosis = await checkUserDiagnosis(user.id);
            navigate(hasDiagnosis ? '/dashboard' : '/diagnosis', { replace: true });
          } else {
            navigate('/diagnosis', { replace: true });
          }
        } catch (error) {
          console.error('Error during navigation:', error);
          navigate('/diagnosis', { replace: true });
        }
      }, 500);
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await signUp(
      signupForm.email, 
      signupForm.password, 
      signupForm.fullName,
      signupForm.restaurantName
    );
    
    if (!result.error) {
      setTimeout(async () => {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error) throw error;
          
          if (user) {
            const hasDiagnosis = await checkUserDiagnosis(user.id);
            navigate(hasDiagnosis ? '/dashboard' : '/diagnosis', { replace: true });
          } else {
            navigate('/diagnosis', { replace: true });
          }
        } catch (error) {
          console.error('Error during navigation:', error);
          navigate('/diagnosis', { replace: true });
        }
      }, 500);
    }
    
    setIsLoading(false);
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    const result = await signInWithGoogle();
    
    if (!result.error) {
      setTimeout(async () => {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error) throw error;
          
          if (user) {
            const hasDiagnosis = await checkUserDiagnosis(user.id);
            navigate(hasDiagnosis ? '/dashboard' : '/diagnosis', { replace: true });
          } else {
            navigate('/diagnosis', { replace: true });
          }
        } catch (error) {
          console.error('Error during navigation:', error);
          navigate('/diagnosis', { replace: true });
        }
      }, 500);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">RestroWizard</h1>
          <p className="text-muted-foreground font-lato-light">
            La magia de la IA para tu restaurante
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Iniciar Sesión</CardTitle>
                <CardDescription className="font-lato-light">
                  Ingresa a tu cuenta de RestroWizard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="font-lato-medium">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                      className="font-lato-regular"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="font-lato-medium">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                      className="font-lato-regular"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full font-lato-bold" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                  </Button>
                </form>
                
                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground font-lato-light">
                        O continúa con
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="w-full mt-4 font-lato-medium"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar con Google
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Crear Cuenta</CardTitle>
                <CardDescription className="font-lato-light">
                  Únete a RestroWizard y transforma tu restaurante
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name" className="font-lato-medium">Nombre Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                      required
                      className="font-lato-regular"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-restaurant" className="font-lato-medium">Nombre del Restaurante (opcional)</Label>
                    <Input
                      id="signup-restaurant"
                      type="text"
                      value={signupForm.restaurantName}
                      onChange={(e) => setSignupForm({ ...signupForm, restaurantName: e.target.value })}
                      className="font-lato-regular"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email" className="font-lato-medium">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                      className="font-lato-regular"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="font-lato-medium">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      required
                      className="font-lato-regular"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full font-lato-bold" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>
                
                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground font-lato-light">
                        O continúa con
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="w-full mt-4 font-lato-medium"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar con Google
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;