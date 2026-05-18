import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import {
  useQuotations,
  QuotationFormData,
  QuotationMenuItem,
  QuotationService,
} from '@/hooks/useQuotations';
import { useRestaurantZones } from '@/hooks/useRestaurantZones';
import { toast } from 'sonner';
import { QuotationSchema } from '@/lib/schemas/quotation';
import { stepSchemas, type StepNumber } from '@/lib/schemas/quotationSteps';
import { Step1Client } from '@/components/consultant/quotation/Step1Client';
import { Step2Venue } from '@/components/consultant/quotation/Step2Venue';
import { Step3Menu } from '@/components/consultant/quotation/Step3Menu';
import { Step4Services } from '@/components/consultant/quotation/Step4Services';
import { Step5Review } from '@/components/consultant/quotation/Step5Review';

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

  const updateFormData = (updates: Partial<QuotationFormData>) =>
    setFormData((prev) => ({ ...prev, ...updates }));

  // Menu helpers
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
  const removeMenuItem = (index: number) =>
    updateFormData({ menu_items: formData.menu_items.filter((_, i) => i !== index) });

  // Service helpers
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
    updateFormData({ services });
  };
  const removeService = (index: number) =>
    updateFormData({ services: formData.services.filter((_, i) => i !== index) });

  // Totals
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

  const validateStep = (s: number): boolean => {
    const schema = stepSchemas[s as StepNumber];
    if (!schema) return true;
    const result = schema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || 'Revisa los campos del paso');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => s + 1);
  };

  const canProceed = () => {
    if (step === 1) {
      return Boolean(formData.client_contact_name && formData.event_name && formData.event_type);
    }
    return true;
  };

  const handleSave = async () => {
    const { menu_items, services, gallery, ...rest } = formData;
    const result = QuotationSchema.safeParse(rest);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || 'Revisa los campos del formulario');
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
      if (quotationId) navigate('/c/events');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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

      <Card>
        <CardContent className="pt-6">
          {step === 1 && <Step1Client formData={formData} updateFormData={updateFormData} />}
          {step === 2 && (
            <Step2Venue formData={formData} updateFormData={updateFormData} zones={zones} />
          )}
          {step === 3 && (
            <Step3Menu
              formData={formData}
              addMenuItem={addMenuItem}
              updateMenuItem={updateMenuItem}
              removeMenuItem={removeMenuItem}
              menuTotal={menuTotal}
            />
          )}
          {step === 4 && (
            <Step4Services
              formData={formData}
              addService={addService}
              updateService={updateService}
              removeService={removeService}
              servicesTotal={servicesTotal}
            />
          )}
          {step === 5 && (
            <Step5Review
              formData={formData}
              updateFormData={updateFormData}
              menuTotal={menuTotal}
              servicesTotal={servicesTotal}
              subtotal={subtotal}
              discountAmount={discountAmount}
              margin={margin}
              totalAmount={totalAmount}
            />
          )}
        </CardContent>
      </Card>

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
