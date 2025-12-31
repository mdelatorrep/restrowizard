import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Briefcase, Award, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ConsultantOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    bio: '',
    specializations: '',
    years_experience: '',
    website_url: '',
    linkedin_url: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('consultant_profiles')
        .insert({
          user_id: user.id,
          company_name: formData.company_name,
          bio: formData.bio,
          specializations: formData.specializations.split(',').map(s => s.trim()).filter(Boolean),
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
          website_url: formData.website_url || null,
          linkedin_url: formData.linkedin_url || null,
        });
      if (error) throw error;
      toast({ title: "¡Perfecto!", description: "Tu perfil de consultor ha sido creado." });
      navigate('/c/dashboard');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-none shadow-elegant">
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
                  <Label>Nombre de tu empresa *</Label>
                  <Input placeholder="Gastro Consulting" value={formData.company_name} onChange={(e) => handleInputChange('company_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sobre ti</Label>
                  <Textarea placeholder="Cuéntanos sobre tu experiencia..." value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Años de experiencia</Label>
                  <Input type="number" placeholder="10" value={formData.years_experience} onChange={(e) => handleInputChange('years_experience', e.target.value)} />
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
                  <Label>Especialidades (separadas por coma)</Label>
                  <Input placeholder="Operaciones, Finanzas, Marketing" value={formData.specializations} onChange={(e) => handleInputChange('specializations', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sitio web</Label>
                  <Input placeholder="https://tuconsultoria.com" value={formData.website_url} onChange={(e) => handleInputChange('website_url', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input placeholder="https://linkedin.com/in/tu-perfil" value={formData.linkedin_url} onChange={(e) => handleInputChange('linkedin_url', e.target.value)} />
                </div>
              </CardContent>
            </>
          )}
          <div className="flex justify-between p-6 pt-0">
            <Button variant="outline" onClick={() => step > 1 ? setStep(1) : navigate('/onboarding')} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Atrás
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep(2)} disabled={!formData.company_name} className="gap-2">
                Siguiente <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? 'Guardando...' : 'Comenzar'} <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ConsultantOnboarding;
