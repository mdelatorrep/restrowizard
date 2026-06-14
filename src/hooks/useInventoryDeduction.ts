import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface OrderItem {
  menu_item_id?: string;
  name: string;
  quantity: number;
}

interface RecipeIngredient {
  inventory_item_id: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  menu_item_id: string;
  ingredients: RecipeIngredient[];
}

export const useInventoryDeduction = () => {
  const { user } = useAuth();

  // Fetch recipe linked to a menu item.
  // NOTE: We do NOT filter by user_id here — RLS on `recipes` already restricts
  // visibility, and in multi-business setups the cashier `user.id` may differ
  // from the recipe owner. `.maybeSingle()` avoids the error-on-zero-rows of
  // `.single()`.
  const getRecipeForMenuItem = useCallback(async (menuItemId: string): Promise<Recipe | null> => {
    try {
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('id')
        .eq('menu_item_id', menuItemId)
        .maybeSingle();

      if (recipeError) {
        logger.warn('[inventoryDeduction] recipe lookup error', recipeError);
        return null;
      }
      if (!recipeData) return null;

      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('inventory_item_id, quantity, unit')
        .eq('recipe_id', recipeData.id)
        .not('inventory_item_id', 'is', null);

      if (ingredientsError) {
        logger.warn('[inventoryDeduction] ingredients lookup error', ingredientsError);
        return null;
      }

      return {
        id: recipeData.id,
        menu_item_id: menuItemId,
        ingredients: (ingredientsData || [])
          .filter((i) => i.inventory_item_id)
          .map((i) => ({
            inventory_item_id: i.inventory_item_id as string,
            quantity: Number(i.quantity),
            unit: i.unit,
          })),
      };
    } catch (error) {
      logger.error('[inventoryDeduction] getRecipeForMenuItem error', error);
      return null;
    }
  }, []);

  // Deduct inventory for a single line.
  // Returns: 'ok' on success, 'no_recipe' if the item is not linked to a recipe
  // (or recipe has no inventory-linked ingredients), 'error' on failure.
  const deductInventoryForItem = useCallback(async (
    orderId: string,
    menuItemId: string,
    quantity: number
  ): Promise<'ok' | 'no_recipe' | 'error'> => {
    if (!user) return 'error';

    try {
      const recipe = await getRecipeForMenuItem(menuItemId);
      if (!recipe || recipe.ingredients.length === 0) {
        logger.debug(`[inventoryDeduction] no recipe/ingredients for menu_item ${menuItemId}`);
        return 'no_recipe';
      }

      for (const ingredient of recipe.ingredients) {
        const deductAmount = ingredient.quantity * quantity;

        const { data: inventoryItem, error: fetchError } = await supabase
          .from('inventory_items')
          .select('id, current_stock, min_stock_level, item_name, unit_cost')
          .eq('id', ingredient.inventory_item_id)
          .maybeSingle();

        if (fetchError || !inventoryItem) {
          logger.warn(`[inventoryDeduction] inventory fetch failed ${ingredient.inventory_item_id}`, fetchError);
          continue;
        }

        const newStock = Math.max(0, (Number(inventoryItem.current_stock) || 0) - deductAmount);

        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            current_stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ingredient.inventory_item_id);

        if (updateError) {
          logger.warn('[inventoryDeduction] inventory update error', updateError);
          continue;
        }

        const { error: logError } = await supabase
          .from('inventory_deductions')
          .insert({
            user_id: user.id,
            order_id: orderId,
            inventory_item_id: ingredient.inventory_item_id,
            recipe_id: recipe.id,
            quantity_deducted: deductAmount,
            unit: ingredient.unit,
          });

        if (logError) {
          logger.warn('[inventoryDeduction] deduction log error', logError);
        }

        if (newStock <= (Number(inventoryItem.min_stock_level) || 0)) {
          toast.warning(`⚠️ Stock bajo: ${inventoryItem.item_name} (${newStock} ${ingredient.unit})`);
        }
      }

      return 'ok';
    } catch (error) {
      logger.error('[inventoryDeduction] deductInventoryForItem error', error);
      return 'error';
    }
  }, [user, getRecipeForMenuItem]);

  // Deduct inventory for an entire order.
  const deductInventoryForOrder = useCallback(async (
    orderId: string,
    items: OrderItem[]
  ): Promise<{ success: boolean; deductedCount: number; missingRecipeCount: number; errors: string[] }> => {
    if (!user) {
      return { success: false, deductedCount: 0, missingRecipeCount: 0, errors: ['Usuario no autenticado'] };
    }

    const errors: string[] = [];
    let deductedCount = 0;
    let missingRecipeCount = 0;

    for (const item of items) {
      if (!item.menu_item_id) {
        logger.warn(`[inventoryDeduction] item without menu_item_id: ${item.name}`);
        missingRecipeCount++;
        continue;
      }

      const result = await deductInventoryForItem(orderId, item.menu_item_id, item.quantity);
      if (result === 'ok') {
        deductedCount++;
      } else if (result === 'no_recipe') {
        missingRecipeCount++;
      } else {
        errors.push(`Error deduciendo inventario para: ${item.name}`);
      }
    }

    if (deductedCount > 0) {
      logger.debug(`[inventoryDeduction] deducted ${deductedCount} items for order ${orderId}`);
    }

    return {
      success: errors.length === 0,
      deductedCount,
      missingRecipeCount,
      errors,
    };
  }, [user, deductInventoryForItem]);

  const reverseInventoryDeduction = useCallback(async (orderId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data: deductions, error: fetchError } = await supabase
        .from('inventory_deductions')
        .select('*')
        .eq('order_id', orderId);

      if (fetchError) throw fetchError;
      if (!deductions || deductions.length === 0) return true;

      for (const deduction of deductions) {
        const { data: inventoryItem, error: getError } = await supabase
          .from('inventory_items')
          .select('current_stock')
          .eq('id', deduction.inventory_item_id)
          .maybeSingle();

        if (getError || !inventoryItem) continue;

        const newStock = (Number(inventoryItem.current_stock) || 0) + Number(deduction.quantity_deducted);

        await supabase
          .from('inventory_items')
          .update({
            current_stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', deduction.inventory_item_id);
      }

      await supabase
        .from('inventory_deductions')
        .delete()
        .eq('order_id', orderId);

      toast.success('Inventario revertido');
      return true;
    } catch (error) {
      logger.error('[inventoryDeduction] reverse error', error);
      toast.error('Error al revertir inventario');
      return false;
    }
  }, [user]);

  const getDeductionHistory = useCallback(async (orderId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('inventory_deductions')
        .select(`
          *,
          inventory_items (item_name, unit)
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('[inventoryDeduction] history error', error);
      return [];
    }
  }, [user]);

  return {
    deductInventoryForOrder,
    deductInventoryForItem,
    reverseInventoryDeduction,
    getDeductionHistory,
    getRecipeForMenuItem,
  };
};
