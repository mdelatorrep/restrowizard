import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn } = useAuth();

  const validate = () => {
    const errors: typeof fieldErrors = {};
    if (!formData.email) errors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email no válido';
    if (!formData.password) errors.password = 'La contraseña es obligatoria';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !validate()) return;
    setIsLoading(true);
    try {
      await signIn(formData.email, formData.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success('Se envió un enlace de recuperación a tu correo');
      setShowReset(false);
      setResetEmail('');
    } catch (error: any) {
      toast.error('Error al enviar el enlace. Verifica tu correo.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (showReset) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recuperar Contraseña</CardTitle>
          <CardDescription className="font-lato-light">
            Te enviaremos un enlace para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label htmlFor="reset-email" className="font-lato-medium">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="tu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="font-lato-regular"
                disabled={resetLoading}
              />
            </div>
            <Button type="submit" className="w-full font-lato-bold" disabled={resetLoading}>
              {resetLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</>
              ) : 'Enviar enlace de recuperación'}
            </Button>
            <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => setShowReset(false)}>
              Volver a Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Iniciar Sesión</CardTitle>
        <CardDescription className="font-lato-light">
          Ingresa a tu cuenta de RestroWizard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="font-lato-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`font-lato-regular ${fieldErrors.email ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
            {fieldErrors.email && <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <Label htmlFor="password" className="font-lato-medium">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`font-lato-regular pr-10 ${fieldErrors.password ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>}
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="text-sm text-primary hover:underline font-lato-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <Button type="submit" className="w-full font-lato-bold" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Iniciando...</>
            ) : 'Iniciar Sesión'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
