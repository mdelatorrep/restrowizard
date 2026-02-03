import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { RecipeNutrition, RecipeWithDetails } from '@/hooks/useRecipes';
import { Save, Calculator, Flame, Wheat, Droplets, Beef } from 'lucide-react';

interface Props {
  recipe: RecipeWithDetails;
  nutrition: RecipeNutrition | null;
  onSave: (data: Partial<RecipeNutrition>) => void;
  onCalculateFromIngredients: () => Partial<RecipeNutrition>;
}

export const RecipeNutritionEditor = ({ 
  recipe, 
  nutrition, 
  onSave, 
  onCalculateFromIngredients 
}: Props) => {
  const [form, setForm] = useState<Partial<RecipeNutrition>>({
    calories: 0,
    protein_grams: 0,
    carbs_grams: 0,
    fat_grams: 0,
    fiber_grams: 0,
    sugar_grams: 0,
    sodium_mg: 0,
    saturated_fat_grams: 0,
    cholesterol_mg: 0,
    is_estimated: true,
    notes: ''
  });

  useEffect(() => {
    if (nutrition) {
      setForm(nutrition);
    }
  }, [nutrition]);

  const handleCalculate = () => {
    const calculated = onCalculateFromIngredients();
    setForm(prev => ({ ...prev, ...calculated }));
  };

  const handleSave = () => {
    onSave(form);
  };

  // Calculate macro percentages
  const totalMacroGrams = (form.protein_grams || 0) + (form.carbs_grams || 0) + (form.fat_grams || 0);
  const proteinPercent = totalMacroGrams > 0 ? ((form.protein_grams || 0) / totalMacroGrams) * 100 : 0;
  const carbsPercent = totalMacroGrams > 0 ? ((form.carbs_grams || 0) / totalMacroGrams) * 100 : 0;
  const fatPercent = totalMacroGrams > 0 ? ((form.fat_grams || 0) / totalMacroGrams) * 100 : 0;

  // Calculate calories from macros (for validation)
  const calculatedCalories = (
    ((form.protein_grams || 0) * 4) + 
    ((form.carbs_grams || 0) * 4) + 
    ((form.fat_grams || 0) * 9)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Información Nutricional</h3>
          <p className="text-sm text-muted-foreground">
            Por porción ({recipe.portions || 1} porciones totales)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCalculate} className="gap-2">
            <Calculator className="h-4 w-4" />
            Calcular desde Ingredientes
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Visual Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2">
                <Flame className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-2xl font-bold">{form.calories || 0}</p>
              <p className="text-xs text-muted-foreground">Calorías</p>
            </div>
            <div>
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2">
                <Beef className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-2xl font-bold">{form.protein_grams || 0}g</p>
              <p className="text-xs text-muted-foreground">Proteína</p>
            </div>
            <div>
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                <Wheat className="h-8 w-8 text-amber-600" />
              </div>
              <p className="text-2xl font-bold">{form.carbs_grams || 0}g</p>
              <p className="text-xs text-muted-foreground">Carbohidratos</p>
            </div>
            <div>
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-2">
                <Droplets className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold">{form.fat_grams || 0}g</p>
              <p className="text-xs text-muted-foreground">Grasa</p>
            </div>
          </div>

          {/* Macro Distribution */}
          <div className="mt-6">
            <p className="text-sm font-medium mb-2">Distribución de Macros</p>
            <div className="h-4 rounded-full overflow-hidden flex bg-muted">
              <div 
                className="bg-red-500 transition-all" 
                style={{ width: `${proteinPercent}%` }}
                title={`Proteína: ${proteinPercent.toFixed(1)}%`}
              />
              <div 
                className="bg-amber-500 transition-all" 
                style={{ width: `${carbsPercent}%` }}
                title={`Carbos: ${carbsPercent.toFixed(1)}%`}
              />
              <div 
                className="bg-yellow-500 transition-all" 
                style={{ width: `${fatPercent}%` }}
                title={`Grasa: ${fatPercent.toFixed(1)}%`}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Proteína {proteinPercent.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Carbos {carbsPercent.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Grasa {fatPercent.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Calorie Check */}
          {(form.calories || 0) > 0 && Math.abs((form.calories || 0) - calculatedCalories) > 20 && (
            <p className="text-xs text-orange-600 mt-3">
              ⚠️ Las calorías calculadas desde macros serían ~{Math.round(calculatedCalories)} kcal
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detailed Form */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Macronutrientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Calorías (kcal)</Label>
              <Input
                type="number"
                value={form.calories || 0}
                onChange={(e) => setForm({ ...form, calories: parseFloat(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="grid gap-2">
              <Label>Proteína (g)</Label>
              <Input
                type="number"
                value={form.protein_grams || 0}
                onChange={(e) => setForm({ ...form, protein_grams: parseFloat(e.target.value) || 0 })}
                min={0}
                step="0.1"
              />
            </div>
            <div className="grid gap-2">
              <Label>Carbohidratos (g)</Label>
              <Input
                type="number"
                value={form.carbs_grams || 0}
                onChange={(e) => setForm({ ...form, carbs_grams: parseFloat(e.target.value) || 0 })}
                min={0}
                step="0.1"
              />
            </div>
            <div className="grid gap-2">
              <Label>Grasa Total (g)</Label>
              <Input
                type="number"
                value={form.fat_grams || 0}
                onChange={(e) => setForm({ ...form, fat_grams: parseFloat(e.target.value) || 0 })}
                min={0}
                step="0.1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalles Adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Fibra (g)</Label>
              <Input
                type="number"
                value={form.fiber_grams || 0}
                onChange={(e) => setForm({ ...form, fiber_grams: parseFloat(e.target.value) || 0 })}
                min={0}
                step="0.1"
              />
            </div>
            <div className="grid gap-2">
              <Label>Azúcar (g)</Label>
              <Input
                type="number"
                value={form.sugar_grams || 0}
                onChange={(e) => setForm({ ...form, sugar_grams: parseFloat(e.target.value) || 0 })}
                min={0}
                step="0.1"
              />
            </div>
            <div className="grid gap-2">
              <Label>Sodio (mg)</Label>
              <Input
                type="number"
                value={form.sodium_mg || 0}
                onChange={(e) => setForm({ ...form, sodium_mg: parseFloat(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="grid gap-2">
              <Label>Grasa Saturada (g)</Label>
              <Input
                type="number"
                value={form.saturated_fat_grams || 0}
                onChange={(e) => setForm({ ...form, saturated_fat_grams: parseFloat(e.target.value) || 0 })}
                min={0}
                step="0.1"
              />
            </div>
            <div className="grid gap-2">
              <Label>Colesterol (mg)</Label>
              <Input
                type="number"
                value={form.cholesterol_mg || 0}
                onChange={(e) => setForm({ ...form, cholesterol_mg: parseFloat(e.target.value) || 0 })}
                min={0}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes & Estimation Flag */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={form.is_estimated}
              onCheckedChange={(checked) => setForm({ ...form, is_estimated: checked })}
            />
            <Label>Valores estimados (no verificados en laboratorio)</Label>
          </div>
          <div className="grid gap-2">
            <Label>Notas</Label>
            <Textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas sobre la información nutricional..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
