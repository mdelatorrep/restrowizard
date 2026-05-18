import { MapPin } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/data/constants';

interface Props {
  values: { country: string; address: string; city: string; state: string };
  onChange: (field: string, value: string) => void;
}

export function StepLocation({ values, onChange }: Props) {
  return (
    <>
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">¿Dónde está ubicado?</CardTitle>
        <CardDescription className="font-lato-light">
          Esto nos ayuda a ofrecerte información relevante de tu zona
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country">País *</Label>
          <Select value={values.country} onValueChange={(value) => onChange('country', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu país" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            placeholder="Calle, número, colonia"
            value={values.address}
            onChange={(e) => onChange('address', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad *</Label>
            <Input
              id="city"
              placeholder="Ej: Bogotá"
              value={values.city}
              onChange={(e) => onChange('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado / Departamento</Label>
            <Input
              id="state"
              placeholder="Ej: Cundinamarca"
              value={values.state}
              onChange={(e) => onChange('state', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </>
  );
}
