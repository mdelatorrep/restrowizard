import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Users, Clock, DollarSign, Flame, UtensilsCrossed, BookOpen, Link2, Scale } from 'lucide-react';
import {
  RecipeWithDetails, MeasurementUnit, Allergen, RecipeIngredient, RecipeNutrition, ScaledRecipe,
} from '@/hooks/useRecipes';
import { RecipeIngredientManager } from './RecipeIngredientManager';
import { RecipeStepsManager } from './RecipeStepsManager';
import { RecipeNutritionEditor } from './RecipeNutritionEditor';
import { RecipeCostingPanel } from './RecipeCostingPanel';
import { RecipeSubRecipesManager } from './RecipeSubRecipesManager';
import { DifficultyBadge } from './DifficultyBadge';
import { formatCurrency } from '@/lib/formatCurrency';

interface Props {
  recipe: RecipeWithDetails | null;
  units: MeasurementUnit[];
  allergens: Allergen[];
  availableSubRecipes: RecipeWithDetails[];
  onClose: () => void;
  onAddIngredient: (recipeId: string, data: Partial<RecipeIngredient>) => void;
  onUpdateIngredient: (id: string, data: Partial<RecipeIngredient>, recipeId: string) => void;
  onRemoveIngredient: (id: string, recipeId: string) => void;
  onAddStep: (recipeId: string, data: any) => void;
  onUpdateStep: (id: string, data: any) => void;
  onRemoveStep: (id: string) => void;
  onReorderSteps: (recipeId: string, ids: string[]) => void;
  onSaveNutrition: (recipeId: string, data: Partial<RecipeNutrition>) => unknown;
  onCalculateNutrition: (recipe: RecipeWithDetails) => Partial<RecipeNutrition>;
  onAddSubRecipe: (recipeId: string, subId: string, qty: number, unit: string) => void;
  onRemoveSubRecipe: (linkId: string, recipeId: string) => void;
  onUpdateRecipe: (id: string, updates: any) => void;
  onScaleRecipe: (recipe: RecipeWithDetails, portions: number) => ScaledRecipe;
}

export const RecipeDetailDialog = ({
  recipe, units, allergens, availableSubRecipes, onClose,
  onAddIngredient, onUpdateIngredient, onRemoveIngredient,
  onAddStep, onUpdateStep, onRemoveStep, onReorderSteps,
  onSaveNutrition, onCalculateNutrition,
  onAddSubRecipe, onRemoveSubRecipe,
  onUpdateRecipe, onScaleRecipe,
}: Props) => (
  <Dialog open={!!recipe} onOpenChange={onClose}>
    <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
      {recipe && (
        <>
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                {recipe.name}
                {recipe.is_secret && <Lock className="h-5 w-5 text-orange-500" />}
                {recipe.is_sub_recipe && (
                  <Badge variant="outline" className="text-purple-600 border-purple-500">Sub-receta</Badge>
                )}
                <DifficultyBadge difficulty={recipe.difficulty} />
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Detalle de la receta: ingredientes, preparación, sub-recetas, nutrición y costeo.
            </DialogDescription>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{recipe.portions} {recipe.yield_unit}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{recipe.preparation_time_minutes || 0} min</span>
              <span className="flex items-center gap-1 text-green-600 font-semibold">
                <DollarSign className="h-4 w-4" />{formatCurrency(recipe.cost_per_portion || 0)}/porción
              </span>
              {recipe.nutrition && (
                <span className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" />{recipe.nutrition.calories} kcal</span>
              )}
            </div>
          </DialogHeader>

          <Tabs defaultValue="ingredients" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="flex-shrink-0 w-full justify-start gap-1 flex-wrap h-auto py-1">
              <TabsTrigger value="ingredients" className="gap-1"><UtensilsCrossed className="h-4 w-4" />Ingredientes</TabsTrigger>
              <TabsTrigger value="steps" className="gap-1"><BookOpen className="h-4 w-4" />Preparación</TabsTrigger>
              <TabsTrigger value="subrecipes" className="gap-1"><Link2 className="h-4 w-4" />Sub-Recetas</TabsTrigger>
              <TabsTrigger value="nutrition" className="gap-1"><Flame className="h-4 w-4" />Nutrición</TabsTrigger>
              <TabsTrigger value="costing" className="gap-1"><Scale className="h-4 w-4" />Costeo</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="ingredients" className="m-0 h-full">
                <RecipeIngredientManager
                  ingredients={recipe.ingredients}
                  units={units}
                  allergens={allergens}
                  onAdd={(data) => onAddIngredient(recipe.id, data)}
                  onUpdate={(id, data) => onUpdateIngredient(id, data, recipe.id)}
                  onRemove={(id) => onRemoveIngredient(id, recipe.id)}
                />
              </TabsContent>
              <TabsContent value="steps" className="m-0 h-full">
                <RecipeStepsManager
                  steps={recipe.steps}
                  onAdd={(data) => onAddStep(recipe.id, data)}
                  onUpdate={onUpdateStep}
                  onRemove={onRemoveStep}
                  onReorder={(ids) => onReorderSteps(recipe.id, ids)}
                />
              </TabsContent>
              <TabsContent value="subrecipes" className="m-0 h-full">
                <RecipeSubRecipesManager
                  currentRecipeId={recipe.id}
                  subRecipes={recipe.sub_recipes}
                  availableSubRecipes={availableSubRecipes}
                  onAdd={(subId, qty, unit) => onAddSubRecipe(recipe.id, subId, qty, unit)}
                  onRemove={(linkId) => onRemoveSubRecipe(linkId, recipe.id)}
                />
              </TabsContent>
              <TabsContent value="nutrition" className="m-0 h-full">
                <RecipeNutritionEditor
                  recipe={recipe}
                  nutrition={recipe.nutrition}
                  onSave={(data) => onSaveNutrition(recipe.id, data)}
                  onCalculateFromIngredients={() => onCalculateNutrition(recipe)}
                />
              </TabsContent>
              <TabsContent value="costing" className="m-0 h-full">
                <RecipeCostingPanel
                  recipe={recipe}
                  onUpdate={(updates) => onUpdateRecipe(recipe.id, updates)}
                  onScale={(portions) => onScaleRecipe(recipe, portions)}
                />
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}
    </DialogContent>
  </Dialog>
);
