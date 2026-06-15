import { useState } from 'react';
import { useUnitConversions } from '@/hooks/useUnitConversions';
import { useRecipes } from '@/hooks/useRecipes';
import { useEnterpriseInventory } from '@/hooks/useEnterpriseInventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, Plus, Trash2, Scale } from 'lucide-react';

const GENERIC_ID = '__generic__';

export const UnitConversionsManager = () => {
  const { units } = useRecipes();
  const { inventory } = useEnterpriseInventory();
  const { conversions, loading, addConversion, removeConversion } = useUnitConversions();

  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [factor, setFactor] = useState<number>(1);
  const [ingredient, setIngredient] = useState<string>(GENERIC_ID);
  const [notes, setNotes] = useState('');

  const handleAdd = async () => {
    if (!fromUnit || !toUnit) return;
    await addConversion({
      from_unit_id: fromUnit,
      to_unit_id: toUnit,
      conversion_factor: factor,
      ingredient_id: ingredient === GENERIC_ID ? null : ingredient,
      notes,
    });
    setFromUnit(''); setToUnit(''); setFactor(1); setIngredient(GENERIC_ID); setNotes('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="h-5 w-5 text-primary" />
          Conversiones de Unidades
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Define equivalencias entre unidades. Las conversiones <em>específicas por ingrediente</em>
          (ej. "1 taza de harina = 120 g") tienen prioridad sobre las genéricas.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-6 items-end p-3 rounded-lg bg-muted/30">
          <div className="md:col-span-1">
            <label className="text-xs text-muted-foreground">De</label>
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger>
              <SelectContent>
                {units.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end justify-center pb-2"><ArrowRightLeft className="h-4 w-4 text-muted-foreground" /></div>
          <div className="md:col-span-1">
            <label className="text-xs text-muted-foreground">A</label>
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger>
              <SelectContent>
                {units.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-muted-foreground">Factor (1 de → ? a)</label>
            <Input type="number" step="0.0001" min={0} value={factor}
              onChange={(e) => setFactor(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-muted-foreground">Ingrediente</label>
            <Select value={ingredient} onValueChange={setIngredient}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={GENERIC_ID}>Genérica (cualquier ingrediente)</SelectItem>
                {(inventory || []).map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.item_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!fromUnit || !toUnit || factor <= 0}>
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-6">Cargando…</p>
        ) : conversions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">Aún no hay conversiones definidas.</p>
        ) : (
          <div className="space-y-2">
            {conversions.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <Badge variant={c.ingredient_id ? 'default' : 'outline'} className="text-xs flex-shrink-0">
                  {c.ingredient_id ? 'Específica' : 'Genérica'}
                </Badge>
                <div className="flex-1 text-sm">
                  <span className="font-mono">
                    1 {c.from_unit?.abbreviation} = {c.conversion_factor} {c.to_unit?.abbreviation}
                  </span>
                  {c.ingredient && (
                    <span className="ml-2 text-muted-foreground">para {c.ingredient.item_name}</span>
                  )}
                  {c.notes && <span className="ml-2 text-xs text-muted-foreground">· {c.notes}</span>}
                </div>
                {c.user_id && (
                  <Button variant="ghost" size="icon" onClick={() => removeConversion(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
