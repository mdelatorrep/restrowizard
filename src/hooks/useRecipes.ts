import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataUserId } from './useDataUserId';

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
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  inventory_item_id: string | null;
  ingredient_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  notes: string | null;
  is_optional: boolean;
  sort_order: number;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredient[];
}

export interface RecipeKPIs {
  totalRecipes: number;
  avgCostPerPortion: number;
  secretRecipes: number;
  categoriesCount: number;
}

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [kpis, setKpis] = useState<RecipeKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const { toast } = useToast();
  const { userId } = useDataUserId();

  const calculateKPIs = (data: RecipeWithIngredients[]): RecipeKPIs => {
    const total = data.length;
    if (total === 0) {
      return { totalRecipes: 0, avgCostPerPortion: 0, secretRecipes: 0, categoriesCount: 0 };
    }

    const avgCost = data.reduce((sum, r) => sum + (r.cost_per_portion || 0), 0) / total;
    const secretCount = data.filter(r => r.is_secret).length;
    const categories = new Set(data.map(r => r.category));

    return {
      totalRecipes: total,
      avgCostPerPortion: Math.round(avgCost * 100) / 100,
      secretRecipes: secretCount,
      categoriesCount: categories.size,
    };
  };

  const fetchRecipes = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      
      const recipesData = (data || []) as unknown as Recipe[];
      
      // Fetch ingredients for each recipe
      const recipesWithIngredients: RecipeWithIngredients[] = await Promise.all(
        recipesData.map(async (recipe) => {
          const { data: ingredients } = await supabase
            .from('recipe_ingredients')
            .select('*')
            .eq('recipe_id', recipe.id)
            .order('sort_order');
          
          return {
            ...recipe,
            ingredients: (ingredients || []) as unknown as RecipeIngredient[],
          };
        })
      );
      
      setRecipes(recipesWithIngredients);
      setKpis(calculateKPIs(recipesWithIngredients));
      setHasData(recipesWithIngredients.length > 0);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRecipe = async (recipeData: Partial<Recipe>) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert([{ ...recipeData, user_id: userId }])
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

  const addIngredient = async (recipeId: string, ingredient: Partial<RecipeIngredient>) => {
    try {
      const { error } = await supabase
        .from('recipe_ingredients')
        .insert([{ ...ingredient, recipe_id: recipeId }]);

      if (error) throw error;
      
      await fetchRecipes();
      await recalculateCost(recipeId);
    } catch (error) {
      console.error('Error adding ingredient:', error);
      toast({ title: 'Error', description: 'No se pudo agregar el ingrediente', variant: 'destructive' });
    }
  };

  const removeIngredient = async (ingredientId: string, recipeId: string) => {
    try {
      const { error } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('id', ingredientId);

      if (error) throw error;
      
      await fetchRecipes();
      await recalculateCost(recipeId);
    } catch (error) {
      console.error('Error removing ingredient:', error);
    }
  };

  const recalculateCost = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const totalCost = recipe.ingredients.reduce((sum, ing) => {
      return sum + (ing.quantity * ing.cost_per_unit);
    }, 0);

    const costPerPortion = recipe.portions > 0 ? totalCost / recipe.portions : 0;

    await supabase
      .from('recipes')
      .update({ total_cost: totalCost, cost_per_portion: costPerPortion })
      .eq('id', recipeId);
  };

  useEffect(() => {
    fetchRecipes();
  }, [userId]);

  return {
    recipes,
    kpis,
    loading,
    hasData,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    addIngredient,
    removeIngredient,
    refetch: fetchRecipes,
  };
};
