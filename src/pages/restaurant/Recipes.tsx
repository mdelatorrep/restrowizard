import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRecipes, RecipeWithDetails } from '@/hooks/useRecipes';
import { useAIAgent } from '@/hooks/useAIAgent';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { PublishRecipeToMenuDialog } from '@/components/recipes/PublishRecipeToMenuDialog';
import { CreateRecipeDialog } from '@/components/recipes/CreateRecipeDialog';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipesFilterBar } from '@/components/recipes/RecipesFilterBar';
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog';
import { ChefHat, Plus, Loader2, DollarSign, Lock, Sparkles, BookOpen, UtensilsCrossed, Flame } from 'lucide-react';
import { ModulePageLayout, PageHeader, KPIGrid, KPICardData } from '@/components/layout';
import { formatCurrency } from '@/lib/formatCurrency';

const Recipes = () => {
  const {
    recipes, units, allergens, kpis, loading, hasData,
    createRecipe, updateRecipe, deleteRecipe,
    addIngredient, updateIngredient, removeIngredient,
    addStep, updateStep, removeStep, reorderSteps,
    saveNutrition, calculateNutritionFromIngredients,
    addSubRecipe, removeSubRecipe, getSubRecipes, scaleRecipe,
  } = useRecipes();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithDetails | null>(null);
  const [publishRecipe, setPublishRecipe] = useState<RecipeWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const { optimizeRecipeCosts, loading: aiLoading } = useAIAgent();

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
          costPerUnit: i.cost_per_unit,
        })),
      })),
      kpis,
      avgCostPerPortion: kpis?.avgCostPerPortion || 0,
    };
    const result = await optimizeRecipeCosts(recipeData);
    if (result) setAiInsights(result);
  };

  const getRecipeAllergens = (recipe: RecipeWithDetails) => {
    const allergenIds = new Set<string>();
    recipe.allergen_ids?.forEach(id => allergenIds.add(id));
    recipe.ingredients.forEach(ing => ing.allergen_ids?.forEach(id => allergenIds.add(id)));
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
    <ModulePageLayout>
      <PageHeader
        title="Gestión de Recetas"
        description="Recetas profesionales con costeo, nutrición y sub-recetas"
        icon={ChefHat}
        actions={[
          { label: aiLoading ? 'Analizando...' : 'Optimizar Costos', icon: Sparkles, onClick: handleAnalyzeRecipes, variant: 'outline', disabled: aiLoading || recipes.length === 0 },
          { label: 'Nueva Receta', icon: Plus, onClick: () => setShowCreateDialog(true) },
        ]}
      />

      <CreateRecipeDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={createRecipe}
      />

      <KPIGrid
        columns={6}
        kpis={[
          { label: 'Total Recetas', value: kpis?.totalRecipes || 0, icon: ChefHat, iconColor: 'text-primary' },
          { label: 'Sub-Recetas', value: kpis?.subRecipesCount || 0, icon: BookOpen, iconColor: 'text-purple-500' },
          { label: 'Costo Promedio', value: formatCurrency(kpis?.avgCostPerPortion || 0), icon: DollarSign, iconColor: 'text-green-500' },
          { label: 'Calorías Prom.', value: kpis?.avgNutritionCalories || 0, icon: Flame, iconColor: 'text-orange-500' },
          { label: 'Categorías', value: kpis?.categoriesCount || 0, icon: UtensilsCrossed, iconColor: 'text-blue-500' },
          { label: 'Secretas', value: kpis?.secretRecipes || 0, icon: Lock, iconColor: 'text-orange-500' },
        ] as KPICardData[]}
      />

      <AIInsightsPanel
        title="Optimización de Recetas IA"
        description="Análisis de costos, sustitutos de ingredientes y maridajes"
        insights={aiInsights}
        loading={aiLoading}
        onAnalyze={handleAnalyzeRecipes}
      />

      <RecipesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        filterType={filterType}
        onTypeChange={setFilterType}
        categories={categories}
      />

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
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              recipeAllergens={getRecipeAllergens(recipe)}
              onPublish={() => setPublishRecipe(recipe)}
              onView={() => setSelectedRecipe(recipe)}
              onDelete={() => deleteRecipe(recipe.id)}
            />
          ))}
        </div>
      )}

      {publishRecipe && (
        <PublishRecipeToMenuDialog
          open={!!publishRecipe}
          onOpenChange={(open) => !open && setPublishRecipe(null)}
          recipe={{
            id: publishRecipe.id,
            name: publishRecipe.name,
            cost_per_portion: Number(publishRecipe.cost_per_portion) || 0,
            menu_item_id: publishRecipe.menu_item_id,
            portions_per_batch: publishRecipe.portions,
          }}
          onSuccess={() => setPublishRecipe(null)}
        />
      )}

      <RecipeDetailDialog
        recipe={selectedRecipe}
        units={units}
        allergens={allergens}
        availableSubRecipes={getSubRecipes()}
        onClose={() => setSelectedRecipe(null)}
        onAddIngredient={addIngredient}
        onUpdateIngredient={updateIngredient}
        onRemoveIngredient={removeIngredient}
        onAddStep={addStep}
        onUpdateStep={updateStep}
        onRemoveStep={removeStep}
        onReorderSteps={reorderSteps}
        onSaveNutrition={saveNutrition}
        onCalculateNutrition={calculateNutritionFromIngredients}
        onAddSubRecipe={addSubRecipe}
        onRemoveSubRecipe={removeSubRecipe}
        onUpdateRecipe={updateRecipe}
        onScaleRecipe={scaleRecipe}
      />
    </ModulePageLayout>
  );
};

export default Recipes;
