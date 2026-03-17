import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Users, Eye, EyeOff, Loader2 } from 'lucide-react';

type UserType = 'restaurant_owner' | 'consultant';

interface SignupFormProps {
  consultantRef?: string | null;
  inviteToken?: string | null;
}

export const SignupForm: React.FC<SignupFormProps> = ({ consultantRef, inviteToken }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>('restaurant_owner');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    restaurantName: '' 
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { signUp } = useAuth();

  useEffect(() => {
    if (consultantRef || inviteToken) {
      setUserType('restaurant_owner');
    }
  }, [consultantRef, inviteToken]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = 'El nombre es obligatorio';
    if (!formData.email) errors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email no válido';
    if (!formData.password) errors.password = 'La contraseña es obligatoria';
    else if (formData.password.length < 6) errors.password = 'Mínimo 6 caracteres';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    
    try {
      const { error } = await signUp(
        formData.email, 
        formData.password, 
        formData.fullName,
        userType,
        userType === 'restaurant_owner' ? formData.restaurantName : undefined
      );

      if (!error) {
        if (consultantRef) localStorage.setItem('consultantRef', consultantRef);
        if (inviteToken) localStorage.setItem('clientInviteToken', inviteToken);
      }
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Crear Cuenta</CardTitle>
        <CardDescription className="font-lato-light">
          Únete a RestroWizard y transforma tu negocio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Type Selection */}
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
                userType === 'restaurant_owner' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="restaurant_owner" id="restaurant_owner" className="sr-only" />
              <Building2 className={`h-8 w-8 ${userType === 'restaurant_owner' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-lato-bold text-sm text-center ${userType === 'restaurant_owner' ? 'text-primary' : ''}`}>
                Restaurante
              </span>
              <span className="text-xs text-muted-foreground text-center">
                Soy dueño o gerente
              </span>
            </Label>
            
            <Label 
              htmlFor="consultant"
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                userType === 'consultant' 
                  ? 'border-secondary bg-secondary/5' 
                  : 'border-border hover:border-secondary/50'
              }`}
            >
              <RadioGroupItem value="consultant" id="consultant" className="sr-only" />
              <Users className={`h-8 w-8 ${userType === 'consultant' ? 'text-secondary' : 'text-muted-foreground'}`} />
              <span className={`font-lato-bold text-sm text-center ${userType === 'consultant' ? 'text-secondary' : ''}`}>
                Consultor
              </span>
              <span className="text-xs text-muted-foreground text-center">
                Asesoro restaurantes
              </span>
            </Label>
          </RadioGroup>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="font-lato-medium">Nombre Completo</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={`font-lato-regular ${fieldErrors.fullName ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
            {fieldErrors.fullName && <p className="text-xs text-destructive mt-1">{fieldErrors.fullName}</p>}
          </div>
          
          {userType === 'restaurant_owner' && (
            <div>
              <Label htmlFor="restaurantName" className="font-lato-medium">
                Nombre del Restaurante (opcional)
              </Label>
              <Input
                id="restaurantName"
                type="text"
                value={formData.restaurantName}
                onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                className="font-lato-regular"
                disabled={isLoading}
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="signup-email" className="font-lato-medium">Email</Label>
            <Input
              id="signup-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`font-lato-regular ${fieldErrors.email ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
            {fieldErrors.email && <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <Label htmlFor="signup-password" className="font-lato-medium">Contraseña</Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                minLength={6}
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
          <Button 
            type="submit" 
            className="w-full font-lato-bold" 
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creando cuenta...</>
            ) : `Crear Cuenta como ${userType === 'restaurant_owner' ? 'Restaurante' : 'Consultor'}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
