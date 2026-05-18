import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Utensils, Plus, Trash2 } from 'lucide-react';
import type { QuotationFormData, QuotationMenuItem } from '@/hooks/useQuotations';
import { menuCategories, formatCurrency } from './constants';

interface Props {
  formData: QuotationFormData;
  addMenuItem: () => void;
  updateMenuItem: (index: number, updates: Partial<QuotationMenuItem>) => void;
  removeMenuItem: (index: number) => void;
  menuTotal: number;
}

export const Step3Menu = ({ formData, addMenuItem, updateMenuItem, removeMenuItem, menuTotal }: Props) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-lg font-medium">
        <Utensils className="h-5 w-5 text-primary" />
        Propuesta de Menú
      </div>
      <Button variant="outline" size="sm" onClick={addMenuItem}>
        <Plus className="mr-2 h-4 w-4" />
        Agregar Platillo
      </Button>
    </div>

    {formData.menu_items.length === 0 ? (
      <div className="text-center py-8 border rounded-lg border-dashed">
        <Utensils className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-2 text-muted-foreground">Agrega los platillos de la propuesta</p>
        <Button variant="outline" className="mt-4" onClick={addMenuItem}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Primer Platillo
        </Button>
      </div>
    ) : (
      <div className="space-y-4">
        {formData.menu_items.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {menuCategories.find((c) => c.value === item.category)?.label || item.category}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => removeMenuItem(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Categoría</Label>
                <Select
                  value={item.category}
                  onValueChange={(value) => updateMenuItem(index, { category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {menuCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Nombre del Platillo</Label>
                <Input
                  value={item.item_name}
                  onChange={(e) => updateMenuItem(index, { item_name: e.target.value })}
                  placeholder="Ej: Filete de Res al Vino Tinto"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Descripción</Label>
                <Input
                  value={item.item_description || ''}
                  onChange={(e) => updateMenuItem(index, { item_description: e.target.value })}
                  placeholder="Descripción breve..."
                />
              </div>
              <div>
                <Label>Precio por Persona (MXN)</Label>
                <Input
                  type="number"
                  value={item.price_per_person}
                  onChange={(e) => updateMenuItem(index, { price_per_person: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    <div className="p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Costo del menú por persona:</span>
        <span className="font-medium">
          {formatCurrency(
            formData.menu_items.reduce((sum, item) => sum + (item.price_per_person || 0), 0)
          )}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-sm text-muted-foreground">
          Total menú ({formData.guest_count} personas):
        </span>
        <span className="font-medium">{formatCurrency(menuTotal)}</span>
      </div>
    </div>
  </div>
);
