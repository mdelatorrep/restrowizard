import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Briefcase, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserType } from '@/hooks/useUserType';
import { useAuth } from '@/hooks/useAuth';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { updateUserType, loading: typeLoading } = useUserType();
  const [selectedType, setSelectedType] = useState<'restaurant_owner' | 'consultant' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading || typeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      await updateUserType(selectedType);
      navigate(selectedType === 'restaurant_owner' ? '/r/onboarding' : '/c/onboarding');
    } catch (error) {
      console.error('Error updating user type:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-headline font-bold text-primary mb-3">
            ¡Bienvenido a RestroWizard!
          </h1>
          <p className="text-lg text-muted-foreground font-lato-light max-w-xl mx-auto">
            Para personalizar tu experiencia, cuéntanos: ¿qué tipo de usuario eres?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Restaurant Owner Card */}
          <Card
            className={`cursor-pointer transition-all duration-300 hover:shadow-elegant ${
              selectedType === 'restaurant_owner'
                ? 'ring-2 ring-primary border-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedType('restaurant_owner')}
          >
            <CardHeader className="text-center pb-4">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                selectedType === 'restaurant_owner' ? 'bg-primary' : 'bg-muted'
              }`}>
                <Building2 className={`h-10 w-10 ${
                  selectedType === 'restaurant_owner' ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} />
              </div>
              <CardTitle className="text-xl font-headline">
                Dueño o Administrador de Restaurante
              </CardTitle>
              <CardDescription className="font-lato-light">
                Gestiona tu restaurante con herramientas de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Control de finanzas y costos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Optimización de operaciones
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Gestión de personal
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Ingeniería de menú
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Consultant Card */}
          <Card
            className={`cursor-pointer transition-all duration-300 hover:shadow-elegant ${
              selectedType === 'consultant'
                ? 'ring-2 ring-info border-info bg-info/5'
                : 'hover:border-info/50'
            }`}
            onClick={() => setSelectedType('consultant')}
          >
            <CardHeader className="text-center pb-4">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                selectedType === 'consultant' ? 'bg-info' : 'bg-muted'
              }`}>
                <Briefcase className={`h-10 w-10 ${
                  selectedType === 'consultant' ? 'text-info-foreground' : 'text-muted-foreground'
                }`} />
              </div>
              <CardTitle className="text-xl font-headline">
                Consultor Gastronómico
              </CardTitle>
              <CardDescription className="font-lato-light">
                Gestiona múltiples clientes con un portal profesional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  Dashboard multi-cliente
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  Reportes con tu branding
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  Sistema de facturación
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  Alertas consolidadas
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedType || isSubmitting}
            className="px-8 gap-2"
          >
            {isSubmitting ? 'Guardando...' : 'Continuar'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
