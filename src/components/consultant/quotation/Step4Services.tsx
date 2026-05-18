import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, Plus, Trash2 } from 'lucide-react';
import type { QuotationFormData, QuotationService } from '@/hooks/useQuotations';
import { serviceTypes, formatCurrency } from './constants';

interface Props {
  formData: QuotationFormData;
  addService: () => void;
  updateService: (index: number, updates: Partial<QuotationService>) => void;
  removeService: (index: number) => void;
  servicesTotal: number;
}

export const Step4Services = ({ formData, addService, updateService, removeService, servicesTotal }: Props) => (
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
                {serviceTypes.find((s) => s.value === service.service_type)?.label || service.service_type}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => removeService(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Tipo de Servicio</Label>
                <Select
                  value={service.service_type}
                  onValueChange={(value) => updateService(index, { service_type: value })}
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
                  onChange={(e) => updateService(index, { service_name: e.target.value })}
                  placeholder="Ej: Trio de Cuerdas"
                />
              </div>
              <div>
                <Label>Proveedor</Label>
                <Input
                  value={service.provider_name || ''}
                  onChange={(e) => updateService(index, { provider_name: e.target.value })}
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div>
                <Label>Duración (horas)</Label>
                <Input
                  type="number"
                  value={service.duration_hours || ''}
                  onChange={(e) => updateService(index, { duration_hours: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Precio (MXN)</Label>
                <Input
                  type="number"
                  value={service.price}
                  onChange={(e) => updateService(index, { price: Number(e.target.value) })}
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
);
