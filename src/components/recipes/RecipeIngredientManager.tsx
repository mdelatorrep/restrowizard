import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import {
  RecipeIngredient,
  MeasurementUnit,
  Allergen
} from '@/hooks/useRecipes';
import { useEnterpriseInventory } from '@/hooks/useEnterpriseInventory';
import { Plus, Trash2, Edit, AlertTriangle, GripVertical, Package } from 'lucide-react';
import { RecipeIngredientExtendedSchema } from '@/lib/schemas/recipe';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatCurrency';

interface Props {
  ingredients: RecipeIngredient[];
  units: MeasurementUnit[];
  allergens: Allergen[];
  onAdd: (data: Partial<RecipeIngredient>) => void;
  onUpdate: (id: string, data: Partial<RecipeIngredient>) => void;
  onRemove: (id: string) => void;
}

const MANUAL_ITEM = '__manual__';

export const RecipeIngredientManager = ({
  ingredients,
  units,
  allergens,
  onAdd,
  onUpdate,
  onRemove
}: Props) => {
  const { inventory } = useEnterpriseInventory();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    inventory_item_id: '' as string | null | '',
    ingredient_name: '',
    quantity: 0,
    unit: 'g',
    cost_per_unit: 0,
    gross_quantity: 0,
    yield_percentage: 100,
    preparation_method: '',
    is_optional: false,
    calories_per_unit: 0,
    protein_per_unit: 0,
    carbs_per_unit: 0,
    fat_per_unit: 0,
    allergen_ids: [] as string[]
  });

  const resetForm = () => {
    setForm({
      inventory_item_id: '',
      ingredient_name: '',
      quantity: 0,
      unit: 'g',
      cost_per_unit: 0,
      gross_quantity: 0,
      yield_percentage: 100,
      preparation_method: '',
      is_optional: false,
      calories_per_unit: 0,
      protein_per_unit: 0,
      carbs_per_unit: 0,
      fat_per_unit: 0,
      allergen_ids: []
    });
    setEditingId(null);
  };

  // TK-01: al elegir un ítem de inventario, hereda nombre/unidad/costo.
  const handleInventorySelect = (value: string) => {
    if (value === MANUAL_ITEM) {
      setForm(prev => ({ ...prev, inventory_item_id: null as any }));
      return;
    }
    const item = (inventory || []).find(i => i.id === value);
    if (!item) return;
    setForm(prev => ({
      ...prev,
      inventory_item_id: item.id,
      ingredient_name: item.item_name,
      unit: item.unit || prev.unit,
      cost_per_unit: Number(item.unit_cost) || prev.cost_per_unit,
    }));
  };


  const handleSubmit = () => {
    const parsed = RecipeIngredientExtendedSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Revisa los datos del ingrediente');
      return;
    }

    const payload = {
      ...form,
      inventory_item_id: form.inventory_item_id ? form.inventory_item_id : null,
    };

    if (editingId) {
      onUpdate(editingId, payload as Partial<RecipeIngredient>);
    } else {
      onAdd({
        ...payload,
        sort_order: ingredients.length,
      } as Partial<RecipeIngredient>);
    }

    setShowAddDialog(false);
    resetForm();
  };


  const handleEdit = (ingredient: RecipeIngredient) => {
    setForm({
      inventory_item_id: ingredient.inventory_item_id || '',
      ingredient_name: ingredient.ingredient_name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      cost_per_unit: ingredient.cost_per_unit || 0,
      gross_quantity: ingredient.gross_quantity || 0,
      yield_percentage: ingredient.yield_percentage || 100,
      preparation_method: ingredient.preparation_method || '',
      is_optional: ingredient.is_optional,
      calories_per_unit: ingredient.calories_per_unit || 0,
      protein_per_unit: ingredient.protein_per_unit || 0,
      carbs_per_unit: ingredient.carbs_per_unit || 0,
      fat_per_unit: ingredient.fat_per_unit || 0,
      allergen_ids: ingredient.allergen_ids || []
    });
    setEditingId(ingredient.id);
    setShowAddDialog(true);
  };

  const toggleAllergen = (allergenId: string) => {
    setForm(prev => ({
      ...prev,
      allergen_ids: prev.allergen_ids.includes(allergenId)
        ? prev.allergen_ids.filter(id => id !== allergenId)
        : [...prev.allergen_ids, allergenId]
    }));
  };

  const totalCost = ingredients.reduce((sum, ing) => {
    const effectiveQty = ing.gross_quantity || ing.quantity;
    const yieldFactor = (ing.yield_percentage || 100) / 100;
    return sum + (effectiveQty * (ing.cost_per_unit || 0) / yieldFactor);
  }, 0);

  const ingredientAllergens = (ing: RecipeIngredient) => {
    return allergens.filter(a => ing.allergen_ids?.includes(a.id));
  };

  const linkedItem = form.inventory_item_id
    ? (inventory || []).find(i => i.id === form.inventory_item_id)
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Ingredientes</CardTitle>
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Ingrediente' : 'Agregar Ingrediente'}</DialogTitle>
              <DialogDescription>
                Vincula el ingrediente con un ítem de inventario para activar costeo automático y descuento de stock al vender.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* TK-01: Inventory picker */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" /> Vincular con Inventario
                </Label>
                <Select
                  value={form.inventory_item_id || MANUAL_ITEM}
                  onValueChange={handleInventorySelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un ítem del inventario..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MANUAL_ITEM}>— Sin vincular (manual) —</SelectItem>
                    {(inventory || []).map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.item_name} · {formatCurrency(Number(item.unit_cost) || 0)}/{item.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {linkedItem ? (
                  <p className="text-xs text-muted-foreground">
                    Costo y unidad se actualizan automáticamente desde Inventario. Puedes sobreescribirlos abajo.
                  </p>
                ) : (
                  <p className="text-xs text-amber-600">
                    Sin vincular: la receta no descontará stock al vender este platillo.
                  </p>
                )}
              </div>

              {/* Basic Info */}
              <div className="grid gap-2">
                <Label>Nombre del Ingrediente *</Label>
                <Input
                  value={form.ingredient_name}
                  onChange={(e) => setForm({ ...form, ingredient_name: e.target.value })}
                  placeholder="Ej: Harina de trigo"
                />
              </div>


              {/* Quantity & Unit */}
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Cantidad Neta</Label>
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Cantidad Bruta</Label>
                  <Input
                    type="number"
                    value={form.gross_quantity}
                    onChange={(e) => setForm({ ...form, gross_quantity: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step="0.01"
                    placeholder="Antes de limpiar"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Unidad</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Fallback: si la unidad del inventario no está en el catálogo, mantenerla disponible */}
                      {form.unit && !units.some(u => u.abbreviation === form.unit) && (
                        <SelectItem value={form.unit}>{form.unit}</SelectItem>
                      )}
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.abbreviation}>
                          {unit.name} ({unit.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Yield & Prep */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Rendimiento (%)</Label>
                  <Input
                    type="number"
                    value={form.yield_percentage}
                    onChange={(e) => setForm({ ...form, yield_percentage: parseFloat(e.target.value) || 100 })}
                    min={1}
                    max={100}
                    placeholder="% utilizable después de merma"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Método de Preparación</Label>
                  <Select value={form.preparation_method} onValueChange={(v) => setForm({ ...form, preparation_method: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entero">Entero</SelectItem>
                      <SelectItem value="picado">Picado</SelectItem>
                      <SelectItem value="cubos">En cubos</SelectItem>
                      <SelectItem value="juliana">Juliana</SelectItem>
                      <SelectItem value="rallado">Rallado</SelectItem>
                      <SelectItem value="molido">Molido</SelectItem>
                      <SelectItem value="licuado">Licuado</SelectItem>
                      <SelectItem value="fileteado">Fileteado</SelectItem>
                      <SelectItem value="brunoise">Brunoise</SelectItem>
                      <SelectItem value="chiffonade">Chiffonade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cost */}
              <div className="grid gap-2">
                <Label>Costo por Unidad ($)</Label>
                <Input
                  type="number"
                  value={form.cost_per_unit}
                  onChange={(e) => setForm({ ...form, cost_per_unit: parseFloat(e.target.value) || 0 })}
                  min={0}
                  step="0.01"
                />
              </div>

              {/* Nutrition */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Información Nutricional (por unidad)</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Calorías</Label>
                    <Input
                      type="number"
                      value={form.calories_per_unit}
                      onChange={(e) => setForm({ ...form, calories_per_unit: parseFloat(e.target.value) || 0 })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Proteína (g)</Label>
                    <Input
                      type="number"
                      value={form.protein_per_unit}
                      onChange={(e) => setForm({ ...form, protein_per_unit: parseFloat(e.target.value) || 0 })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Carbos (g)</Label>
                    <Input
                      type="number"
                      value={form.carbs_per_unit}
                      onChange={(e) => setForm({ ...form, carbs_per_unit: parseFloat(e.target.value) || 0 })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Grasa (g)</Label>
                    <Input
                      type="number"
                      value={form.fat_per_unit}
                      onChange={(e) => setForm({ ...form, fat_per_unit: parseFloat(e.target.value) || 0 })}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Allergens */}
              <div className="space-y-2">
                <Label>Alérgenos</Label>
                <div className="flex flex-wrap gap-2">
                  {allergens.map(allergen => (
                    <Badge
                      key={allergen.id}
                      variant={form.allergen_ids.includes(allergen.id) ? 'destructive' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleAllergen(allergen.id)}
                    >
                      {allergen.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingId ? 'Guardar Cambios' : 'Agregar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {ingredients.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay ingredientes agregados
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead>Alérgenos</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ing) => {
                  const ingAllergens = ingredientAllergens(ing);
                  const effectiveCost = (ing.gross_quantity || ing.quantity) * (ing.cost_per_unit || 0) / ((ing.yield_percentage || 100) / 100);
                  
                  return (
                    <TableRow key={ing.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{ing.ingredient_name}</span>
                          {ing.preparation_method && (
                            <span className="text-xs text-muted-foreground">{ing.preparation_method}</span>
                          )}
                          {ing.is_optional && (
                            <Badge variant="outline" className="w-fit text-xs mt-1">Opcional</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span>{ing.quantity} {ing.unit}</span>
                        {ing.gross_quantity && ing.gross_quantity !== ing.quantity && (
                          <span className="text-xs text-muted-foreground block">
                            (bruto: {ing.gross_quantity} {ing.unit})
                          </span>
                        )}
                        {ing.yield_percentage && ing.yield_percentage < 100 && (
                          <span className="text-xs text-orange-600 block">
                            {ing.yield_percentage}% rendimiento
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(effectiveCost)}
                      </TableCell>
                      <TableCell>
                        {ingAllergens.length > 0 && (
                          <div className="flex gap-1">
                            {ingAllergens.map(a => (
                              <Badge key={a.id} variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {a.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(ing)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onRemove(ing.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4 pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Costo Total Ingredientes</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
