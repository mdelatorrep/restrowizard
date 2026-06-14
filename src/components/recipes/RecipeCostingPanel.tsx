import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RecipeWithDetails, ScaledRecipe } from '@/hooks/useRecipes';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  DollarSign, TrendingUp, Calculator, Scale,
  Clock, Percent, Package
} from 'lucide-react';

interface Props {
  recipe: RecipeWithDetails;
  onUpdate: (updates: Partial<RecipeWithDetails>) => void;
  onScale: (targetPortions: number) => ScaledRecipe;
}

export const RecipeCostingPanel = ({ recipe, onUpdate, onScale }: Props) => {
  const [targetPortions, setTargetPortions] = useState(recipe.portions || 1);
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [foodCostTarget, setFoodCostTarget] = useState(30);

  // Calculate costs
  const ingredientsCost = recipe.ingredients.reduce((sum, ing) => {
    const effectiveQty = ing.gross_quantity || ing.quantity;
    const yieldFactor = (ing.yield_percentage || 100) / 100;
    return sum + (effectiveQty * (ing.cost_per_unit || 0) / yieldFactor);
  }, 0);

  const subRecipesCost = recipe.sub_recipes.reduce((sum, sr) => {
    return sum + (sr.quantity * (sr.sub_recipe?.cost_per_portion || 0));
  }, 0);

  const laborCost = recipe.labor_time_minutes 
    ? (recipe.labor_time_minutes / 60) * (recipe.labor_cost_per_hour || 0) 
    : 0;

  const subtotal = ingredientsCost + subRecipesCost + laborCost;
  const wasteCost = subtotal * ((recipe.waste_percentage || 0) / 100);
  const overheadCost = subtotal * ((recipe.overhead_percentage || 0) / 100);
  const totalCost = subtotal + wasteCost + overheadCost;
  
  const portions = recipe.portions || recipe.yield_quantity || 1;
  const costPerPortion = portions > 0 ? totalCost / portions : 0;

  // Calculate suggested prices at different margins
  const priceAt25 = costPerPortion / 0.25;
  const priceAt30 = costPerPortion / 0.30;
  const priceAt35 = costPerPortion / 0.35;

  // Scaling
  const scaledRecipe = onScale(targetPortions);

  const handleFoodCostCalculation = () => {
    const price = costPerPortion / (foodCostTarget / 100);
    setSuggestedPrice(Math.round(price * 100) / 100);
  };

  return (
    <div className="space-y-6">
      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Desglose de Costos
          </CardTitle>
          <CardDescription>
            Análisis detallado del costo por porción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Cost items */}
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span>Ingredientes</span>
                <span className="font-mono">{formatCurrency(ingredientsCost)}</span>
              </div>
              {subRecipesCost > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span>Sub-recetas</span>
                  <span className="font-mono">{formatCurrency(subRecipesCost)}</span>
                </div>
              )}
              {laborCost > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span>Mano de Obra</span>
                  <span className="font-mono">{formatCurrency(laborCost)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {wasteCost > 0 && (
                <div className="flex justify-between py-2 border-b text-orange-600">
                  <span>+ Merma ({recipe.waste_percentage}%)</span>
                  <span className="font-mono">{formatCurrency(wasteCost)}</span>
                </div>
              )}
              {overheadCost > 0 && (
                <div className="flex justify-between py-2 border-b text-blue-600">
                  <span>+ Overhead ({recipe.overhead_percentage}%)</span>
                  <span className="font-mono">{formatCurrency(overheadCost)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 font-bold text-lg">
                <span>Costo Total</span>
                <span className="font-mono">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between py-3 bg-primary/10 rounded-lg px-4 -mx-4">
                <span className="font-bold">Costo por Porción</span>
                <span className="font-mono text-xl font-bold">{formatCurrency(costPerPortion)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Parámetros de Costo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Tiempo de Mano de Obra (min)
              </Label>
              <Input
                type="number"
                value={recipe.labor_time_minutes || 0}
                onChange={(e) => onUpdate({ labor_time_minutes: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Costo por Hora ($)</Label>
              <Input
                type="number"
                value={recipe.labor_cost_per_hour || 0}
                onChange={(e) => onUpdate({ labor_cost_per_hour: parseFloat(e.target.value) || 0 })}
                min={0}
                step="0.01"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Merma/Desperdicio (%)</Label>
              <Input
                type="number"
                value={recipe.waste_percentage || 0}
                onChange={(e) => onUpdate({ waste_percentage: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Overhead (%)</Label>
              <Input
                type="number"
                value={recipe.overhead_percentage || 0}
                onChange={(e) => onUpdate({ overhead_percentage: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Precios Sugeridos
          </CardTitle>
          <CardDescription>
            Basado en diferentes porcentajes de food cost
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
              <p className="text-sm text-muted-foreground">Food Cost 25%</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(priceAt25)}</p>
              <p className="text-xs text-muted-foreground">Margen: 75%</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-500">
              <p className="text-sm text-muted-foreground">Food Cost 30%</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(priceAt30)}</p>
              <p className="text-xs text-muted-foreground">Recomendado</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30">
              <p className="text-sm text-muted-foreground">Food Cost 35%</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(priceAt35)}</p>
              <p className="text-xs text-muted-foreground">Margen: 65%</p>
            </div>
          </div>

          {/* Custom calculation */}
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Food Cost Objetivo (%)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={foodCostTarget}
                  onChange={(e) => setFoodCostTarget(parseInt(e.target.value) || 30)}
                  min={1}
                  max={100}
                  className="w-24"
                />
                <Slider
                  value={[foodCostTarget]}
                  onValueChange={(v) => setFoodCostTarget(v[0])}
                  min={15}
                  max={50}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>
            <Button onClick={handleFoodCostCalculation} className="gap-2">
              <Calculator className="h-4 w-4" />
              Calcular
            </Button>
          </div>
          {suggestedPrice > 0 && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Precio sugerido al {foodCostTarget}% food cost</p>
              <p className="text-3xl font-bold">{formatCurrency(suggestedPrice)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipe Scaling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Escalado de Receta
          </CardTitle>
          <CardDescription>
            Calcula ingredientes para diferentes cantidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="space-y-2 flex-1">
              <Label>Porciones Objetivo</Label>
              <Input
                type="number"
                value={targetPortions}
                onChange={(e) => setTargetPortions(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Multiplicador</p>
              <p className="text-2xl font-bold">{scaledRecipe.multiplier.toFixed(2)}x</p>
            </div>
          </div>

          {targetPortions !== portions && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 font-medium flex justify-between">
                <span>Ingrediente</span>
                <span>Cantidad Escalada</span>
              </div>
              <div className="divide-y max-h-64 overflow-y-auto">
                {scaledRecipe.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex justify-between px-4 py-2">
                    <span>{ing.name}</span>
                    <span className="font-mono">
                      {ing.quantity} {ing.unit} 
                      <span className="text-muted-foreground ml-2">({formatCurrency(ing.cost)})</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-primary/10 px-4 py-3 font-bold flex justify-between">
                <span>Costo Total ({targetPortions} porciones)</span>
                <span className="font-mono">{formatCurrency(scaledRecipe.totalCost)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
