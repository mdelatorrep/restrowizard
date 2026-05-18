import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Building2,
  Calendar,
  MapPin,
  Utensils,
  Music,
  CheckCircle,
  Plus,
  Trash2,
  DollarSign,
} from 'lucide-react';
import {
  useQuotations,
  QuotationFormData,
  QuotationMenuItem,
  QuotationService,
} from '@/hooks/useQuotations';
import { useRestaurantZones } from '@/hooks/useRestaurantZones';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { QuotationSchema } from '@/lib/schemas/quotation';
import { stepSchemas, type StepNumber } from '@/lib/schemas/quotationSteps';

const eventTypes = [
  { value: 'corporativo', label: 'Evento Corporativo' },
  { value: 'social', label: 'Evento Social' },
  { value: 'boda', label: 'Boda' },
  { value: 'cumpleaños', label: 'Cumpleaños' },
  { value: 'conferencia', label: 'Conferencia/Seminario' },
  { value: 'otro', label: 'Otro' },
];

const menuCategories = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'plato_fuerte', label: 'Plato Fuerte' },
  { value: 'postre', label: 'Postre' },
  { value: 'bebida', label: 'Bebida' },
  { value: 'aperitivo', label: 'Aperitivo' },
];

const serviceTypes = [
  { value: 'musica', label: 'Música en Vivo' },
  { value: 'dj', label: 'DJ' },
  { value: 'show', label: 'Show/Entretenimiento' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'fotografia', label: 'Fotografía/Video' },
  { value: 'otro', label: 'Otro Servicio' },
];

const initialFormData: QuotationFormData = {
  client_type: 'corporate',
  client_contact_name: '',
  client_company: '',
  client_email: '',
  client_phone: '',
  event_name: '',
  event_type: 'corporativo',
  event_date: '',
  guest_count: 20,
  event_duration_hours: 4,
  event_description: '',
  venue_cost: 0,
  menu_cost_per_person: 0,
  services_cost: 0,
  additional_costs: 0,
  discount_percentage: 0,
  profit_margin_percentage: 20,
  valid_until: '',
  notes: '',
  internal_notes: '',
  menu_items: [],
  services: [],
  gallery: [],
};

export default function NewQuotation() {
  const navigate = useNavigate();
  const { createQuotation } = useQuotations();
  const { zones } = useRestaurantZones();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<QuotationFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const totalSteps = 5;

  const updateFormData = (updates: Partial<QuotationFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const addMenuItem = () => {
    const newItem: QuotationMenuItem = {
      category: 'plato_fuerte',
      item_name: '',
      item_description: '',
      price_per_person: 0,
      quantity: 1,
      is_included: true,
    };
    updateFormData({ menu_items: [...formData.menu_items, newItem] });
  };

  const updateMenuItem = (index: number, updates: Partial<QuotationMenuItem>) => {
    const items = [...formData.menu_items];
    items[index] = { ...items[index], ...updates };
    updateFormData({ menu_items: items });
  };

  const removeMenuItem = (index: number) => {
    updateFormData({ menu_items: formData.menu_items.filter((_, i) => i !== index) });
  };

  const addService = () => {
    const newService: QuotationService = {
      service_type: 'musica',
      service_name: '',
      service_description: '',
      price: 0,
      provider_name: '',
    };
    updateFormData({ services: [...formData.services, newService] });
  };

  const updateService = (index: number, updates: Partial<QuotationService>) => {
    const services = [...formData.services];
    services[index] = { ...services[index], ...updates };
    updateFormData({ services: services });
  };

  const removeService = (index: number) => {
    updateFormData({ services: formData.services.filter((_, i) => i !== index) });
  };

  // Calculate totals
  const menuTotal =
    formData.menu_items.reduce((sum, item) => sum + (item.price_per_person || 0), 0) *
    formData.guest_count;
  const servicesTotal = formData.services.reduce((sum, s) => sum + (s.price || 0), 0);
  const subtotal =
    (formData.venue_cost || 0) + menuTotal + servicesTotal + (formData.additional_costs || 0);
  const discountAmount = subtotal * ((formData.discount_percentage || 0) / 100);
  const totalBeforeMargin = subtotal - discountAmount;
  const margin = totalBeforeMargin * ((formData.profit_margin_percentage || 0) / 100);
  const totalAmount = totalBeforeMargin + margin;

  const handleSave = async () => {
    // Validate base fields with Zod before persisting
    const { menu_items, services, gallery, ...rest } = formData;
    const result = QuotationSchema.safeParse(rest);
    if (!result.success) {
      const firstError = result.error.issues[0];
      toast.error(firstError?.message || 'Revisa los campos del formulario');
      return;
    }

    setSaving(true);
    try {
      const menuCostPerPerson = formData.menu_items.reduce(
        (sum, item) => sum + (item.price_per_person || 0),
        0
      );
      const quotationId = await createQuotation({
        ...formData,
        menu_cost_per_person: menuCostPerPerson,
      });
      if (quotationId) {
        navigate('/c/events');
      }
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const validateStep = (s: number): boolean => {
    const schema = stepSchemas[s as StepNumber];
    if (!schema) return true;
    const result = schema.safeParse(formData);
    if (!result.success) {
      const first = result.error.issues[0];
      toast.error(first?.message || 'Revisa los campos del paso');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => s + 1);
  };

  const canProceed = () => {
    // Lightweight gate for Next button (full validation runs onClick).
    switch (step) {
      case 1:
        return Boolean(formData.client_contact_name && formData.event_name && formData.event_type);
      default:
        return true;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/c/events')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-headline font-bold text-foreground">Nueva Cotización</h1>
          <p className="text-muted-foreground">
            Paso {step} de {totalSteps}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i < step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Client & Event Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-medium">
                <User className="h-5 w-5 text-primary" />
                Cliente y Evento
              </div>

              <div>
                <Label className="mb-2 block">Tipo de Cliente</Label>
                <RadioGroup
                  value={formData.client_type}
                  onValueChange={(value) => updateFormData({ client_type: value })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="corporate" id="corporate" />
                    <Label htmlFor="corporate" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Corporativo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Particular
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="client_contact_name">Nombre del Contacto *</Label>
                  <Input
                    id="client_contact_name"
                    value={formData.client_contact_name}
                    onChange={(e) => updateFormData({ client_contact_name: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                {formData.client_type === 'corporate' && (
                  <div>
                    <Label htmlFor="client_company">Empresa</Label>
                    <Input
                      id="client_company"
                      value={formData.client_company}
                      onChange={(e) => updateFormData({ client_company: e.target.value })}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => updateFormData({ client_email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="client_phone">Teléfono</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => updateFormData({ client_phone: e.target.value })}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center gap-2 text-lg font-medium mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  Detalles del Evento
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="event_name">Nombre del Evento *</Label>
                    <Input
                      id="event_name"
                      value={formData.event_name}
                      onChange={(e) => updateFormData({ event_name: e.target.value })}
                      placeholder="Ej: Cena Ejecutiva Anual"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_type">Tipo de Evento *</Label>
                    <Select
                      value={formData.event_type}
                      onValueChange={(value) => updateFormData({ event_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="event_date">Fecha del Evento</Label>
                    <Input
                      id="event_date"
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => updateFormData({ event_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest_count">Número de Invitados</Label>
                    <Input
                      id="guest_count"
                      type="number"
                      value={formData.guest_count}
                      onChange={(e) => updateFormData({ guest_count: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_duration_hours">Duración (horas)</Label>
                    <Input
                      id="event_duration_hours"
                      type="number"
                      value={formData.event_duration_hours}
                      onChange={(e) =>
                        updateFormData({ event_duration_hours: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="event_description">Descripción del Evento</Label>
                    <Textarea
                      id="event_description"
                      value={formData.event_description}
                      onChange={(e) => updateFormData({ event_description: e.target.value })}
                      placeholder="Describe el tipo de evento, ambiente deseado, requerimientos especiales..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Zone Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-medium">
                <MapPin className="h-5 w-5 text-primary" />
                Espacio / Ubicación
              </div>

              {zones.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">No tienes espacios registrados</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/c/events/spaces')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Espacios
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {zones
                    .filter((z) => z.is_active)
                    .map((zone) => (
                      <div
                        key={zone.id}
                        onClick={() => updateFormData({ zone_id: zone.id })}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.zone_id === zone.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{zone.name}</h3>
                            {zone.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {zone.description}
                              </p>
                            )}
                          </div>
                          {formData.zone_id === zone.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                          <span>
                            {zone.capacity_min}-{zone.capacity_max} personas
                          </span>
                          <span>{formatCurrency(zone.price_per_event)}/evento</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div>
                <Label htmlFor="venue_cost">Costo del Espacio (MXN)</Label>
                <Input
                  id="venue_cost"
                  type="number"
                  value={formData.venue_cost}
                  onChange={(e) => updateFormData({ venue_cost: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Step 3: Menu */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-medium">
                  <Utensils className="h-5 w-5 text-primary" />
                  Propuesta de Menú
                </div>
                <Button variant="outline" size="sm" onClick={addMenuItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Platillo
                </Button>
              </div>

              {formData.menu_items.length === 0 ? (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <Utensils className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">
                    Agrega los platillos de la propuesta
                  </p>
                  <Button variant="outline" className="mt-4" onClick={addMenuItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Primer Platillo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.menu_items.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {menuCategories.find((c) => c.value === item.category)?.label ||
                            item.category}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMenuItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <Label>Categoría</Label>
                          <Select
                            value={item.category}
                            onValueChange={(value) => updateMenuItem(index, { category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {menuCategories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Nombre del Platillo</Label>
                          <Input
                            value={item.item_name}
                            onChange={(e) => updateMenuItem(index, { item_name: e.target.value })}
                            placeholder="Ej: Filete de Res al Vino Tinto"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Descripción</Label>
                          <Input
                            value={item.item_description || ''}
                            onChange={(e) =>
                              updateMenuItem(index, { item_description: e.target.value })
                            }
                            placeholder="Descripción breve..."
                          />
                        </div>
                        <div>
                          <Label>Precio por Persona (MXN)</Label>
                          <Input
                            type="number"
                            value={item.price_per_person}
                            onChange={(e) =>
                              updateMenuItem(index, { price_per_person: Number(e.target.value) })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Costo del menú por persona:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      formData.menu_items.reduce((sum, item) => sum + (item.price_per_person || 0), 0)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">
                    Total menú ({formData.guest_count} personas):
                  </span>
                  <span className="font-medium">{formatCurrency(menuTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Services */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-medium">
                  <Music className="h-5 w-5 text-primary" />
                  Servicios Adicionales
                </div>
                <Button variant="outline" size="sm" onClick={addService}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Servicio
                </Button>
              </div>

              {formData.services.length === 0 ? (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <Music className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">
                    Agrega servicios como música, shows, decoración, etc.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={addService}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Servicio
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.services.map((service, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {serviceTypes.find((s) => s.value === service.service_type)?.label ||
                            service.service_type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeService(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <Label>Tipo de Servicio</Label>
                          <Select
                            value={service.service_type}
                            onValueChange={(value) =>
                              updateService(index, { service_type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {serviceTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Nombre del Servicio</Label>
                          <Input
                            value={service.service_name}
                            onChange={(e) =>
                              updateService(index, { service_name: e.target.value })
                            }
                            placeholder="Ej: Trio de Cuerdas"
                          />
                        </div>
                        <div>
                          <Label>Proveedor</Label>
                          <Input
                            value={service.provider_name || ''}
                            onChange={(e) =>
                              updateService(index, { provider_name: e.target.value })
                            }
                            placeholder="Nombre del proveedor"
                          />
                        </div>
                        <div>
                          <Label>Duración (horas)</Label>
                          <Input
                            type="number"
                            value={service.duration_hours || ''}
                            onChange={(e) =>
                              updateService(index, { duration_hours: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <Label>Precio (MXN)</Label>
                          <Input
                            type="number"
                            value={service.price}
                            onChange={(e) =>
                              updateService(index, { price: Number(e.target.value) })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total servicios:</span>
                  <span className="font-medium">{formatCurrency(servicesTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Pricing */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-medium">
                <DollarSign className="h-5 w-5 text-primary" />
                Resumen y Precio Final
              </div>

              {/* Summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Evento</h4>
                  <p className="text-lg">{formData.event_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {eventTypes.find((t) => t.value === formData.event_type)?.label}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.guest_count} invitados • {formData.event_duration_hours} horas
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Cliente</h4>
                  <p className="text-lg">{formData.client_contact_name}</p>
                  {formData.client_company && (
                    <p className="text-sm text-muted-foreground">{formData.client_company}</p>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="border rounded-lg divide-y">
                <div className="p-4 flex items-center justify-between">
                  <span>Espacio</span>
                  <span>{formatCurrency(formData.venue_cost || 0)}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span>
                    Menú ({formData.menu_items.length} platillos x {formData.guest_count} personas)
                  </span>
                  <span>{formatCurrency(menuTotal)}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span>Servicios ({formData.services.length})</span>
                  <span>{formatCurrency(servicesTotal)}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="additional_costs">Costos Adicionales</Label>
                    <Input
                      id="additional_costs"
                      type="number"
                      className="w-32 text-right"
                      value={formData.additional_costs}
                      onChange={(e) =>
                        updateFormData({ additional_costs: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="discount">Descuento (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      className="w-24 text-right"
                      value={formData.discount_percentage}
                      onChange={(e) =>
                        updateFormData({ discount_percentage: Number(e.target.value) })
                      }
                    />
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                      <span>Descuento aplicado</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="margin">Margen de Ganancia (%)</Label>
                    <Input
                      id="margin"
                      type="number"
                      className="w-24 text-right"
                      value={formData.profit_margin_percentage}
                      onChange={(e) =>
                        updateFormData({ profit_margin_percentage: Number(e.target.value) })
                      }
                    />
                  </div>
                  {margin > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                      <span>Ganancia</span>
                      <span>+{formatCurrency(margin)}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-primary/10">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">Total a Cotizar</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="valid_until">Válido Hasta</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => updateFormData({ valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas para el Cliente</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData({ notes: e.target.value })}
                  placeholder="Notas que verá el cliente en la propuesta..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="internal_notes">Notas Internas (no visibles al cliente)</Label>
                <Textarea
                  id="internal_notes"
                  value={formData.internal_notes}
                  onChange={(e) => updateFormData({ internal_notes: e.target.value })}
                  placeholder="Notas privadas para tu referencia..."
                  rows={2}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        {step < totalSteps ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cotización'}
            <CheckCircle className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
