import React from 'react';
import { DollarSign, ChefHat } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MenuItemFormData } from './menuItemDialogTypes';
import { formatCurrency } from '@/lib/formatCurrency';

interface Props {
  formData: MenuItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<MenuItemFormData>>;
  currencySymbol: string;
}

export const MenuItemPricingTab: React.FC<Props> = ({ formData, setFormData, currencySymbol }) => {
  const profitMargin = formData.price && formData.cost
    ? (((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Costo del platillo ({currencySymbol})
          </Label>
          <Input
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
            placeholder="Costo de ingredientes + mano de obra"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Incluye ingredientes, porción y preparación
          </p>
        </div>

        <div>
          <Label>Precio de venta ({currencySymbol})</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="Precio al cliente"
          />
        </div>
      </div>

      {profitMargin && (
        <div className={`p-4 rounded-lg ${
          parseFloat(profitMargin) >= 70 ? 'bg-green-50 border border-green-200' :
          parseFloat(profitMargin) >= 50 ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Margen de ganancia</p>
              <p className="text-2xl font-bold">{profitMargin}%</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-muted-foreground">Ganancia por unidad</p>
              <p className="font-semibold text-lg">
                {formatCurrency(parseFloat(formData.price || '0') - parseFloat(formData.cost || '0'), 'COP')}
              </p>
            </div>
          </div>
          <p className="text-xs mt-2 text-muted-foreground">
            {parseFloat(profitMargin) >= 70
              ? '✅ Excelente margen para este tipo de platillo'
              : parseFloat(profitMargin) >= 50
              ? '⚠️ Margen aceptable, considera optimizar costos'
              : '❌ Margen bajo, revisa precios o costos'
            }
          </p>
        </div>
      )}

      {formData.recipe_id && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <ChefHat className="w-4 h-4 inline mr-1" />
            Este platillo está vinculado a una receta. El costo se sincroniza automáticamente.
          </p>
        </div>
      )}
    </div>
  );
};
