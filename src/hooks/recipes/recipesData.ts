import { supabase } from '@/integrations/supabase/client';

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


export interface RecipesData {
  recipes: RecipeWithDetails[];
  units: MeasurementUnit[];
  allergens: Allergen[];
  kpis: RecipeKPIs;
}

const EMPTY_KPIS: RecipeKPIs = {
  totalRecipes: 0,
  avgCostPerPortion: 0,
  secretRecipes: 0,
  categoriesCount: 0,
  subRecipesCount: 0,
  avgNutritionCalories: 0,
};

export const computeRecipeKPIs = (data: RecipeWithDetails[]): RecipeKPIs => {
  const total = data.length;
  if (total === 0) return EMPTY_KPIS;

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
    avgNutritionCalories: Math.round(avgCalories),
  };
};

/**
 * B-33 — Costo de UNA línea de ingrediente, con merma.
 *
 * Réplica exacta de la rama de fallback de `recalculate_recipe_cost` (B-12):
 *   quantity * cost_per_unit / GREATEST(COALESCE(yield_percentage,100), 1) * 100
 *
 * El `yield_percentage` es la merma: si de 1 kg de papa aprovechas 800 g, el
 * rendimiento es 80% y el kg útil cuesta 25% más. Ignorarlo subestima el costo.
 */
export const ingredientLineCost = (ing: Pick<RecipeIngredient, 'quantity' | 'cost_per_unit' | 'yield_percentage'>, multiplier = 1): number => {
  const qty = (Number(ing.quantity) || 0) * multiplier;
  const unitCost = Number(ing.cost_per_unit) || 0;

  // Espejo EXACTO de `GREATEST(COALESCE(yield_percentage, 100), 1)` del SQL.
  // Ojo con el atajo `Number(x) || 100`: como 0 es falsy daría 100, mientras el
  // SQL daría 1 (COALESCE solo cubre NULL) — y ahí el escalado del cliente y el
  // recálculo de la BD volvían a divergir, que es justo el bug de B-33.
  // Un yield de 0% es dato imposible y ya lo frena un CHECK en la tabla.
  const raw = ing.yield_percentage;
  const coalesced = raw === null || raw === undefined ? 100 : Number(raw);
  const yieldPct = Math.max(Number.isFinite(coalesced) ? coalesced : 100, 1);

  return (qty * unitCost) / yieldPct * 100;
};

/** Carga de recetas con todo su detalle (B-31: extraído del hook). */
export const fetchRecipesData = async (userId: string): Promise<RecipesData> => {
  const [unitsRes, allergensRes, recipesRes] = await Promise.all([
    supabase.from('measurement_units').select('*').order('category, name'),
    supabase.from('allergens').select('*').order('name'),
    supabase.from('recipes').select('*').eq('user_id', userId).order('name'),
  ]);

  if (recipesRes.error) throw recipesRes.error;

  const units = (unitsRes.data || []) as MeasurementUnit[];
  const allergens = (allergensRes.data || []) as Allergen[];
  const baseRecipes = (recipesRes.data || []) as unknown as Recipe[];
  const recipeIds = baseRecipes.map(r => r.id);

  // Sin recetas no hay hijos que traer: un `.in('recipe_id', [])` es una query
  // inútil (y PostgREST la rechaza).
  if (recipeIds.length === 0) {
    return { recipes: [], units, allergens, kpis: EMPTY_KPIS };
  }

  const [ingredientsRes, stepsRes, nutritionRes, subRecipesRes] = await Promise.all([
    supabase.from('recipe_ingredients').select('*').in('recipe_id', recipeIds).order('sort_order'),
    supabase.from('recipe_steps').select('*').in('recipe_id', recipeIds).order('step_number'),
    supabase.from('recipe_nutrition').select('*').in('recipe_id', recipeIds),
    supabase.from('recipe_sub_recipes').select('*').in('parent_recipe_id', recipeIds).order('sort_order'),
  ]);

  const ingredients = (ingredientsRes.data || []) as RecipeIngredient[];
  const steps = (stepsRes.data || []) as RecipeStep[];
  const nutritionData = (nutritionRes.data || []) as RecipeNutrition[];
  const subRecipesLinks = (subRecipesRes.data || []) as SubRecipeLink[];

  const recipes: RecipeWithDetails[] = baseRecipes.map(recipe => {
    const recipeSubRecipes = subRecipesLinks.filter(sr => sr.parent_recipe_id === recipe.id);
    recipeSubRecipes.forEach(sr => {
      sr.sub_recipe = baseRecipes.find(r => r.id === sr.sub_recipe_id) as Recipe | undefined;
    });

    return {
      ...recipe,
      ingredients: ingredients.filter(i => i.recipe_id === recipe.id),
      steps: steps.filter(s => s.recipe_id === recipe.id),
      nutrition: nutritionData.find(n => n.recipe_id === recipe.id) || null,
      sub_recipes: recipeSubRecipes,
    };
  });

  return { recipes, units, allergens, kpis: computeRecipeKPIs(recipes) };
};

/**
 * B-33 — Escalado de receta alineado con `recalculate_recipe_cost`.
 *
 * Antes tenía DOS agujeros:
 *   1. Ignoraba `yield_percentage` (la merma), subestimando cada ingrediente.
 *   2. Ignoraba las SUB-RECETAS por completo: una receta armada con sub-recetas
 *      se escalaba con el costo de sus sub-partes en CERO.
 *
 * El chef escala de 10 a 100 porciones para un evento y cotiza al cliente con
 * ese número — por eso tiene que coincidir con el costo que calcula la BD.
 */
export const scaleRecipeCost = (recipe: RecipeWithDetails, targetPortions: number): ScaledRecipe => {
  const originalPortions = recipe.portions || recipe.yield_quantity || 1;
  const multiplier = targetPortions / originalPortions;

  const scaledIngredients = recipe.ingredients.map(ing => ({
    name: ing.ingredient_name,
    quantity: Math.round((ing.quantity * multiplier) * 100) / 100,
    unit: ing.unit,
    cost: Math.round(ingredientLineCost(ing, multiplier) * 100) / 100,
  }));

  // Sub-recetas: costo POR PORCIÓN del sub × porciones consumidas × multiplicador
  // (misma regla que el SQL: v_sub_pp * v_sub.quantity).
  const scaledSubRecipes = (recipe.sub_recipes || []).map(sr => ({
    name: sr.sub_recipe?.name || 'Sub-receta',
    quantity: Math.round((sr.quantity * multiplier) * 100) / 100,
    unit: sr.unit,
    cost: Math.round((Number(sr.sub_recipe?.cost_per_portion) || 0) * sr.quantity * multiplier * 100) / 100,
  }));

  const allLines = [...scaledIngredients, ...scaledSubRecipes];
  const totalCost = allLines.reduce((sum, l) => sum + l.cost, 0);

  return {
    multiplier,
    ingredients: allLines,
    totalCost: Math.round(totalCost * 100) / 100,
    yield: targetPortions,
  };
};
