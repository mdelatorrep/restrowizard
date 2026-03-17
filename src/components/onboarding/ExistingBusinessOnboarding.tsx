import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Building2, MapPin, DollarSign, CheckCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectWithOther } from '@/components/ui/select-with-other';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, parseISO, format } from 'date-fns';
import { BUSINESS_TYPES, CUISINE_TYPES, COUNTRIES, getCountryInfo, formatCurrencyByCountry } from '@/data/constants';

interface ExistingBusinessOnboardingProps {
  onBack: () => void;
}

export const ExistingBusinessOnboarding: React.FC<ExistingBusinessOnboardingProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshUserType, markOnboardingComplete } = useUserType();
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
    country: 'Colombia',
    employee_count: '',
    monthly_revenue_range: '',
    opening_date: '',
  });

  const totalSteps = 4; // Added step for opening date

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate lifecycle stage based on opening date
  const getLifecycleStage = () => {
    if (!formData.opening_date) return null;
    const openingDate = parseISO(formData.opening_date);
    const today = new Date();
    const daysDiff = differenceInDays(today, openingDate);
    
    if (daysDiff < 0) return { stage: 'pre_opening', days: Math.abs(daysDiff), label: 'Pre-Apertura' };
    if (daysDiff <= 90) return { stage: 'first_90_days', days: daysDiff, label: 'Primeros 90 Días' };
    return { stage: 'normal_operation', days: daysDiff, label: 'Operación Normal' };
  };

  const lifecycleInfo = getLifecycleStage();
  
  // Dynamic revenue ranges based on selected country
  const countryInfo = getCountryInfo(formData.country);
  const currencyCode = countryInfo?.currency || 'USD';
  const currencySymbol = countryInfo?.currencySymbol || '$';
  
  const getRevenueRanges = () => {
    // COP uses much larger numbers
    if (currencyCode === 'COP') {
      return [
        { value: '0-20m', label: `${currencySymbol}0 - ${currencySymbol}20M ${currencyCode}` },
        { value: '20m-50m', label: `${currencySymbol}20M - ${currencySymbol}50M ${currencyCode}` },
        { value: '50m-100m', label: `${currencySymbol}50M - ${currencySymbol}100M ${currencyCode}` },
        { value: '100m-500m', label: `${currencySymbol}100M - ${currencySymbol}500M ${currencyCode}` },
        { value: '500m+', label: `${currencySymbol}500M+ ${currencyCode}` },
      ];
    }
    if (currencyCode === 'ARS') {
      return [
        { value: '0-5m', label: `${currencySymbol}0 - ${currencySymbol}5M ${currencyCode}` },
        { value: '5m-20m', label: `${currencySymbol}5M - ${currencySymbol}20M ${currencyCode}` },
        { value: '20m-50m', label: `${currencySymbol}20M - ${currencySymbol}50M ${currencyCode}` },
        { value: '50m-200m', label: `${currencySymbol}50M - ${currencySymbol}200M ${currencyCode}` },
        { value: '200m+', label: `${currencySymbol}200M+ ${currencyCode}` },
      ];
    }
    if (currencyCode === 'CLP') {
      return [
        { value: '0-5m', label: `${currencySymbol}0 - ${currencySymbol}5M ${currencyCode}` },
        { value: '5m-15m', label: `${currencySymbol}5M - ${currencySymbol}15M ${currencyCode}` },
        { value: '15m-50m', label: `${currencySymbol}15M - ${currencySymbol}50M ${currencyCode}` },
        { value: '50m-150m', label: `${currencySymbol}50M - ${currencySymbol}150M ${currencyCode}` },
        { value: '150m+', label: `${currencySymbol}150M+ ${currencyCode}` },
      ];
    }
    // MXN and default
    return [
      { value: '0-100k', label: `${currencySymbol}0 - ${currencySymbol}100,000 ${currencyCode}` },
      { value: '100k-500k', label: `${currencySymbol}100,000 - ${currencySymbol}500,000 ${currencyCode}` },
      { value: '500k-1m', label: `${currencySymbol}500,000 - ${currencySymbol}1,000,000 ${currencyCode}` },
      { value: '1m-5m', label: `${currencySymbol}1M - ${currencySymbol}5M ${currencyCode}` },
      { value: '5m+', label: `${currencySymbol}5M+ ${currencyCode}` },
    ];
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
          country: formData.country,
          employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
          monthly_revenue_range: formData.monthly_revenue_range,
          opening_date: formData.opening_date || null,
        });

      if (error) throw error;

      toast({
        title: "¡Perfecto!",
        description: "Tu restaurante ha sido configurado. Bienvenido a tu dashboard.",
      });

      // Immediately mark onboarding as complete in cache (deterministic, no network dependency)
      markOnboardingComplete('restaurant_owner');

      // NOTE: Do NOT call refreshUserType() here - it overwrites the optimistic cache set by markOnboardingComplete

      navigate('/r/dashboard', { replace: true });
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
    if (step === 3) return formData.opening_date;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
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
                  <SelectWithOther
                    options={BUSINESS_TYPES}
                    value={formData.business_type}
                    onChange={(value) => handleInputChange('business_type', value)}
                    placeholder="Selecciona el tipo"
                    otherPlaceholder="Especifica el tipo de negocio..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuisine_type">Tipo de cocina</Label>
                  <SelectWithOther
                    options={CUISINE_TYPES}
                    value={formData.cuisine_type}
                    onChange={(value) => handleInputChange('cuisine_type', value)}
                    placeholder="Selecciona la cocina"
                    otherPlaceholder="Especifica el tipo de cocina..."
                  />
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
                  <Label htmlFor="country">País *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleInputChange('country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu país" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                      placeholder="Ej: Bogotá"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado / Departamento</Label>
                    <Input
                      id="state"
                      placeholder="Ej: Cundinamarca"
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
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">
                  ¿Cuándo abriste tu restaurante?
                </CardTitle>
                <CardDescription className="font-lato-light">
                  Esto nos ayuda a personalizar tu experiencia según tu etapa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="opening_date">Fecha de apertura *</Label>
                  <Input
                    id="opening_date"
                    type="date"
                    value={formData.opening_date}
                    onChange={(e) => handleInputChange('opening_date', e.target.value)}
                  />
                </div>
                
                {lifecycleInfo && (
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        {lifecycleInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lifecycleInfo.stage === 'pre_opening' && (
                        <>Te faltan {lifecycleInfo.days} días para abrir. Te ayudaremos con la preparación.</>
                      )}
                      {lifecycleInfo.stage === 'first_90_days' && (
                        <>Llevas {lifecycleInfo.days} días operando. Estás en la fase crítica de estabilización.</>
                      )}
                      {lifecycleInfo.stage === 'normal_operation' && (
                        <>Tu restaurante lleva {Math.floor(lifecycleInfo.days / 30)} meses operando. Es hora de optimizar.</>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </>
          )}

          {step === 4 && (
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
                      {getRevenueRanges().map(range => (
                        <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : onBack()}
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
