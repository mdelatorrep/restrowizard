import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCountryInfo } from '@/data/constants';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { StepBusinessInfo } from './existing-steps/StepBusinessInfo';
import { StepLocation } from './existing-steps/StepLocation';
import { StepOpeningDate } from './existing-steps/StepOpeningDate';
import { StepOperations } from './existing-steps/StepOperations';
import { getRevenueRangesByCurrency, getLifecycleStage } from './existingBusinessHelpers';

interface ExistingBusinessOnboardingProps {
  onBack: () => void;
}

export const ExistingBusinessOnboarding: React.FC<ExistingBusinessOnboardingProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markOnboardingComplete } = useUserType();
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

  const totalSteps = 4;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const lifecycleInfo = getLifecycleStage(formData.opening_date);
  const countryInfo = getCountryInfo(formData.country);
  const currencyCode = countryInfo?.currency || 'USD';
  const currencySymbol = countryInfo?.currencySymbol || '$';
  const revenueRanges = getRevenueRangesByCurrency(currencyCode, currencySymbol);

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('restaurant_businesses').insert({
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
        title: '¡Perfecto!',
        description: 'Tu restaurante ha sido configurado. Bienvenido a tu dashboard.',
      });

      markOnboardingComplete('restaurant_owner');
      navigate('/r/dashboard', { replace: true });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
        <OnboardingProgressBar step={step} totalSteps={totalSteps} />

        <Card className="border-none shadow-elegant">
          {step === 1 && <StepBusinessInfo values={formData} onChange={handleInputChange} />}
          {step === 2 && <StepLocation values={formData} onChange={handleInputChange} />}
          {step === 3 && (
            <StepOpeningDate
              openingDate={formData.opening_date}
              lifecycleInfo={lifecycleInfo}
              onChange={handleInputChange}
            />
          )}
          {step === 4 && (
            <StepOperations
              values={formData}
              revenueRanges={revenueRanges}
              onChange={handleInputChange}
            />
          )}

          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => (step > 1 ? setStep(step - 1) : onBack())}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            {step < totalSteps ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-2">
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
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
