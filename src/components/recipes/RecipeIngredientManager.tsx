import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  RecipeIngredient, 
  MeasurementUnit, 
  Allergen 
} from '@/hooks/useRecipes';
import { Plus, Trash2, Edit, AlertTriangle, GripVertical } from 'lucide-react';
import { RecipeIngredientSchema } from '@/lib/schemas/recipe';
import { toast } from 'sonner';

interface Props {
  ingredients: RecipeIngredient[];
  units: MeasurementUnit[];
  allergens: Allergen[];
  onAdd: (data: Partial<RecipeIngredient>) => void;
  onUpdate: (id: string, data: Partial<RecipeIngredient>) => void;
  onRemove: (id: string) => void;
}

export const RecipeIngredientManager = ({ 
  ingredients, 
  units, 
  allergens,
  onAdd, 
  onUpdate, 
  onRemove 
}: Props) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
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

  const handleSubmit = () => {
    const parsed = RecipeIngredientSchema.safeParse({
      ingredient_name: form.ingredient_name,
      quantity: form.quantity,
      unit: form.unit,
      cost_per_unit: form.cost_per_unit,
      yield_percentage: form.yield_percentage,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Revisa los datos del ingrediente');
      return;
    }

    if (editingId) {
      onUpdate(editingId, form);
    } else {
      onAdd({
        ...form,
        sort_order: ingredients.length
      });
    }
    
    setShowAddDialog(false);
    resetForm();
  };

  const handleEdit = (ingredient: RecipeIngredient) => {
    setForm({
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
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                        ${effectiveCost.toFixed(2)}
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
                <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
