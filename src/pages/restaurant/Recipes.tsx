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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRecipes, RecipeWithDetails } from '@/hooks/useRecipes';
import { useAIAgent } from '@/hooks/useAIAgent';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { useToast } from '@/hooks/use-toast';
import { PublishRecipeToMenuDialog } from '@/components/recipes/PublishRecipeToMenuDialog';
import { RecipeIngredientManager } from '@/components/recipes/RecipeIngredientManager';
import { RecipeStepsManager } from '@/components/recipes/RecipeStepsManager';
import { RecipeNutritionEditor } from '@/components/recipes/RecipeNutritionEditor';
import { RecipeCostingPanel } from '@/components/recipes/RecipeCostingPanel';
import { RecipeSubRecipesManager } from '@/components/recipes/RecipeSubRecipesManager';
import { 
  ChefHat, Plus, Loader2, Clock, Users, DollarSign, Lock, 
  Trash2, Eye, Sparkles, Search, Link2, BookOpen, 
  UtensilsCrossed, Flame, Scale, AlertTriangle, X
} from 'lucide-react';

const DifficultyBadge = ({ difficulty }: { difficulty: string | null }) => {
  const config: Record<string, string> = {
    facil: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    media: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    dificil: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  if (!difficulty) return null;
  return <Badge className={config[difficulty] || 'bg-gray-100'}>{difficulty}</Badge>;
};

const Recipes = () => {
  const { 
    recipes, 
    units,
    allergens,
    kpis, 
    loading, 
    hasData, 
    createRecipe, 
    updateRecipe, 
    deleteRecipe, 
    addIngredient, 
    updateIngredient,
    removeIngredient,
    addStep,
    updateStep,
    removeStep,
    reorderSteps,
    saveNutrition,
    calculateNutritionFromIngredients,
    addSubRecipe,
    removeSubRecipe,
    getSubRecipes,
    scaleRecipe
  } = useRecipes();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithDetails | null>(null);
  const [publishRecipe, setPublishRecipe] = useState<RecipeWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  
  const { optimizeRecipeCosts, loading: aiLoading } = useAIAgent();

  const [recipeForm, setRecipeForm] = useState({
    name: '',
    category: 'plato_fuerte',
    portions: 1,
    preparation_time_minutes: 30,
    difficulty: 'media',
    instructions: '',
    tips: '',
    is_secret: false,
    is_sub_recipe: false,
    yield_quantity: 1,
    yield_unit: 'porciones',
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
      is_sub_recipe: false,
      yield_quantity: 1,
      yield_unit: 'porciones',
    });
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || recipe.category === filterCategory;
    const matchesType = filterType === 'all' 
      || (filterType === 'sub' && recipe.is_sub_recipe) 
      || (filterType === 'main' && !recipe.is_sub_recipe);
    return matchesSearch && matchesCategory && matchesType;
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

  // Get all allergens for selected recipe
  const getRecipeAllergens = (recipe: RecipeWithDetails) => {
    const allergenIds = new Set<string>();
    recipe.allergen_ids?.forEach(id => allergenIds.add(id));
    recipe.ingredients.forEach(ing => {
      ing.allergen_ids?.forEach(id => allergenIds.add(id));
    });
    return allergens.filter(a => allergenIds.has(a.id));
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
          <p className="text-muted-foreground">Recetas profesionales con costeo, nutrición y sub-recetas</p>
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
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Receta</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                        <SelectItem value="guarnicion">Guarnición</SelectItem>
                        <SelectItem value="aderezo">Aderezo</SelectItem>
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Porciones/Rendimiento</Label>
                    <Input
                      type="number"
                      value={recipeForm.portions}
                      onChange={(e) => setRecipeForm({ ...recipeForm, portions: parseInt(e.target.value) || 1 })}
                      min={1}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Unidad de Rendimiento</Label>
                    <Select
                      value={recipeForm.yield_unit}
                      onValueChange={(value) => setRecipeForm({ ...recipeForm, yield_unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="porciones">Porciones</SelectItem>
                        <SelectItem value="litros">Litros</SelectItem>
                        <SelectItem value="kg">Kilogramos</SelectItem>
                        <SelectItem value="unidades">Unidades</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tiempo Prep. (min)</Label>
                    <Input
                      type="number"
                      value={recipeForm.preparation_time_minutes}
                      onChange={(e) => setRecipeForm({ ...recipeForm, preparation_time_minutes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Instrucciones Básicas</Label>
                  <Textarea
                    value={recipeForm.instructions}
                    onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                    placeholder="Descripción general (los pasos detallados se agregan después)"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={recipeForm.is_sub_recipe}
                      onCheckedChange={(checked) => setRecipeForm({ ...recipeForm, is_sub_recipe: checked })}
                    />
                    <Label>Sub-receta (base para otras recetas)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={recipeForm.is_secret}
                      onCheckedChange={(checked) => setRecipeForm({ ...recipeForm, is_secret: checked })}
                    />
                    <Label className="flex items-center gap-1">
                      <Lock className="h-4 w-4" />
                      Receta Secreta
                    </Label>
                  </div>
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
      <div className="grid md:grid-cols-6 gap-4">
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
                <p className="text-sm text-muted-foreground">Sub-Recetas</p>
                <p className="text-3xl font-bold">{kpis?.subRecipesCount || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
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
                <p className="text-sm text-muted-foreground">Calorías Prom.</p>
                <p className="text-3xl font-bold">{kpis?.avgNutritionCalories || 0}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-500" />
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
              <UtensilsCrossed className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Secretas</p>
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
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="main">Recetas principales</SelectItem>
            <SelectItem value="sub">Sub-recetas</SelectItem>
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
              Empieza a documentar tus recetas con costeo profesional
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Receta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => {
            const recipeAllergens = getRecipeAllergens(recipe);
            return (
              <Card key={recipe.id} className={`hover:shadow-md transition-shadow ${recipe.is_sub_recipe ? 'border-purple-500/30' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        {recipe.name}
                        {recipe.is_secret && <Lock className="h-4 w-4 text-orange-500" />}
                        {recipe.is_sub_recipe && (
                          <Badge variant="outline" className="text-purple-600 border-purple-500">
                            Sub-receta
                          </Badge>
                        )}
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
                      <span>{recipe.portions} {recipe.yield_unit || 'porc.'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{recipe.preparation_time_minutes || '-'} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${recipe.cost_per_portion?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>

                  {/* Allergens */}
                  {recipeAllergens.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {recipeAllergens.slice(0, 3).map(a => (
                        <Badge key={a.id} variant="destructive" className="text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {a.name}
                        </Badge>
                      ))}
                      {recipeAllergens.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{recipeAllergens.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {recipe.ingredients.length} ingredientes
                      </Badge>
                      {recipe.steps.length > 0 && (
                        <Badge variant="outline">
                          {recipe.steps.length} pasos
                        </Badge>
                      )}
                      {recipe.nutrition && (
                        <Badge variant="secondary" className="gap-1">
                          <Flame className="h-3 w-3" />
                          {recipe.nutrition.calories} kcal
                        </Badge>
                      )}
                    </div>
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
            );
          })}
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

      {/* Recipe Detail Dialog - Professional View with Tabs */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedRecipe && (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    {selectedRecipe.name}
                    {selectedRecipe.is_secret && <Lock className="h-5 w-5 text-orange-500" />}
                    {selectedRecipe.is_sub_recipe && (
                      <Badge variant="outline" className="text-purple-600 border-purple-500">
                        Sub-receta
                      </Badge>
                    )}
                    <DifficultyBadge difficulty={selectedRecipe.difficulty} />
                  </DialogTitle>
                </div>
                
                {/* Quick Stats */}
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedRecipe.portions} {selectedRecipe.yield_unit}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedRecipe.preparation_time_minutes || 0} min
                  </span>
                  <span className="flex items-center gap-1 text-green-600 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    ${selectedRecipe.cost_per_portion?.toFixed(2) || '0.00'}/porción
                  </span>
                  {selectedRecipe.nutrition && (
                    <span className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {selectedRecipe.nutrition.calories} kcal
                    </span>
                  )}
                </div>
              </DialogHeader>

              <Tabs defaultValue="ingredients" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="flex-shrink-0 w-full justify-start gap-1 flex-wrap h-auto py-1">
                  <TabsTrigger value="ingredients" className="gap-1">
                    <UtensilsCrossed className="h-4 w-4" />
                    Ingredientes
                  </TabsTrigger>
                  <TabsTrigger value="steps" className="gap-1">
                    <BookOpen className="h-4 w-4" />
                    Preparación
                  </TabsTrigger>
                  <TabsTrigger value="subrecipes" className="gap-1">
                    <Link2 className="h-4 w-4" />
                    Sub-Recetas
                  </TabsTrigger>
                  <TabsTrigger value="nutrition" className="gap-1">
                    <Flame className="h-4 w-4" />
                    Nutrición
                  </TabsTrigger>
                  <TabsTrigger value="costing" className="gap-1">
                    <Scale className="h-4 w-4" />
                    Costeo
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto mt-4">
                  <TabsContent value="ingredients" className="m-0 h-full">
                    <RecipeIngredientManager
                      ingredients={selectedRecipe.ingredients}
                      units={units}
                      allergens={allergens}
                      onAdd={(data) => addIngredient(selectedRecipe.id, data)}
                      onUpdate={(id, data) => updateIngredient(id, data, selectedRecipe.id)}
                      onRemove={(id) => removeIngredient(id, selectedRecipe.id)}
                    />
                  </TabsContent>

                  <TabsContent value="steps" className="m-0 h-full">
                    <RecipeStepsManager
                      steps={selectedRecipe.steps}
                      onAdd={(data) => addStep(selectedRecipe.id, data)}
                      onUpdate={updateStep}
                      onRemove={removeStep}
                      onReorder={(ids) => reorderSteps(selectedRecipe.id, ids)}
                    />
                  </TabsContent>

                  <TabsContent value="subrecipes" className="m-0 h-full">
                    <RecipeSubRecipesManager
                      currentRecipeId={selectedRecipe.id}
                      subRecipes={selectedRecipe.sub_recipes}
                      availableSubRecipes={getSubRecipes()}
                      onAdd={(subId, qty, unit) => addSubRecipe(selectedRecipe.id, subId, qty, unit)}
                      onRemove={(linkId) => removeSubRecipe(linkId, selectedRecipe.id)}
                    />
                  </TabsContent>

                  <TabsContent value="nutrition" className="m-0 h-full">
                    <RecipeNutritionEditor
                      recipe={selectedRecipe}
                      nutrition={selectedRecipe.nutrition}
                      onSave={(data) => saveNutrition(selectedRecipe.id, data)}
                      onCalculateFromIngredients={() => calculateNutritionFromIngredients(selectedRecipe)}
                    />
                  </TabsContent>

                  <TabsContent value="costing" className="m-0 h-full">
                    <RecipeCostingPanel
                      recipe={selectedRecipe}
                      onUpdate={(updates) => updateRecipe(selectedRecipe.id, updates)}
                      onScale={(portions) => scaleRecipe(selectedRecipe, portions)}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recipes;
