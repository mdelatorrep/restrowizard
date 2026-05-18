import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Building2, Calendar } from 'lucide-react';
import type { QuotationFormData } from '@/hooks/useQuotations';
import { eventTypes } from './constants';

interface Props {
  formData: QuotationFormData;
  updateFormData: (updates: Partial<QuotationFormData>) => void;
}

export const Step1Client = ({ formData, updateFormData }: Props) => (
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
            onChange={(e) => updateFormData({ event_duration_hours: Number(e.target.value) })}
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
);
