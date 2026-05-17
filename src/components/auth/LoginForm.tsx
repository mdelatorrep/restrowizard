import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useZodForm } from '@/lib/forms';

const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'El email es obligatorio' })
    .email({ message: 'Email no válido' })
    .max(255),
  password: z
    .string()
    .min(1, { message: 'La contraseña es obligatoria' })
    .max(72),
});
type LoginValues = z.infer<typeof LoginSchema>;

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn } = useAuth();

  const form = useZodForm<LoginValues>(LoginSchema, {
    defaultValues: { email: '', password: '' },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values.email, values.password);
    } catch (error) {
      console.error('Login error:', error);
    }
  });

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
    } catch {
      toast.error('Error al enviar el enlace. Verifica tu correo.');
    } finally {
      setResetLoading(false);
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
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="email" className="font-lato-medium">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              aria-invalid={!!errors.email}
              className={`font-lato-regular ${errors.email ? 'border-destructive' : ''}`}
              disabled={isSubmitting}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password" className="font-lato-medium">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                className={`font-lato-regular pr-10 ${errors.password ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
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
          <Button type="submit" className="w-full font-lato-bold" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Iniciando...</>
            ) : 'Iniciar Sesión'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
