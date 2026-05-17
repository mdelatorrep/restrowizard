import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Users, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useZodForm } from '@/lib/forms';

type UserType = 'restaurant_owner' | 'consultant';

interface SignupFormProps {
  consultantRef?: string | null;
  inviteToken?: string | null;
}

const SignupSchema = z.object({
  fullName: z.string().trim().min(1, { message: 'El nombre es obligatorio' }).max(100),
  email: z.string().trim().min(1, { message: 'El email es obligatorio' }).email({ message: 'Email no válido' }).max(255),
  password: z.string().min(6, { message: 'Mínimo 6 caracteres' }).max(72),
  restaurantName: z.string().trim().max(120).optional().or(z.literal('')),
});
type SignupValues = z.infer<typeof SignupSchema>;

export const SignupForm: React.FC<SignupFormProps> = ({ consultantRef, inviteToken }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>('restaurant_owner');
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<SignupValues>(SignupSchema, {
    defaultValues: { fullName: '', email: '', password: '', restaurantName: '' },
  });

  useEffect(() => {
    if (consultantRef || inviteToken) setUserType('restaurant_owner');
  }, [consultantRef, inviteToken]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { error } = await signUp(
        values.email,
        values.password,
        values.fullName,
        userType,
        userType === 'restaurant_owner' ? values.restaurantName || undefined : undefined,
      );
      if (!error) {
        if (consultantRef) localStorage.setItem('consultantRef', consultantRef);
        if (inviteToken) localStorage.setItem('clientInviteToken', inviteToken);
      }
    } catch (e) {
      console.error('Signup error:', e);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Crear Cuenta</CardTitle>
        <CardDescription className="font-lato-light">
          Únete a RestroWizard y transforma tu negocio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label className="font-lato-medium">¿Qué tipo de cuenta necesitas?</Label>
          <RadioGroup
            value={userType}
            onValueChange={(value) => setUserType(value as UserType)}
            className="grid grid-cols-2 gap-3"
          >
            <Label
              htmlFor="restaurant_owner"
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                userType === 'restaurant_owner' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="restaurant_owner" id="restaurant_owner" className="sr-only" />
              <Building2 className={`h-8 w-8 ${userType === 'restaurant_owner' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-lato-bold text-sm text-center ${userType === 'restaurant_owner' ? 'text-primary' : ''}`}>
                Restaurante
              </span>
              <span className="text-xs text-muted-foreground text-center">Soy dueño o gerente</span>
            </Label>

            <Label
              htmlFor="consultant"
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                userType === 'consultant' ? 'border-secondary bg-secondary/5' : 'border-border hover:border-secondary/50'
              }`}
            >
              <RadioGroupItem value="consultant" id="consultant" className="sr-only" />
              <Users className={`h-8 w-8 ${userType === 'consultant' ? 'text-secondary' : 'text-muted-foreground'}`} />
              <span className={`font-lato-bold text-sm text-center ${userType === 'consultant' ? 'text-secondary' : ''}`}>
                Consultor
              </span>
              <span className="text-xs text-muted-foreground text-center">Asesoro restaurantes</span>
            </Label>
          </RadioGroup>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="fullName" className="font-lato-medium">Nombre Completo</Label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              className={`font-lato-regular ${errors.fullName ? 'border-destructive' : ''}`}
              disabled={isSubmitting}
              {...register('fullName')}
            />
            {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
          </div>

          {userType === 'restaurant_owner' && (
            <div>
              <Label htmlFor="restaurantName" className="font-lato-medium">
                Nombre del Restaurante (opcional)
              </Label>
              <Input
                id="restaurantName"
                type="text"
                className="font-lato-regular"
                disabled={isSubmitting}
                {...register('restaurantName')}
              />
            </div>
          )}

          <div>
            <Label htmlFor="signup-email" className="font-lato-medium">Email</Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={`font-lato-regular ${errors.email ? 'border-destructive' : ''}`}
              disabled={isSubmitting}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="signup-password" className="font-lato-medium">Contraseña</Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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

          <Button type="submit" className="w-full font-lato-bold" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creando cuenta...</>
            ) : `Crear Cuenta como ${userType === 'restaurant_owner' ? 'Restaurante' : 'Consultor'}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
