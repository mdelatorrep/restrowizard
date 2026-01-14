import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateProjectData } from '@/hooks/useBusinessOpening';
import { Building2, ChefHat, MapPin, DollarSign, Calendar, ArrowRight, ArrowLeft, Rocket } from 'lucide-react';

const formSchema = z.object({
  projectName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  businessType: z.string().min(1, 'Selecciona un tipo de negocio'),
  cuisineType: z.string().optional(),
  city: z.string().min(2, 'Ingresa una ciudad válida'),
  country: z.string().min(2, 'Ingresa un país válido'),
  neighborhood: z.string().optional(),
  estimatedBudget: z.string().optional(),
  targetOpeningDate: z.string().optional(),
});

const BUSINESS_TYPES = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'cafeteria', label: 'Cafetería' },
  { value: 'bar', label: 'Bar' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'ghost_kitchen', label: 'Cocina Fantasma (Ghost Kitchen)' },
  { value: 'panaderia', label: 'Panadería' },
  { value: 'heladeria', label: 'Heladería' },
  { value: 'taqueria', label: 'Taquería' },
];

const CUISINE_TYPES = [
  { value: 'mexicana', label: 'Mexicana' },
  { value: 'italiana', label: 'Italiana' },
  { value: 'japonesa', label: 'Japonesa' },
  { value: 'china', label: 'China' },
  { value: 'americana', label: 'Americana' },
  { value: 'francesa', label: 'Francesa' },
  { value: 'peruana', label: 'Peruana' },
  { value: 'arabe', label: 'Árabe' },
  { value: 'fusion', label: 'Fusión' },
  { value: 'mariscos', label: 'Mariscos' },
  { value: 'vegetariana', label: 'Vegetariana/Vegana' },
  { value: 'otra', label: 'Otra' },
];

const COUNTRIES = [
  { value: 'México', label: 'México' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Chile', label: 'Chile' },
  { value: 'Perú', label: 'Perú' },
  { value: 'España', label: 'España' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
];

interface OpeningProjectWizardProps {
  onSubmit: (data: CreateProjectData) => void;
  isSubmitting?: boolean;
}

export function OpeningProjectWizard({ onSubmit, isSubmitting }: OpeningProjectWizardProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: '',
      businessType: '',
      cuisineType: '',
      city: '',
      country: 'México',
      neighborhood: '',
      estimatedBudget: '',
      targetOpeningDate: '',
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      projectName: values.projectName,
      businessType: values.businessType,
      cuisineType: values.cuisineType || undefined,
      city: values.city,
      country: values.country,
      neighborhood: values.neighborhood || undefined,
      estimatedBudget: values.estimatedBudget ? parseFloat(values.estimatedBudget) : undefined,
      targetOpeningDate: values.targetOpeningDate || undefined,
    });
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['projectName', 'businessType'];
    } else if (step === 2) {
      fieldsToValidate = ['city', 'country'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="h-6 w-6 text-primary" />
          <CardTitle>Nuevo Proyecto de Apertura</CardTitle>
        </div>
        <CardDescription>
          Cuéntanos sobre tu nuevo negocio para crear un plan personalizado
        </CardDescription>
        {/* Progress indicator */}
        <div className="flex gap-2 mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-medium mb-4">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>Información del Negocio</span>
                </div>

                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Proyecto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Mi Nuevo Restaurante" {...field} />
                      </FormControl>
                      <FormDescription>
                        Un nombre para identificar tu proyecto de apertura
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Negocio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de negocio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BUSINESS_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cuisineType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cocina (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de cocina" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CUISINE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-medium mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Ubicación</span>
                </div>

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un país" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Ciudad de México, Guadalajara..." {...field} />
                      </FormControl>
                      <FormDescription>
                        La ciudad donde planeas abrir tu negocio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colonia/Zona (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Roma Norte, Polanco..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Si ya tienes una zona en mente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Budget & Timeline */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-medium mb-4">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span>Presupuesto y Tiempo</span>
                </div>

                <FormField
                  control={form.control}
                  name="estimatedBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Presupuesto Estimado (MXN)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ej: 500000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Tu inversión estimada total (opcional pero recomendado)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetOpeningDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Objetivo de Apertura</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        ¿Cuándo te gustaría abrir? (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted/50 p-4 rounded-lg mt-6">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <ChefHat className="h-4 w-4" />
                    Resumen del Proyecto
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>Nombre:</strong> {form.watch('projectName') || '-'}</li>
                    <li><strong>Tipo:</strong> {BUSINESS_TYPES.find(t => t.value === form.watch('businessType'))?.label || '-'}</li>
                    <li><strong>Cocina:</strong> {CUISINE_TYPES.find(t => t.value === form.watch('cuisineType'))?.label || 'No especificada'}</li>
                    <li><strong>Ubicación:</strong> {form.watch('city') ? `${form.watch('city')}, ${form.watch('country')}` : '-'}</li>
                    {form.watch('neighborhood') && <li><strong>Zona:</strong> {form.watch('neighborhood')}</li>}
                    {form.watch('estimatedBudget') && (
                      <li><strong>Presupuesto:</strong> ${parseInt(form.watch('estimatedBudget') || '0').toLocaleString()} MXN</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>Creando proyecto...</>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Crear Proyecto
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
