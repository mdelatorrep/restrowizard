import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';
import { MenuItemFormData } from './menuItemDialogTypes';

type MenuAllergen = Tables<'menu_allergens'>;

interface Props {
  formData: MenuItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<MenuItemFormData>>;
  allergens: MenuAllergen[];
}

export const MenuItemAllergensTab: React.FC<Props> = ({ formData, setFormData, allergens }) => {
  const toggleAllergen = (code: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(code)
        ? prev.allergens.filter(a => a !== code)
        : [...prev.allergens, code],
    }));
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-orange-800">Información importante</p>
          <p className="text-orange-700">
            Marca los alérgenos presentes en este platillo. Esta información
            se mostrará a los clientes en el menú digital.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {allergens.map(allergen => (
          <div
            key={allergen.id}
            onClick={() => toggleAllergen(allergen.code)}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              formData.allergens.includes(allergen.code)
                ? 'border-red-400 bg-red-50'
                : 'border-transparent bg-muted/50 hover:bg-muted'
            }`}
          >
            <Checkbox
              checked={formData.allergens.includes(allergen.code)}
              onCheckedChange={() => toggleAllergen(allergen.code)}
            />
            <span className="text-lg">{allergen.icon}</span>
            <span className="text-sm font-medium">{allergen.name}</span>
          </div>
        ))}
      </div>

      {formData.allergens.length > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Alérgenos seleccionados:</p>
          <div className="flex flex-wrap gap-1">
            {formData.allergens.map(code => {
              const allergen = allergens.find(a => a.code === code);
              return allergen ? (
                <Badge key={code} variant="destructive" className="text-xs">
                  {allergen.icon} {allergen.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};
