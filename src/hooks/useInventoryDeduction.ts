import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

  // Fetch recipe for a menu item
  const getRecipeForMenuItem = useCallback(async (menuItemId: string): Promise<Recipe | null> => {
    if (!user) return null;

    try {
      // Get recipe and its ingredients from recipe_ingredients table
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('id')
        .eq('user_id', user.id)
        .eq('menu_item_id', menuItemId)
        .single();

      if (recipeError || !recipeData) return null;

      // Get ingredients for this recipe
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('inventory_item_id, quantity, unit')
        .eq('recipe_id', recipeData.id);

      if (ingredientsError) return null;

      return {
        id: recipeData.id,
        menu_item_id: menuItemId,
        ingredients: (ingredientsData || []).map(i => ({
          inventory_item_id: i.inventory_item_id,
          quantity: Number(i.quantity),
          unit: i.unit
        }))
      };
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }
  }, [user]);

  // Deduct inventory for a single item
  const deductInventoryForItem = useCallback(async (
    orderId: string,
    menuItemId: string,
    quantity: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const recipe = await getRecipeForMenuItem(menuItemId);
      if (!recipe || recipe.ingredients.length === 0) {
        console.log(`No recipe found for menu item ${menuItemId}`);
        return true; // Not an error, just no recipe
      }

      // Process each ingredient
      for (const ingredient of recipe.ingredients) {
        const deductAmount = ingredient.quantity * quantity;

        // Get current inventory
        const { data: inventoryItem, error: fetchError } = await supabase
          .from('inventory_items')
          .select('id, current_stock, min_stock_level, item_name')
          .eq('id', ingredient.inventory_item_id)
          .maybeSingle();

        if (fetchError || !inventoryItem) {
          console.error(`Error fetching inventory item ${ingredient.inventory_item_id}:`, fetchError);
          continue;
        }

        // Calculate new stock
        const newStock = Math.max(0, (inventoryItem.current_stock || 0) - deductAmount);

        // Update inventory
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ 
            current_stock: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', ingredient.inventory_item_id);

        if (updateError) {
          console.error(`Error updating inventory:`, updateError);
          continue;
        }

        // Log the deduction
        const { error: logError } = await supabase
          .from('inventory_deductions')
          .insert({
            user_id: user.id,
            order_id: orderId,
            inventory_item_id: ingredient.inventory_item_id,
            recipe_id: recipe.id,
            quantity_deducted: deductAmount,
            unit: ingredient.unit
          });

        if (logError) {
          console.error('Error logging deduction:', logError);
        }

        // Check for low stock alert
        if (newStock <= (inventoryItem.min_stock_level || 0)) {
          toast.warning(`⚠️ Stock bajo: ${inventoryItem.item_name} (${newStock} ${ingredient.unit})`);
        }
      }

      return true;
    } catch (error) {
      console.error('Error deducting inventory:', error);
      return false;
    }
  }, [user, getRecipeForMenuItem]);

  // Deduct inventory for an entire order
  const deductInventoryForOrder = useCallback(async (
    orderId: string,
    items: OrderItem[]
  ): Promise<{ success: boolean; deductedCount: number; errors: string[] }> => {
    if (!user) {
      return { success: false, deductedCount: 0, errors: ['Usuario no autenticado'] };
    }

    const errors: string[] = [];
    let deductedCount = 0;

    for (const item of items) {
      if (!item.menu_item_id) {
        console.log(`Skipping item without menu_item_id: ${item.name}`);
        continue;
      }

      const success = await deductInventoryForItem(orderId, item.menu_item_id, item.quantity);
      if (success) {
        deductedCount++;
      } else {
        errors.push(`Error deduciendo inventario para: ${item.name}`);
      }
    }

    if (deductedCount > 0) {
      console.log(`Inventory deducted for ${deductedCount} items in order ${orderId}`);
    }

    return {
      success: errors.length === 0,
      deductedCount,
      errors
    };
  }, [user, deductInventoryForItem]);

  // Reverse inventory deduction (for refunds/cancellations)
  const reverseInventoryDeduction = useCallback(async (orderId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get all deductions for this order
      const { data: deductions, error: fetchError } = await supabase
        .from('inventory_deductions')
        .select('*')
        .eq('order_id', orderId);

      if (fetchError) throw fetchError;

      if (!deductions || deductions.length === 0) {
        return true; // No deductions to reverse
      }

      // Reverse each deduction
      for (const deduction of deductions) {
        const { data: inventoryItem, error: getError } = await supabase
          .from('inventory_items')
          .select('current_stock')
          .eq('id', deduction.inventory_item_id)
          .single();

        if (getError) continue;

        const newStock = (inventoryItem.current_stock || 0) + deduction.quantity_deducted;

        await supabase
          .from('inventory_items')
          .update({ 
            current_stock: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', deduction.inventory_item_id);
      }

      // Delete deduction records
      await supabase
        .from('inventory_deductions')
        .delete()
        .eq('order_id', orderId);

      toast.success('Inventario revertido');
      return true;
    } catch (error) {
      console.error('Error reversing inventory:', error);
      toast.error('Error al revertir inventario');
      return false;
    }
  }, [user]);

  // Get deduction history for an order
  const getDeductionHistory = useCallback(async (orderId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('inventory_deductions')
        .select(`
          *,
          inventory_items (name, unit)
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching deduction history:', error);
      return [];
    }
  }, [user]);

  return {
    deductInventoryForOrder,
    deductInventoryForItem,
    reverseInventoryDeduction,
    getDeductionHistory,
    getRecipeForMenuItem
  };
};
