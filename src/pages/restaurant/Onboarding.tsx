import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Building2, MapPin, Users, DollarSign, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const RestaurantOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    business_type: '',
    cuisine_type: '',
    address: '',
    city: '',
    state: '',
    employee_count: '',
    monthly_revenue_range: '',
  });

  const totalSteps = 3;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('restaurant_businesses')
        .insert({
          owner_id: user.id,
          name: formData.name,
          business_type: formData.business_type,
          cuisine_type: formData.cuisine_type,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
          monthly_revenue_range: formData.monthly_revenue_range,
        });

      if (error) throw error;

      toast({
        title: "¡Perfecto!",
        description: "Tu restaurante ha sido configurado correctamente.",
      });

      navigate('/r/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.name && formData.business_type;
    if (step === 2) return formData.city;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${
                  s === step
                    ? 'bg-primary text-primary-foreground'
                    : s < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s < step ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
            ))}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        <Card className="border-none shadow-elegant">
          {step === 1 && (
            <>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">
                  Cuéntanos sobre tu restaurante
                </CardTitle>
                <CardDescription className="font-lato-light">
                  Esta información nos ayudará a personalizar tu experiencia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del restaurante *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: La Trattoria Italiana"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Tipo de negocio *</Label>
                  <Select
                    value={formData.business_type}
                    onValueChange={(value) => handleInputChange('business_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurante</SelectItem>
                      <SelectItem value="cafe">Cafetería</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="food_truck">Food Truck</SelectItem>
                      <SelectItem value="ghost_kitchen">Dark Kitchen</SelectItem>
                      <SelectItem value="catering">Catering</SelectItem>
                      <SelectItem value="bakery">Panadería</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuisine_type">Tipo de cocina</Label>
                  <Select
                    value={formData.cuisine_type}
                    onValueChange={(value) => handleInputChange('cuisine_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la cocina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mexican">Mexicana</SelectItem>
                      <SelectItem value="italian">Italiana</SelectItem>
                      <SelectItem value="japanese">Japonesa</SelectItem>
                      <SelectItem value="chinese">China</SelectItem>
                      <SelectItem value="american">Americana</SelectItem>
                      <SelectItem value="french">Francesa</SelectItem>
                      <SelectItem value="spanish">Española</SelectItem>
                      <SelectItem value="fusion">Fusión</SelectItem>
                      <SelectItem value="other">Otra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">
                  ¿Dónde está ubicado?
                </CardTitle>
                <CardDescription className="font-lato-light">
                  Esto nos ayuda a ofrecerte información relevante de tu zona
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    placeholder="Calle, número, colonia"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      placeholder="Ej: Ciudad de México"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      placeholder="Ej: CDMX"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">
                  Último paso: Tu operación
                </CardTitle>
                <CardDescription className="font-lato-light">
                  Opcional: nos ayuda a darte mejores recomendaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_count">Número de empleados</Label>
                  <Select
                    value={formData.employee_count}
                    onValueChange={(value) => handleInputChange('employee_count', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rango" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">1-5</SelectItem>
                      <SelectItem value="15">6-15</SelectItem>
                      <SelectItem value="30">16-30</SelectItem>
                      <SelectItem value="50">31-50</SelectItem>
                      <SelectItem value="100">51-100</SelectItem>
                      <SelectItem value="200">100+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_revenue_range">Rango de ventas mensuales</Label>
                  <Select
                    value={formData.monthly_revenue_range}
                    onValueChange={(value) => handleInputChange('monthly_revenue_range', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rango" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-100k">$0 - $100,000 MXN</SelectItem>
                      <SelectItem value="100k-500k">$100,000 - $500,000 MXN</SelectItem>
                      <SelectItem value="500k-1m">$500,000 - $1,000,000 MXN</SelectItem>
                      <SelectItem value="1m-5m">$1M - $5M MXN</SelectItem>
                      <SelectItem value="5m+">$5M+ MXN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/onboarding')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            {step < totalSteps ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="gap-2"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? 'Guardando...' : 'Comenzar'}
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantOnboarding;
