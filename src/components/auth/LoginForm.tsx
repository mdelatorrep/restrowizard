import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { signIn, user } = useAuth();

  // Let AuthProvider handle navigation, just manage loading state here

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    console.log('🔄 Form submitted with:', { email: formData.email });
    setIsLoading(true);
    
    try {
      const result = await signIn(formData.email, formData.password);
      console.log('📝 LoginForm: signIn result:', result);
      
      // Always reset loading after sign in attempt
      setIsLoading(false);
    } catch (error) {
      console.error('💥 LoginForm: Login error:', error);
      setIsLoading(false);
    }
  };

  // Google OAuth removed - not enabled in this project

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="font-lato-regular"
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="password" className="font-lato-medium">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              className="font-lato-regular"
              disabled={isLoading}
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
        
      </CardContent>
    </Card>
  );
};