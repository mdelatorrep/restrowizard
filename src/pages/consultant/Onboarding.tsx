import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Briefcase, Award, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useZodForm } from '@/lib/forms';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pushDebugEvent } from '@/lib/debugEvents';

const OnboardingSchema = z.object({
  company_name: z
    .string({ required_error: 'El nombre de la empresa es obligatorio' })
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(120, 'Máximo 120 caracteres'),
  bio: z.string().trim().max(1000, 'Máximo 1000 caracteres').optional().or(z.literal('')),
  specializations: z.string().trim().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  years_experience: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), 'Solo números enteros')
    .refine((v) => !v || parseInt(v) <= 80, 'Valor irreal'),
  website_url: z
    .string()
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), 'Debe iniciar con http(s)://'),
  linkedin_url: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(v),
      'URL de LinkedIn inválida'
    ),
});

type OnboardingValues = z.infer<typeof OnboardingSchema>;

/**
 * Consultant onboarding page - collects company info.
 * NO redirect logic here - that's handled by OnboardingGuard.
 */
const ConsultantOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markOnboardingComplete } = useUserType();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);

  const form = useZodForm<OnboardingValues>(OnboardingSchema, {
    defaultValues: {
      company_name: '',
      bio: '',
      specializations: '',
      years_experience: '',
      website_url: '',
      linkedin_url: '',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const companyName = watch('company_name');

  // Load existing partial profile data
  useEffect(() => {
    const loadExistingProfile = async () => {
      void pushDebugEvent(user?.id, 'ConsultantOnboarding', 'loadExistingProfile_start');
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }
      try {
        const { data: existingProfile } = await supabase
          .from('consultant_profiles')
          .select('id, company_name, bio, specializations, years_experience, website_url, linkedin_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingProfile) {
          setExistingProfileId(existingProfile.id);
          reset({
            company_name: existingProfile.company_name || '',
            bio: existingProfile.bio || '',
            specializations: existingProfile.specializations?.join(', ') || '',
            years_experience: existingProfile.years_experience?.toString() || '',
            website_url: existingProfile.website_url || '',
            linkedin_url: existingProfile.linkedin_url || '',
          });
        }
      } catch (error) {
        console.error('📝 [ConsultantOnboarding] Error loading profile:', error);
      } finally {
        void pushDebugEvent(user?.id, 'ConsultantOnboarding', 'loadExistingProfile_end', {
          foundExistingProfileId: !!existingProfileId,
        });
        setIsLoadingProfile(false);
      }
    };
    loadExistingProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = async (values: OnboardingValues) => {
    if (!user) return;

    try {
      const profileData = {
        user_id: user.id,
        company_name: values.company_name.trim(),
        bio: values.bio?.trim() || null,
        specializations: (values.specializations || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        years_experience: values.years_experience ? parseInt(values.years_experience) : null,
        website_url: values.website_url?.trim() || null,
        linkedin_url: values.linkedin_url?.trim() || null,
      };

      const { error } = await supabase
        .from('consultant_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select('id, company_name')
        .single();

      if (error) throw error;

      toast({ title: '¡Perfecto!', description: 'Tu perfil de consultor ha sido creado.' });
      markOnboardingComplete('consultant');
      navigate('/c/dashboard', { replace: true });
    } catch (error: any) {
      console.error('📝 [ConsultantOnboarding] Submit error:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el perfil',
        variant: 'destructive',
      });
    }
  };

  const handleNext = async () => {
    const valid = await trigger(['company_name', 'bio', 'years_experience']);
    if (valid) setStep(2);
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-none shadow-elegant">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {step === 1 && (
              <>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto bg-info/10 rounded-2xl flex items-center justify-center mb-4">
                    <Briefcase className="h-8 w-8 text-info" />
                  </div>
                  <CardTitle className="text-2xl font-headline">Tu empresa consultora</CardTitle>
                  <CardDescription>Información básica de tu consultoría</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nombre de tu empresa *</Label>
                    <Input
                      id="company_name"
                      placeholder="Gastro Consulting"
                      autoComplete="organization"
                      aria-invalid={!!errors.company_name}
                      {...register('company_name')}
                    />
                    {errors.company_name && (
                      <p className="text-sm text-destructive">{errors.company_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Sobre ti</Label>
                    <Textarea
                      id="bio"
                      placeholder="Cuéntanos sobre tu experiencia..."
                      aria-invalid={!!errors.bio}
                      {...register('bio')}
                    />
                    {errors.bio && (
                      <p className="text-sm text-destructive">{errors.bio.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="years_experience">Años de experiencia</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      inputMode="numeric"
                      placeholder="10"
                      aria-invalid={!!errors.years_experience}
                      {...register('years_experience')}
                    />
                    {errors.years_experience && (
                      <p className="text-sm text-destructive">{errors.years_experience.message}</p>
                    )}
                  </div>
                </CardContent>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto bg-info/10 rounded-2xl flex items-center justify-center mb-4">
                    <Award className="h-8 w-8 text-info" />
                  </div>
                  <CardTitle className="text-2xl font-headline">Especialidades</CardTitle>
                  <CardDescription>¿En qué áreas te especializas?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="specializations">Especialidades (separadas por coma)</Label>
                    <Input
                      id="specializations"
                      placeholder="Operaciones, Finanzas, Marketing"
                      {...register('specializations')}
                    />
                    {errors.specializations && (
                      <p className="text-sm text-destructive">{errors.specializations.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Sitio web</Label>
                    <Input
                      id="website_url"
                      type="url"
                      autoComplete="url"
                      placeholder="https://tuconsultoria.com"
                      aria-invalid={!!errors.website_url}
                      {...register('website_url')}
                    />
                    {errors.website_url && (
                      <p className="text-sm text-destructive">{errors.website_url.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      placeholder="https://linkedin.com/in/tu-perfil"
                      aria-invalid={!!errors.linkedin_url}
                      {...register('linkedin_url')}
                    />
                    {errors.linkedin_url && (
                      <p className="text-sm text-destructive">{errors.linkedin_url.message}</p>
                    )}
                  </div>
                </CardContent>
              </>
            )}

            <div className="flex justify-between p-6 pt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => (step > 1 ? setStep(1) : navigate('/onboarding'))}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>

              {step < 2 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!companyName?.trim()}
                  className="gap-2"
                >
                  Siguiente <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      Comenzar <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ConsultantOnboarding;
