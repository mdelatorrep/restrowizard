import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface NewBrandFormData {
  brand_name: string;
  cuisine_type: string;
  logo_emoji: string;
}

interface Props {
  open: boolean;
  data: NewBrandFormData;
  onChange: (d: NewBrandFormData) => void;
  onCancel: () => void;
  onCreate: () => void;
  isSubmitting?: boolean;
}

export const NewBrandModal: React.FC<Props> = ({ open, data, onChange, onCancel, onCreate, isSubmitting }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Nueva Marca Virtual</CardTitle>
          <CardDescription>Crea una nueva marca para tu ghost kitchen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la Marca *</Label>
            <Input placeholder="Ej: Pizza Express" value={data.brand_name}
              onChange={(e) => onChange({ ...data, brand_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Cocina</Label>
            <Select value={data.cuisine_type} onValueChange={(v) => onChange({ ...data, cuisine_type: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="american">Americana</SelectItem>
                <SelectItem value="mexican">Mexicana</SelectItem>
                <SelectItem value="italian">Italiana</SelectItem>
                <SelectItem value="japanese">Japonesa</SelectItem>
                <SelectItem value="chinese">China</SelectItem>
                <SelectItem value="other">Otra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Emoji/Logo</Label>
            <Select value={data.logo_emoji} onValueChange={(v) => onChange({ ...data, logo_emoji: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="🍔">🍔 Hamburguesas</SelectItem>
                <SelectItem value="🍕">🍕 Pizza</SelectItem>
                <SelectItem value="🍣">🍣 Sushi</SelectItem>
                <SelectItem value="🌮">🌮 Tacos</SelectItem>
                <SelectItem value="🍜">🍜 Noodles</SelectItem>
                <SelectItem value="🥗">🥗 Saludable</SelectItem>
                <SelectItem value="🍗">🍗 Pollo</SelectItem>
                <SelectItem value="🍴">🍴 General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
            <Button className="flex-1" onClick={onCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Marca'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
