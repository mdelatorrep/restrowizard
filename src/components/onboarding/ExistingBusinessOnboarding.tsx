import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle, ExternalLink, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { StepBusinessInfo } from './existing-steps/StepBusinessInfo';
import { StepLocation } from './existing-steps/StepLocation';
import { StepWebsite, type WebsiteValues } from './existing-steps/StepWebsite';
import { StepQuickMenu } from './existing-steps/StepQuickMenu';
import {
  isValidSlug,
  publishQuickSite,
  readOnboardingMinutes,
  slugify,
  startOnboardingTimer,
  validDishes,
  type QuickDish,
} from './quickSetup';

interface ExistingBusinessOnboardingProps {
  onBack: () => void;
}

/**
 * C-07: alta guiada. Cuatro pasos y el restaurante queda con sitio, carta y
 * reservas publicados. Lo demás (equipo, finanzas, inventario) se configura
 * después desde el panel.
 */
export const ExistingBusinessOnboarding: React.FC<ExistingBusinessOnboardingProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markOnboardingComplete } = useUserType();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [published, setPublished] = useState<{ slug: string; minutes: number | null } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    business_type: '',
    cuisine_type: '',
    address: '',
    city: '',
    state: '',
    country: 'Colombia',
  });
  const [site, setSite] = useState<WebsiteValues>({
    slug: '',
    whatsapp: '',
    openTime: '12:00',
    closeTime: '22:00',
    closedDays: [],
    reservations: true,
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [dishes, setDishes] = useState<QuickDish[]>([
    { name: '', category: 'Entradas', price: '' },
    { name: '', category: 'Platos fuertes', price: '' },
    { name: '', category: 'Bebidas', price: '' },
  ]);

  useEffect(() => {
    startOnboardingTimer();
  }, []);

  // El slug sigue al nombre hasta que el dueño lo edite.
  useEffect(() => {
    if (!slugTouched) setSite((s) => ({ ...s, slug: slugify(formData.name) }));
  }, [formData.name, slugTouched]);

  const totalSteps = 4;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
        opening_date: null,
      });
      if (error) throw error;

      const slug = await publishQuickSite({
        userId: user.id,
        restaurantName: formData.name,
        city: formData.city,
        slug: site.slug,
        whatsapp: site.whatsapp,
        openTime: site.openTime,
        closeTime: site.closeTime,
        closedDays: site.closedDays,
        reservations: site.reservations,
        dishes,
      });

      markOnboardingComplete('restaurant_owner');
      setPublished({ slug, minutes: readOnboardingMinutes() });
    } catch (error: any) {
      toast({ title: 'No se pudo publicar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!(formData.name && formData.business_type);
    if (step === 2) return !!formData.city;
    if (step === 3) return isValidSlug(site.slug) && site.openTime && site.closeTime;
    if (step === 4) return validDishes(dishes).length > 0;
    return true;
  };

  if (published) {
    const url = `/p/${published.slug}`;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-xl border-none shadow-elegant text-center">
          <CardHeader>
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">{formData.name} ya está en línea</CardTitle>
            <CardDescription className="font-lato-light">
              Tu sitio tiene carta{site.reservations ? ' y recibe reservas' : ''}.
              {published.minutes ? ` Lo dejaste listo en ${published.minutes} min.` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-mono text-sm bg-muted rounded-md py-2 px-3 break-all">restrowizard.co{url}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" className="gap-2" onClick={() => window.open(url, '_blank', 'noopener')}>
                Ver mi sitio <ExternalLink className="h-4 w-4" />
              </Button>
              <Button className="gap-2" onClick={() => navigate('/r/dashboard', { replace: true })}>
                Ir a mi panel <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Siguiente paso sugerido: conecta tu punto de venta para ver tu prime cost con datos reales.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <OnboardingProgressBar step={step} totalSteps={totalSteps} />

        <Card className="border-none shadow-elegant">
          {step === 1 && <StepBusinessInfo values={formData} onChange={handleInputChange} />}
          {step === 2 && <StepLocation values={formData} onChange={handleInputChange} />}
          {step === 3 && (
            <StepWebsite
              values={site}
              onChange={(patch) => {
                if (patch.slug !== undefined) setSlugTouched(true);
                setSite((s) => ({ ...s, ...patch }));
              }}
            />
          )}
          {step === 4 && <StepQuickMenu dishes={dishes} onChange={setDishes} />}

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
              <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()} className="gap-2">
                {isSubmitting ? 'Publicando...' : 'Publicar mi restaurante'}
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
