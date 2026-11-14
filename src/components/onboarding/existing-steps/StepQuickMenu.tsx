import { Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { QuickDish } from '../quickSetup';

interface Props {
  dishes: QuickDish[];
  onChange: (dishes: QuickDish[]) => void;
}

const MAX_DISHES = 15;

/** C-07, paso 4: la carta mínima para que el sitio tenga algo que mostrar. */
export function StepQuickMenu({ dishes, onChange }: Props) {
  const update = (i: number, patch: Partial<QuickDish>) =>
    onChange(dishes.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const remove = (i: number) => onChange(dishes.filter((_, idx) => idx !== i));
  const add = () =>
    dishes.length < MAX_DISHES &&
    onChange([...dishes, { name: '', category: dishes.at(-1)?.category || 'Platos fuertes', price: '' }]);

  return (
    <>
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">Tu carta</CardTitle>
        <CardDescription className="font-lato-light">
          Empieza con tus platos más vendidos. Fotos, descripciones y recetas se agregan después.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="hidden sm:grid grid-cols-[1fr_9rem_7rem_2rem] gap-2 text-xs text-muted-foreground px-1">
          <span>Plato</span>
          <span>Categoría</span>
          <span>Precio</span>
          <span />
        </div>
        {dishes.map((dish, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-[1fr_9rem_7rem_2rem] gap-2">
            <Input
              className="col-span-2 sm:col-span-1"
              placeholder="Ej: Hamburguesa clásica"
              value={dish.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <Input placeholder="Categoría" value={dish.category} onChange={(e) => update(i, { category: e.target.value })} />
            <Input
              inputMode="numeric"
              placeholder="32000"
              value={dish.price}
              onChange={(e) => update(i, { price: e.target.value.replace(/[^0-9]/g, '') })}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Quitar plato"
              onClick={() => remove(i)}
              disabled={dishes.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={add} disabled={dishes.length >= MAX_DISHES} className="gap-2">
          <Plus className="h-4 w-4" /> Agregar plato
        </Button>
      </CardContent>
    </>
  );
}
