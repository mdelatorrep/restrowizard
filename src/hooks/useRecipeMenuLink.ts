import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';

export interface Recipe {
  id: string;
  name: string;
  cost_per_portion: number;
  menu_item_id: string | null;
  portions_per_batch: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  menu_id: string;
}

export const useRecipeMenuLink = () => {
  const { userId } = useDataUserId();
  const { toast } = useToast();

  // Get available menu items that could be linked to recipes
  const getAvailableMenuItems = useCallback(async (): Promise<MenuItem[]> => {
    if (!userId) return [];

    try {
      // Get user's menus first
      const { data: menus, error: menusError } = await supabase
        .from('restaurant_menus')
        .select('id')
        .eq('user_id', userId);

      if (menusError) throw menusError;
      if (!menus || menus.length === 0) return [];

      const menuIds = menus.map(m => m.id);

      // Get menu items
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, name, price, category, menu_id')
        .in('menu_id', menuIds)
        .order('category')
        .order('name');

      if (itemsError) throw itemsError;

      return (items || []).map(item => ({
        ...item,
        price: Number(item.price)
      }));
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  }, [userId]);

  // Link a recipe to a menu item
  const linkRecipeToMenuItem = useCallback(async (recipeId: string, menuItemId: string) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ menu_item_id: menuItemId })
        .eq('id', recipeId);

      if (error) throw error;

      toast({ title: "Receta vinculada al producto" });
      return true;
    } catch (error: any) {
      console.error('Error linking recipe:', error);
      toast({
        title: "Error al vincular",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Unlink a recipe from a menu item
  const unlinkRecipe = useCallback(async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ menu_item_id: null })
        .eq('id', recipeId);

      if (error) throw error;

      toast({ title: "Receta desvinculada" });
      return true;
    } catch (error: any) {
      console.error('Error unlinking recipe:', error);
      toast({
        title: "Error al desvincular",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Create a new menu item from a recipe
  const createMenuItemFromRecipe = useCallback(async (
    recipe: Recipe,
    targetMenuId: string,
    markupPercentage: number = 300 // Default 300% markup (3x cost)
  ): Promise<string | null> => {
    if (!userId) return null;

    try {
      // Calculate suggested price
      const suggestedPrice = recipe.cost_per_portion * (markupPercentage / 100);

      // Create the menu item
      const { data: newItem, error: itemError } = await supabase
        .from('menu_items')
        .insert({
          menu_id: targetMenuId,
          name: recipe.name,
          description: `Preparado con receta: ${recipe.name}`,
          price: Math.ceil(suggestedPrice), // Round up
          category: 'Platos Principales',
          is_available: true,
          is_featured: false
        })
        .select('id')
        .single();

      if (itemError) throw itemError;

      // Link the recipe to the new menu item
      const { error: linkError } = await supabase
        .from('recipes')
        .update({ menu_item_id: newItem.id })
        .eq('id', recipe.id);

      if (linkError) throw linkError;

      toast({
        title: "Producto creado",
        description: `${recipe.name} agregado al menú con precio sugerido de $${Math.ceil(suggestedPrice)}`
      });

      return newItem.id;
    } catch (error: any) {
      console.error('Error creating menu item from recipe:', error);
      toast({
        title: "Error al crear producto",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  }, [userId, toast]);

  // Get orphan products (menu items without linked recipes)
  const getOrphanProducts = useCallback(async (): Promise<MenuItem[]> => {
    if (!userId) return [];

    try {
      // Get user's menus
      const { data: menus, error: menusError } = await supabase
        .from('restaurant_menus')
        .select('id')
        .eq('user_id', userId);

      if (menusError) throw menusError;
      if (!menus || menus.length === 0) return [];

      const menuIds = menus.map(m => m.id);

      // Get all menu items
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, name, price, category, menu_id')
        .in('menu_id', menuIds);

      if (itemsError) throw itemsError;

      // Get all recipes with linked menu items
      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select('menu_item_id')
        .eq('user_id', userId)
        .not('menu_item_id', 'is', null);

      if (recipesError) throw recipesError;

      const linkedItemIds = new Set((recipes || []).map(r => r.menu_item_id));

      // Filter to only orphan items
      return (items || [])
        .filter(item => !linkedItemIds.has(item.id))
        .map(item => ({
          ...item,
          price: Number(item.price)
        }));
    } catch (error) {
      console.error('Error fetching orphan products:', error);
      return [];
    }
  }, [userId]);

  // Get recipes without linked products
  const getOrphanRecipes = useCallback(async (): Promise<Recipe[]> => {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, name, cost_per_portion, menu_item_id, portions')
        .eq('user_id', userId)
        .is('menu_item_id', null);

      if (error) throw error;

      return (data || []).map(r => ({
        id: r.id,
        name: r.name,
        cost_per_portion: Number(r.cost_per_portion) || 0,
        menu_item_id: r.menu_item_id,
        portions_per_batch: Number(r.portions) || 1
      }));
    } catch (error) {
      console.error('Error fetching orphan recipes:', error);
      return [];
    }
  }, [userId]);

  return {
    getAvailableMenuItems,
    linkRecipeToMenuItem,
    unlinkRecipe,
    createMenuItemFromRecipe,
    getOrphanProducts,
    getOrphanRecipes
  };
};
