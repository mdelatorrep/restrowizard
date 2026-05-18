import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign } from 'lucide-react';
import type { QuotationFormData } from '@/hooks/useQuotations';
import { eventTypes, formatCurrency } from './constants';

interface Props {
  formData: QuotationFormData;
  updateFormData: (updates: Partial<QuotationFormData>) => void;
  menuTotal: number;
  servicesTotal: number;
  subtotal: number;
  discountAmount: number;
  margin: number;
  totalAmount: number;
}

export const Step5Review = ({
  formData,
  updateFormData,
  menuTotal,
  servicesTotal,
  subtotal,
  discountAmount,
  margin,
  totalAmount,
}: Props) => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 text-lg font-medium">
      <DollarSign className="h-5 w-5 text-primary" />
      Resumen y Precio Final
    </div>

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
            onChange={(e) => updateFormData({ additional_costs: Number(e.target.value) })}
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
            onChange={(e) => updateFormData({ discount_percentage: Number(e.target.value) })}
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
            onChange={(e) => updateFormData({ profit_margin_percentage: Number(e.target.value) })}
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
          <span className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>

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
);
