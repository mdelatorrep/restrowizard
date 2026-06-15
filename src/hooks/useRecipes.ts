import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';

// ============= TYPES =============

export interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  category: string;
  conversion_factor: number;
}

export interface Allergen {
  id: string;
  name: string;
  icon: string | null;
  severity: string;
  description: string | null;
}

export interface RecipeNutrition {
  id: string;
  recipe_id: string;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  fiber_grams: number;
  sugar_grams: number;
  sodium_mg: number;
  saturated_fat_grams: number;
  cholesterol_mg: number;
  is_estimated: boolean;
  notes: string | null;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  title: string | null;
  instruction: string;
  duration_minutes: number | null;
  temperature_celsius: number | null;
  technique: string | null;
  equipment: string | null;
  photo_url: string | null;
  tips: string | null;
  critical_point: boolean;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  inventory_item_id: string | null;
  ingredient_name: string;
  quantity: number;
  unit: string;
  unit_id: string | null;
  cost_per_unit: number;
  notes: string | null;
  is_optional: boolean;
  sort_order: number;
  gross_quantity: number | null;
  yield_percentage: number;
  preparation_method: string | null;
  allergen_ids: string[];
  calories_per_unit: number;
  protein_per_unit: number;
  carbs_per_unit: number;
  fat_per_unit: number;
}

export interface SubRecipeLink {
  id: string;
  parent_recipe_id: string;
  sub_recipe_id: string;
  quantity: number;
  unit: string;
  notes: string | null;
  sort_order: number;
  sub_recipe?: Recipe;
}

export interface Recipe {
  id: string;
  user_id: string;
  menu_item_id: string | null;
  name: string;
  category: string;
  portions: number;
  preparation_time_minutes: number | null;
  difficulty: string;
  instructions: string | null;
  tips: string | null;
  photo_url: string | null;
  video_url: string | null;
  is_secret: boolean;
  total_cost: number;
  cost_per_portion: number;
  created_at: string;
  updated_at: string;
  // New professional fields
  yield_quantity: number;
  yield_unit: string;
  yield_weight_grams: number | null;
  waste_percentage: number;
  labor_time_minutes: number | null;
  labor_cost_per_hour: number;
  overhead_percentage: number;
  is_sub_recipe: boolean;
  serving_size_grams: number | null;
  shelf_life_hours: number | null;
  storage_instructions: string | null;
  plating_instructions: string | null;
  equipment_needed: string[];
  allergen_ids: string[];
  tags: string[];
}

export interface RecipeWithDetails extends Recipe {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: RecipeNutrition | null;
  sub_recipes: SubRecipeLink[];
}

// Backward compatibility alias
export type RecipeWithIngredients = RecipeWithDetails;

export interface RecipeKPIs {
  totalRecipes: number;
  avgCostPerPortion: number;
  secretRecipes: number;
  categoriesCount: number;
  subRecipesCount: number;
  avgNutritionCalories: number;
}

export interface ScaledRecipe {
  multiplier: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;
  totalCost: number;
  yield: number;
}

// ============= HOOK =============

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [kpis, setKpis] = useState<RecipeKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const { toast } = useToast();
  const { userId } = useDataUserId();

  // Fetch reference data (units, allergens)
  const fetchReferenceData = useCallback(async () => {
    const [unitsRes, allergensRes] = await Promise.all([
      supabase.from('measurement_units').select('*').order('category, name'),
      supabase.from('allergens').select('*').order('name')
    ]);
    
    if (unitsRes.data) setUnits(unitsRes.data as MeasurementUnit[]);
    if (allergensRes.data) setAllergens(allergensRes.data as Allergen[]);
  }, []);

  // Calculate KPIs
  const calculateKPIs = (data: RecipeWithDetails[]): RecipeKPIs => {
    const total = data.length;
    if (total === 0) {
      return { 
        totalRecipes: 0, 
        avgCostPerPortion: 0, 
        secretRecipes: 0, 
        categoriesCount: 0,
        subRecipesCount: 0,
        avgNutritionCalories: 0
      };
    }

    const avgCost = data.reduce((sum, r) => sum + (r.cost_per_portion || 0), 0) / total;
    const secretCount = data.filter(r => r.is_secret).length;
    const subRecipesCount = data.filter(r => r.is_sub_recipe).length;
    const categories = new Set(data.map(r => r.category));
    
    const recipesWithNutrition = data.filter(r => r.nutrition);
    const avgCalories = recipesWithNutrition.length > 0
      ? recipesWithNutrition.reduce((sum, r) => sum + (r.nutrition?.calories || 0), 0) / recipesWithNutrition.length
      : 0;

    return {
      totalRecipes: total,
      avgCostPerPortion: Math.round(avgCost * 100) / 100,
      secretRecipes: secretCount,
      categoriesCount: categories.size,
      subRecipesCount,
      avgNutritionCalories: Math.round(avgCalories)
    };
  };

  // Fetch all recipes with details
  const fetchRecipes = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Fetch recipes
      const { data: recipesData, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      
      const recipes = (recipesData || []) as unknown as Recipe[];
      
      // Fetch all related data in parallel
      const recipeIds = recipes.map(r => r.id);
      
      const [ingredientsRes, stepsRes, nutritionRes, subRecipesRes] = await Promise.all([
        supabase.from('recipe_ingredients').select('*').in('recipe_id', recipeIds).order('sort_order'),
        supabase.from('recipe_steps').select('*').in('recipe_id', recipeIds).order('step_number'),
        supabase.from('recipe_nutrition').select('*').in('recipe_id', recipeIds),
        supabase.from('recipe_sub_recipes').select('*').in('parent_recipe_id', recipeIds).order('sort_order')
      ]);

      const ingredients = (ingredientsRes.data || []) as RecipeIngredient[];
      const steps = (stepsRes.data || []) as RecipeStep[];
      const nutritionData = (nutritionRes.data || []) as RecipeNutrition[];
      const subRecipesLinks = (subRecipesRes.data || []) as SubRecipeLink[];

      // Map data to recipes
      const recipesWithDetails: RecipeWithDetails[] = recipes.map(recipe => {
        const recipeIngredients = ingredients.filter(i => i.recipe_id === recipe.id);
        const recipeSteps = steps.filter(s => s.recipe_id === recipe.id);
        const recipeNutrition = nutritionData.find(n => n.recipe_id === recipe.id) || null;
        const recipeSubRecipes = subRecipesLinks.filter(sr => sr.parent_recipe_id === recipe.id);
        
        // Attach sub-recipe details
        recipeSubRecipes.forEach(sr => {
          sr.sub_recipe = recipes.find(r => r.id === sr.sub_recipe_id) as Recipe | undefined;
        });

        return {
          ...recipe,
          ingredients: recipeIngredients,
          steps: recipeSteps,
          nutrition: recipeNutrition,
          sub_recipes: recipeSubRecipes
        };
      });
      
      setRecipes(recipesWithDetails);
      setKpis(calculateKPIs(recipesWithDetails));
      setHasData(recipesWithDetails.length > 0);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar las recetas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

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
      await fetchRecipes();
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
      await fetchRecipes();
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
      await fetchRecipes();
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
      await fetchRecipes();
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
      await fetchRecipes();
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
      await fetchRecipes();
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
      await fetchRecipes();
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
      await fetchRecipes();
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
      await fetchRecipes();
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
      await fetchRecipes();
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
      
      await fetchRecipes();
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
      await fetchRecipes();
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
      await fetchRecipes();
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
  const scaleRecipe = (recipe: RecipeWithDetails, targetPortions: number): ScaledRecipe => {
    const originalPortions = recipe.portions || recipe.yield_quantity || 1;
    const multiplier = targetPortions / originalPortions;

    const scaledIngredients = recipe.ingredients.map(ing => ({
      name: ing.ingredient_name,
      quantity: Math.round(ing.quantity * multiplier * 100) / 100,
      unit: ing.unit,
      cost: Math.round(ing.quantity * multiplier * ing.cost_per_unit * 100) / 100
    }));

    const totalCost = scaledIngredients.reduce((sum, ing) => sum + ing.cost, 0);

    return {
      multiplier,
      ingredients: scaledIngredients,
      totalCost: Math.round(totalCost * 100) / 100,
      yield: targetPortions
    };
  };

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
  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

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
    refetch: fetchRecipes,
  };
};
