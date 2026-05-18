import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { QuotationFormData } from '@/hooks/useQuotations';
import { formatCurrency } from './constants';

interface Zone {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  capacity_min: number;
  capacity_max: number;
  price_per_event: number;
}

interface Props {
  formData: QuotationFormData;
  updateFormData: (updates: Partial<QuotationFormData>) => void;
  zones: Zone[];
}

export const Step2Venue = ({ formData, updateFormData, zones }: Props) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium">
        <MapPin className="h-5 w-5 text-primary" />
        Espacio / Ubicación
      </div>

      {zones.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No tienes espacios registrados</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/c/events/spaces')}>
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
                      <p className="text-sm text-muted-foreground mt-1">{zone.description}</p>
                    )}
                  </div>
                  {formData.zone_id === zone.id && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                  <span>{zone.capacity_min}-{zone.capacity_max} personas</span>
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
  );
};
