import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useDataUserId } from './useDataUserId';
import { qk } from '@/lib/queryKeys';
import {
  fetchRecipesData,
  scaleRecipeCost,
  type RecipesData,
  type Recipe,
  type RecipeWithDetails,
  type RecipeIngredient,
  type RecipeStep,
  type RecipeNutrition,
  type ScaledRecipe,
} from './recipes/recipesData';

// B-31: tipos, carga, KPIs y costeo viven en ./recipes/recipesData.
export type {
  MeasurementUnit, Allergen, RecipeNutrition, RecipeStep, RecipeIngredient,
  SubRecipeLink, Recipe, RecipeWithDetails, RecipeKPIs, ScaledRecipe,
} from './recipes/recipesData';
export { ingredientLineCost, scaleRecipeCost } from './recipes/recipesData';

const EMPTY: RecipesData = {
  recipes: [], units: [], allergens: [],
  kpis: {
    totalRecipes: 0, avgCostPerPortion: 0, secretRecipes: 0,
    categoriesCount: 0, subRecipesCount: 0, avgNutritionCalories: 0,
  },
};

export const useRecipes = () => {
  const { toast } = useToast();
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();

  const { data = EMPTY, isLoading: loading } = useQuery({
    queryKey: qk.recipes.all(userId),
    enabled: !!userId,
    queryFn: async () => {
      try {
        return await fetchRecipesData(userId!);
      } catch (error) {
        console.error('Error fetching recipes:', error);
        toast({ title: 'Error', description: 'No se pudieron cargar las recetas', variant: 'destructive' });
        throw error;
      }
    },
  });

  const { recipes, units, allergens, kpis } = data;
  const hasData = recipes.length > 0;

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.recipes.all(userId) });
    // El costo de receta alimenta la ingeniería de menú (food cost por plato).
    await queryClient.invalidateQueries({ queryKey: ['menu-engineering'] });
  }, [queryClient, userId]);

  // Create recipe
  const createRecipe = async (recipeData: Partial<Recipe> & { name: string }) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert([{ 
          name: recipeData.name,
          user_id: userId,
          category: recipeData.category,
          portions: recipeData.portions,
          preparation_time_minutes: recipeData.preparation_time_minutes,
          difficulty: recipeData.difficulty,
          instructions: recipeData.instructions,
          tips: recipeData.tips,
          is_secret: recipeData.is_secret,
          is_sub_recipe: recipeData.is_sub_recipe,
          yield_quantity: recipeData.yield_quantity,
          yield_unit: recipeData.yield_unit,
          equipment_needed: recipeData.equipment_needed || [],
          allergen_ids: recipeData.allergen_ids || [],
          tags: recipeData.tags || []
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'Receta creada', description: 'Tu receta ha sido guardada' });
      await refetch();
      return data;
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast({ title: 'Error', description: 'No se pudo crear la receta', variant: 'destructive' });
      return null;
    }
  };

  // Update recipe
  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Receta actualizada', description: 'Los cambios han sido guardados' });
      await refetch();
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar la receta', variant: 'destructive' });
    }
  };

  // Delete recipe
  const deleteRecipe = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Receta eliminada', description: 'La receta ha sido eliminada' });
      await refetch();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar la receta', variant: 'destructive' });
    }
  };

  // Add ingredient
  const addIngredient = async (recipeId: string, ingredientData: Partial<RecipeIngredient>) => {
    try {
      const { error } = await supabase
        .from('recipe_ingredients')
        .insert([{ 
          recipe_id: recipeId,
          ingredient_name: ingredientData.ingredient_name,
          quantity: ingredientData.quantity || 0,
          unit: ingredientData.unit || 'g',
          cost_per_unit: ingredientData.cost_per_unit || 0,
          notes: ingredientData.notes,
          is_optional: ingredientData.is_optional || false,
          sort_order: ingredientData.sort_order || 0,
          unit_id: ingredientData.unit_id,
          gross_quantity: ingredientData.gross_quantity,
          yield_percentage: ingredientData.yield_percentage || 100,
          preparation_method: ingredientData.preparation_method,
          allergen_ids: ingredientData.allergen_ids || [],
          calories_per_unit: ingredientData.calories_per_unit || 0,
          protein_per_unit: ingredientData.protein_per_unit || 0,
          carbs_per_unit: ingredientData.carbs_per_unit || 0,
          fat_per_unit: ingredientData.fat_per_unit || 0,
          inventory_item_id: ingredientData.inventory_item_id
        }]);

      if (error) throw error;
      await recalculateCost(recipeId);
      await refetch();
    } catch (error) {
      console.error('Error adding ingredient:', error);
      toast({ title: 'Error', description: 'No se pudo agregar el ingrediente', variant: 'destructive' });
    }
  };

  // Update ingredient
  const updateIngredient = async (ingredientId: string, updates: Partial<RecipeIngredient>, recipeId: string) => {
    try {
      const { error } = await supabase
        .from('recipe_ingredients')
        .update(updates)
        .eq('id', ingredientId);

      if (error) throw error;
      await recalculateCost(recipeId);
      await refetch();
    } catch (error) {
      console.error('Error updating ingredient:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el ingrediente', variant: 'destructive' });
    }
  };

  // Remove ingredient
  const removeIngredient = async (ingredientId: string, recipeId: string) => {
    try {
      const { error } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('id', ingredientId);

      if (error) throw error;
      await recalculateCost(recipeId);
      await refetch();
    } catch (error) {
      console.error('Error removing ingredient:', error);
    }
  };

  // Add preparation step
  const addStep = async (recipeId: string, stepData: Partial<RecipeStep>) => {
    try {
      const recipe = recipes.find(r => r.id === recipeId);
      const nextStepNumber = (recipe?.steps.length || 0) + 1;

      const { error } = await supabase
        .from('recipe_steps')
        .insert([{
          recipe_id: recipeId,
          step_number: stepData.step_number || nextStepNumber,
          title: stepData.title,
          instruction: stepData.instruction || '',
          duration_minutes: stepData.duration_minutes,
          temperature_celsius: stepData.temperature_celsius,
          technique: stepData.technique,
          equipment: stepData.equipment,
          photo_url: stepData.photo_url,
          tips: stepData.tips,
          critical_point: stepData.critical_point || false
        }]);

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('Error adding step:', error);
      toast({ title: 'Error', description: 'No se pudo agregar el paso', variant: 'destructive' });
    }
  };

  // Update step
  const updateStep = async (stepId: string, updates: Partial<RecipeStep>) => {
    try {
      const { error } = await supabase
        .from('recipe_steps')
        .update(updates)
        .eq('id', stepId);

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('Error updating step:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el paso', variant: 'destructive' });
    }
  };

  // Remove step
  const removeStep = async (stepId: string) => {
    try {
      const { error } = await supabase
        .from('recipe_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('Error removing step:', error);
    }
  };

  // Reorder steps
  const reorderSteps = async (recipeId: string, orderedStepIds: string[]) => {
    try {
      await Promise.all(
        orderedStepIds.map((stepId, index) =>
          supabase.from('recipe_steps').update({ step_number: index + 1 }).eq('id', stepId)
        )
      );
      await refetch();
    } catch (error) {
      console.error('Error reordering steps:', error);
    }
  };

  // Save/update nutrition
  const saveNutrition = async (recipeId: string, nutritionData: Partial<RecipeNutrition>) => {
    try {
      const existing = recipes.find(r => r.id === recipeId)?.nutrition;
      
      if (existing) {
        const { error } = await supabase
          .from('recipe_nutrition')
          .update(nutritionData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recipe_nutrition')
          .insert([{ recipe_id: recipeId, ...nutritionData }]);
        if (error) throw error;
      }
      
      await refetch();
      toast({ title: 'Nutrición guardada', description: 'La información nutricional ha sido actualizada' });
    } catch (error) {
      console.error('Error saving nutrition:', error);
      toast({ title: 'Error', description: 'No se pudo guardar la información nutricional', variant: 'destructive' });
    }
  };

  // Add sub-recipe
  const addSubRecipe = async (parentRecipeId: string, subRecipeId: string, quantity: number, unit: string) => {
    try {
      const { error } = await supabase
        .from('recipe_sub_recipes')
        .insert([{
          parent_recipe_id: parentRecipeId,
          sub_recipe_id: subRecipeId,
          quantity,
          unit
        }]);

      if (error) throw error;
      await refetch();
      await recalculateCost(parentRecipeId);
    } catch (error) {
      console.error('Error adding sub-recipe:', error);
      toast({ title: 'Error', description: 'No se pudo agregar la sub-receta', variant: 'destructive' });
    }
  };

  // Remove sub-recipe
  const removeSubRecipe = async (linkId: string, parentRecipeId: string) => {
    try {
      const { error } = await supabase
        .from('recipe_sub_recipes')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      await refetch();
      await recalculateCost(parentRecipeId);
    } catch (error) {
      console.error('Error removing sub-recipe:', error);
    }
  };

  // Recalculate cost — delegate to RPC `recalculate_recipe_cost` (BL-06).
  // The RPC handles ingredient unit conversion (via convert_unit), yield,
  // and recursive sub-recipe roll-up server-side.
  const recalculateCost = async (recipeId: string) => {
    const { error } = await supabase.rpc('recalculate_recipe_cost', {
      p_recipe_id: recipeId,
      p_depth: 0,
    });
    if (error) {
      // Fallback to legacy client-side calc if RPC fails
      console.error('recalculate_recipe_cost RPC failed, using fallback:', error);
      const [{ data: recipe }, { data: ingredients }, { data: subLinks }] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', recipeId).maybeSingle(),
        supabase.from('recipe_ingredients').select('*').eq('recipe_id', recipeId),
        supabase.from('recipe_sub_recipes').select('*, sub_recipe:recipes!sub_recipe_id(cost_per_portion)').eq('parent_recipe_id', recipeId),
      ]);
      if (!recipe) return;

      const ingredientsCost = (ingredients || []).reduce((sum: number, ing: any) => {
        const effectiveQuantity = ing.gross_quantity || ing.quantity || 0;
        const yieldFactor = (ing.yield_percentage || 100) / 100;
        return sum + (effectiveQuantity * (ing.cost_per_unit || 0) / yieldFactor);
      }, 0);

      const subRecipesCost = (subLinks || []).reduce((sum: number, sr: any) => {
        return sum + ((sr.quantity || 0) * (sr.sub_recipe?.cost_per_portion || 0));
      }, 0);

      const totalCost = ingredientsCost + subRecipesCost;
      const portions = recipe.portions || recipe.yield_quantity || 1;
      const costPerPortion = portions > 0 ? totalCost / portions : 0;

      await supabase.from('recipes').update({
        total_cost: Math.round(totalCost * 100) / 100,
        cost_per_portion: Math.round(costPerPortion * 100) / 100,
      }).eq('id', recipeId);
    }

    // Propagate cost to linked menu items (primary first, then legacy menu_item_id).
    const { data: refreshed } = await supabase
      .from('recipes').select('cost_per_portion, menu_item_id').eq('id', recipeId).maybeSingle();
    const cpp = Math.round((Number(refreshed?.cost_per_portion) || 0) * 100) / 100;

    const { data: links } = await supabase
      .from('recipe_menu_items').select('menu_item_id').eq('recipe_id', recipeId).eq('is_primary', true);
    const targets = new Set<string>();
    (links || []).forEach((l: any) => l.menu_item_id && targets.add(l.menu_item_id));
    if (refreshed?.menu_item_id) targets.add(refreshed.menu_item_id);
    for (const mid of targets) {
      await supabase.from('menu_items').update({ cost: cpp }).eq('id', mid);
    }
  };

  // Scale recipe
  /** B-33: escalado alineado con `recalculate_recipe_cost` (merma + sub-recetas). */
  const scaleRecipe = (recipe: RecipeWithDetails, targetPortions: number): ScaledRecipe =>
    scaleRecipeCost(recipe, targetPortions);

  // Calculate nutrition from ingredients
  const calculateNutritionFromIngredients = (recipe: RecipeWithDetails): Partial<RecipeNutrition> => {
    const portions = recipe.portions || 1;
    
    const totals = recipe.ingredients.reduce((acc, ing) => ({
      calories: acc.calories + (ing.calories_per_unit * ing.quantity),
      protein: acc.protein + (ing.protein_per_unit * ing.quantity),
      carbs: acc.carbs + (ing.carbs_per_unit * ing.quantity),
      fat: acc.fat + (ing.fat_per_unit * ing.quantity)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return {
      calories: Math.round(totals.calories / portions),
      protein_grams: Math.round(totals.protein / portions * 10) / 10,
      carbs_grams: Math.round(totals.carbs / portions * 10) / 10,
      fat_grams: Math.round(totals.fat / portions * 10) / 10,
      is_estimated: true
    };
  };

  // Get sub-recipes (recipes marked as sub-recipe)
  const getSubRecipes = () => recipes.filter(r => r.is_sub_recipe);

  // Get main recipes (not sub-recipes)
  const getMainRecipes = () => recipes.filter(r => !r.is_sub_recipe);

  // Initialize


  return {
    recipes,
    units,
    allergens,
    kpis,
    loading,
    hasData,
    // Recipe CRUD
    createRecipe,
    updateRecipe,
    deleteRecipe,
    // Ingredients
    addIngredient,
    updateIngredient,
    removeIngredient,
    // Steps
    addStep,
    updateStep,
    removeStep,
    reorderSteps,
    // Nutrition
    saveNutrition,
    calculateNutritionFromIngredients,
    // Sub-recipes
    addSubRecipe,
    removeSubRecipe,
    getSubRecipes,
    getMainRecipes,
    // Costing
    recalculateCost,
    scaleRecipe,
    // Refresh
    refetch,
  };
};
