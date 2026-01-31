import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useRecipes, RecipeWithIngredients } from '@/hooks/useRecipes';
import { useAIAgent } from '@/hooks/useAIAgent';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { useToast } from '@/hooks/use-toast';
import { PublishRecipeToMenuDialog } from '@/components/recipes/PublishRecipeToMenuDialog';
import { 
  ChefHat, Plus, Loader2, Clock, Users, DollarSign, Lock, 
  Trash2, Edit, Eye, Sparkles, Search, Link2
} from 'lucide-react';

const DifficultyBadge = ({ difficulty }: { difficulty: string | null }) => {
  const config: Record<string, string> = {
    facil: 'bg-green-100 text-green-800',
    media: 'bg-yellow-100 text-yellow-800',
    dificil: 'bg-red-100 text-red-800',
  };
  if (!difficulty) return null;
  return <Badge className={config[difficulty] || 'bg-gray-100'}>{difficulty}</Badge>;
};

const Recipes = () => {
  const { recipes, kpis, loading, hasData, createRecipe, updateRecipe, deleteRecipe, addIngredient, removeIngredient } = useRecipes();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | null>(null);
  const [publishRecipe, setPublishRecipe] = useState<RecipeWithIngredients | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  
  const { optimizeRecipeCosts, getIngredientSubstitutes, loading: aiLoading } = useAIAgent();

  const [recipeForm, setRecipeForm] = useState({
    name: '',
    category: 'plato_fuerte',
    portions: 1,
    preparation_time_minutes: 30,
    difficulty: 'media',
    instructions: '',
    tips: '',
    is_secret: false,
  });

  const [ingredientForm, setIngredientForm] = useState({
    ingredient_name: '',
    quantity: 0,
    unit: 'gr',
    cost_per_unit: 0,
  });

  const handleCreateRecipe = async () => {
    if (!recipeForm.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }
    await createRecipe(recipeForm);
    setShowCreateDialog(false);
    setRecipeForm({
      name: '',
      category: 'plato_fuerte',
      portions: 1,
      preparation_time_minutes: 30,
      difficulty: 'media',
      instructions: '',
      tips: '',
      is_secret: false,
    });
  };

  const handleAddIngredient = async () => {
    if (!selectedRecipe || !ingredientForm.ingredient_name.trim()) return;
    await addIngredient(selectedRecipe.id, ingredientForm);
    setIngredientForm({ ingredient_name: '', quantity: 0, unit: 'gr', cost_per_unit: 0 });
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || recipe.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(recipes.map(r => r.category))].filter(Boolean);

  const handleAnalyzeRecipes = async () => {
    const recipeData = {
      recipes: recipes.map(r => ({
        name: r.name,
        category: r.category,
        costPerPortion: r.cost_per_portion,
        totalCost: r.total_cost,
        portions: r.portions,
        preparationTime: r.preparation_time_minutes,
        ingredients: r.ingredients.map(i => ({
          name: i.ingredient_name,
          quantity: i.quantity,
          unit: i.unit,
          costPerUnit: i.cost_per_unit
        }))
      })),
      kpis: kpis,
      avgCostPerPortion: kpis?.avgCostPerPortion || 0
    };
    
    const result = await optimizeRecipeCosts(recipeData);
    if (result) setAiInsights(result);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Recetas</h1>
          <p className="text-muted-foreground">Administra las recetas y costeos de tu restaurante</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAnalyzeRecipes} disabled={aiLoading || recipes.length === 0}>
            <Sparkles className="h-4 w-4 mr-2" />
            {aiLoading ? 'Analizando...' : 'Optimizar Costos'}
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Receta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Receta</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label>Nombre de la Receta *</Label>
                <Input
                  value={recipeForm.name}
                  onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                  placeholder="Ej: Pasta Carbonara"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Categoría</Label>
                  <Select
                    value={recipeForm.category}
                    onValueChange={(value) => setRecipeForm({ ...recipeForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="plato_fuerte">Plato Fuerte</SelectItem>
                      <SelectItem value="postre">Postre</SelectItem>
                      <SelectItem value="bebida">Bebida</SelectItem>
                      <SelectItem value="salsa">Salsa</SelectItem>
                      <SelectItem value="base">Base/Preparación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Dificultad</Label>
                  <Select
                    value={recipeForm.difficulty}
                    onValueChange={(value) => setRecipeForm({ ...recipeForm, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Porciones</Label>
                  <Input
                    type="number"
                    value={recipeForm.portions}
                    onChange={(e) => setRecipeForm({ ...recipeForm, portions: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tiempo de Preparación (min)</Label>
                  <Input
                    type="number"
                    value={recipeForm.preparation_time_minutes}
                    onChange={(e) => setRecipeForm({ ...recipeForm, preparation_time_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Instrucciones</Label>
                <Textarea
                  value={recipeForm.instructions}
                  onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                  placeholder="Paso a paso de la preparación..."
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tips y Notas</Label>
                <Textarea
                  value={recipeForm.tips}
                  onChange={(e) => setRecipeForm({ ...recipeForm, tips: e.target.value })}
                  placeholder="Consejos para la preparación..."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={recipeForm.is_secret}
                  onCheckedChange={(checked) => setRecipeForm({ ...recipeForm, is_secret: checked })}
                />
                <Label>Receta Secreta (solo visible para administradores)</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateRecipe}>Crear Receta</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Recetas</p>
                <p className="text-3xl font-bold">{kpis?.totalRecipes || 0}</p>
              </div>
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Costo Promedio</p>
                <p className="text-3xl font-bold">${kpis?.avgCostPerPortion?.toLocaleString() || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categorías</p>
                <p className="text-3xl font-bold">{kpis?.categoriesCount || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recetas Secretas</p>
                <p className="text-3xl font-bold">{kpis?.secretRecipes || 0}</p>
              </div>
              <Lock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel
        title="Optimización de Recetas IA"
        description="Análisis de costos, sustitutos de ingredientes y maridajes"
        insights={aiInsights}
        loading={aiLoading}
        onAnalyze={handleAnalyzeRecipes}
      />

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar recetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recipes Grid */}
      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin recetas aún</h3>
            <p className="text-muted-foreground text-center mb-4">
              Empieza a documentar tus recetas y calcular costos
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Receta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {recipe.name}
                      {recipe.is_secret && <Lock className="h-4 w-4 text-orange-500" />}
                    </CardTitle>
                    <CardDescription>{recipe.category}</CardDescription>
                  </div>
                  <DifficultyBadge difficulty={recipe.difficulty} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{recipe.portions} porc.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{recipe.preparation_time_minutes || '-'} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${recipe.cost_per_portion?.toLocaleString() || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    {recipe.ingredients.length} ingredientes
                  </Badge>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setPublishRecipe(recipe)}
                      title="Publicar en Menú"
                    >
                      <Link2 className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedRecipe(recipe)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteRecipe(recipe.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Publish Recipe Dialog */}
      {publishRecipe && (
        <PublishRecipeToMenuDialog
          open={!!publishRecipe}
          onOpenChange={(open) => !open && setPublishRecipe(null)}
          recipe={{
            id: publishRecipe.id,
            name: publishRecipe.name,
            cost_per_portion: Number(publishRecipe.cost_per_portion) || 0,
            menu_item_id: publishRecipe.menu_item_id,
            portions_per_batch: publishRecipe.portions
          }}
          onSuccess={() => setPublishRecipe(null)}
        />
      )}

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedRecipe.name}
                  {selectedRecipe.is_secret && <Lock className="h-5 w-5 text-orange-500" />}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{selectedRecipe.portions}</p>
                      <p className="text-xs text-muted-foreground">Porciones</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{selectedRecipe.preparation_time_minutes || '-'}</p>
                      <p className="text-xs text-muted-foreground">Minutos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">${selectedRecipe.total_cost?.toLocaleString() || 0}</p>
                      <p className="text-xs text-muted-foreground">Costo Total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">${selectedRecipe.cost_per_portion?.toLocaleString() || 0}</p>
                      <p className="text-xs text-muted-foreground">Por Porción</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ingredientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedRecipe.ingredients.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Sin ingredientes</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedRecipe.ingredients.map((ing) => (
                          <div key={ing.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <span className="font-medium">{ing.ingredient_name}</span>
                              <span className="text-muted-foreground ml-2">
                                {ing.quantity} {ing.unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">${(ing.quantity * ing.cost_per_unit).toLocaleString()}</span>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeIngredient(ing.id, selectedRecipe.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Agregar Ingrediente</p>
                      <div className="grid grid-cols-5 gap-2">
                        <Input
                          placeholder="Ingrediente"
                          value={ingredientForm.ingredient_name}
                          onChange={(e) => setIngredientForm({ ...ingredientForm, ingredient_name: e.target.value })}
                          className="col-span-2"
                        />
                        <Input
                          type="number"
                          placeholder="Cantidad"
                          value={ingredientForm.quantity || ''}
                          onChange={(e) => setIngredientForm({ ...ingredientForm, quantity: parseFloat(e.target.value) || 0 })}
                        />
                        <Input
                          placeholder="Unidad"
                          value={ingredientForm.unit}
                          onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                        />
                        <Button onClick={handleAddIngredient}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedRecipe.instructions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Instrucciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{selectedRecipe.instructions}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedRecipe.tips && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{selectedRecipe.tips}</p>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-medium">Análisis IA</span>
                    </div>
                    <Button variant="outline">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Optimizar Receta con IA
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recipes;
