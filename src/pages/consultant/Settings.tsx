import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useConsultantProfile } from '@/hooks/useConsultantProfile';
import { z } from 'zod';
import { useZodForm } from '@/lib/forms';
import {
  Settings as SettingsIcon,
  Building2,
  Palette,
  Bell,
  Save,
  Upload,
  Globe,
  Linkedin,
  Mail,
} from 'lucide-react';

const SettingsSchema = z.object({
  company_name: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
  bio: z.string().max(1000, 'Máximo 1000 caracteres').optional().or(z.literal('')),
  specializations: z.string().optional().or(z.literal('')),
  years_experience: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), 'Solo números enteros')
    .refine((v) => !v || parseInt(v) <= 80, 'Valor irreal'),
  hourly_rate: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), 'Monto inválido'),
  website_url: z
    .string()
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), 'Debe iniciar con http(s)://'),
  linkedin_url: z
    .string()
    .optional()
    .refine((v) => !v || /^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(v), 'URL de LinkedIn inválida'),
});

type SettingsValues = z.infer<typeof SettingsSchema>;

const Settings: React.FC = () => {
  const { profile, loading, updateProfile } = useConsultantProfile();

  const form = useZodForm<SettingsValues>(SettingsSchema, {
    defaultValues: {
      company_name: '',
      bio: '',
      specializations: '',
      years_experience: '',
      hourly_rate: '',
      website_url: '',
      linkedin_url: '',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const companyName = watch('company_name');

  React.useEffect(() => {
    if (profile) {
      reset({
        company_name: profile.company_name || '',
        bio: profile.bio || '',
        specializations: profile.specializations?.join(', ') || '',
        years_experience: profile.years_experience?.toString() || '',
        hourly_rate: profile.hourly_rate?.toString() || '',
        website_url: profile.website_url || '',
        linkedin_url: profile.linkedin_url || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values: SettingsValues) => {
    await updateProfile({
      company_name: values.company_name || null,
      bio: values.bio || null,
      specializations: (values.specializations || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      years_experience: values.years_experience ? parseInt(values.years_experience) : null,
      hourly_rate: values.hourly_rate ? parseFloat(values.hourly_rate) : null,
      website_url: values.website_url || null,
      linkedin_url: values.linkedin_url || null,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Configuración
        </h1>
        <p className="text-muted-foreground">Administra tu perfil y preferencias de consultor</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6" noValidate>
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información de la Empresa
              </CardTitle>
              <CardDescription>
                Datos visibles en reportes y para tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.logo_url || ''} />
                  <AvatarFallback className="text-xl">
                    {companyName?.slice(0, 2).toUpperCase() || 'CO'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button type="button" variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG hasta 2MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nombre de la empresa</Label>
                  <Input
                    id="company_name"
                    autoComplete="organization"
                    placeholder="Mi Consultoría"
                    aria-invalid={!!errors.company_name}
                    {...register('company_name')}
                  />
                  {errors.company_name && (
                    <p className="text-sm text-destructive">{errors.company_name.message}</p>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="specializations">Especialidades (separadas por coma)</Label>
                <Input
                  id="specializations"
                  placeholder="Finanzas, Operaciones, Marketing"
                  {...register('specializations')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  placeholder="Cuéntanos sobre tu experiencia y enfoque..."
                  rows={4}
                  aria-invalid={!!errors.bio}
                  {...register('bio')}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website_url" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Sitio Web
                  </Label>
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
                  <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Label>
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
              </div>
            </CardContent>
          </Card>

          {/* Billing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Facturación
              </CardTitle>
              <CardDescription>
                Configura tus tarifas y métodos de pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Tarifa por hora (MXN)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    inputMode="decimal"
                    placeholder="1500"
                    aria-invalid={!!errors.hourly_rate}
                    {...register('hourly_rate')}
                  />
                  {errors.hourly_rate && (
                    <p className="text-sm text-destructive">{errors.hourly_rate.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Brand Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Colores de Marca
              </CardTitle>
              <CardDescription>
                Personaliza los reportes con tus colores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Color Primario</Label>
                <div className="flex gap-2">
                  <Input type="color" className="w-12 h-10 p-1" defaultValue="#000000" />
                  <Input defaultValue="#000000" className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color Secundario</Label>
                <div className="flex gap-2">
                  <Input type="color" className="w-12 h-10 p-1" defaultValue="#ffffff" />
                  <Input defaultValue="#ffffff" className="flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de clientes</p>
                  <p className="text-sm text-muted-foreground">Recibe notificaciones de alertas</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pagos recibidos</p>
                  <p className="text-sm text-muted-foreground">Cuando un cliente paga</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Resumen semanal</p>
                  <p className="text-sm text-muted-foreground">Estado de tu portafolio</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
