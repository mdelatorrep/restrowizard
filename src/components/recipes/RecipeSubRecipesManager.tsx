import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RecipeWithDetails, SubRecipeLink } from '@/hooks/useRecipes';
import { Plus, Trash2, Link2, ChefHat, DollarSign } from 'lucide-react';

interface Props {
  currentRecipeId: string;
  subRecipes: SubRecipeLink[];
  availableSubRecipes: RecipeWithDetails[];
  onAdd: (subRecipeId: string, quantity: number, unit: string) => void;
  onRemove: (linkId: string) => void;
}

export const RecipeSubRecipesManager = ({ 
  currentRecipeId,
  subRecipes, 
  availableSubRecipes, 
  onAdd, 
  onRemove 
}: Props) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSubRecipeId, setSelectedSubRecipeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('porción');

  // Filter out already added sub-recipes and the current recipe itself
  const addedIds = subRecipes.map(sr => sr.sub_recipe_id);
  const filteredAvailable = availableSubRecipes.filter(
    r => !addedIds.includes(r.id) && r.id !== currentRecipeId
  );

  const handleAdd = () => {
    if (!selectedSubRecipeId) return;
    onAdd(selectedSubRecipeId, quantity, unit);
    setShowAddDialog(false);
    setSelectedSubRecipeId('');
    setQuantity(1);
    setUnit('porción');
  };

  const totalSubRecipeCost = subRecipes.reduce((sum, sr) => {
    return sum + (sr.quantity * (sr.sub_recipe?.cost_per_portion || 0));
  }, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Sub-Recetas
          </CardTitle>
          <CardDescription>
            Recetas base que se usan como ingredientes
          </CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" disabled={filteredAvailable.length === 0}>
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Sub-Receta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Seleccionar Sub-Receta</Label>
                <Select value={selectedSubRecipeId} onValueChange={setSelectedSubRecipeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAvailable.map(recipe => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        <div className="flex items-center gap-2">
                          <ChefHat className="h-4 w-4" />
                          <span>{recipe.name}</span>
                          <span className="text-muted-foreground text-xs">
                            (${recipe.cost_per_portion?.toFixed(2) || '0.00'}/porción)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                    min={0.1}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porción">Porción</SelectItem>
                      <SelectItem value="taza">Taza</SelectItem>
                      <SelectItem value="cucharada">Cucharada</SelectItem>
                      <SelectItem value="litro">Litro</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedSubRecipeId && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Costo estimado:</p>
                  <p className="text-lg font-bold">
                    ${(quantity * (filteredAvailable.find(r => r.id === selectedSubRecipeId)?.cost_per_portion || 0)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={!selectedSubRecipeId}>
                Agregar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {availableSubRecipes.length === 0 ? (
          <div className="text-center py-8">
            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              No hay sub-recetas disponibles
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Crea recetas marcadas como "sub-receta" para usarlas aquí
            </p>
          </div>
        ) : subRecipes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay sub-recetas agregadas
          </p>
        ) : (
          <div className="space-y-3">
            {subRecipes.map((link) => (
              <div 
                key={link.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ChefHat className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{link.sub_recipe?.name || 'Sub-receta'}</p>
                    <p className="text-sm text-muted-foreground">
                      {link.quantity} {link.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Costo</p>
                    <p className="font-mono font-bold">
                      ${(link.quantity * (link.sub_recipe?.cost_per_portion || 0)).toFixed(2)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onRemove(link.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Total */}
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Costo Total Sub-Recetas</p>
                <p className="text-xl font-bold flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {totalSubRecipeCost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
