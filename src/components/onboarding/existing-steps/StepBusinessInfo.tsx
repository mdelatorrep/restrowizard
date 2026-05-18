import { Building2 } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectWithOther } from '@/components/ui/select-with-other';
import { BUSINESS_TYPES, CUISINE_TYPES } from '@/data/constants';

interface Props {
  values: { name: string; business_type: string; cuisine_type: string };
  onChange: (field: string, value: string) => void;
}

export function StepBusinessInfo({ values, onChange }: Props) {
  return (
    <>
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">Cuéntanos sobre tu restaurante</CardTitle>
        <CardDescription className="font-lato-light">
          Esta información nos ayudará a personalizar tu experiencia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del restaurante *</Label>
          <Input
            id="name"
            placeholder="Ej: La Trattoria Italiana"
            value={values.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_type">Tipo de negocio *</Label>
          <SelectWithOther
            options={BUSINESS_TYPES}
            value={values.business_type}
            onChange={(value) => onChange('business_type', value)}
            placeholder="Selecciona el tipo"
            otherPlaceholder="Especifica el tipo de negocio..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cuisine_type">Tipo de cocina</Label>
          <SelectWithOther
            options={CUISINE_TYPES}
            value={values.cuisine_type}
            onChange={(value) => onChange('cuisine_type', value)}
            placeholder="Selecciona la cocina"
            otherPlaceholder="Especifica el tipo de cocina..."
          />
        </div>
      </CardContent>
    </>
  );
}
