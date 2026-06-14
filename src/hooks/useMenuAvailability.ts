import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';

/**
 * BL-07: Devuelve un Set con los menu_item_id que tienen al menos un
 * ingrediente con stock <= 0 (vía recipes → recipe_ingredients → inventory_items).
 */
export const useMenuAvailability = () => {
  const { userId } = useDataUserId();
  const [outOfStockIds, setOutOfStockIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!userId) { setLoading(false); return; }
      try {
        // Recipes vinculadas a menu items
        const { data: recipes } = await supabase
          .from('recipes')
          .select('id, linked_menu_item_id')
          .eq('user_id', userId)
          .not('linked_menu_item_id', 'is', null);

        const recipeIds = (recipes || []).map(r => r.id);
        if (recipeIds.length === 0) {
          if (!cancelled) { setOutOfStockIds(new Set()); setLoading(false); }
          return;
        }

        const { data: ings } = await supabase
          .from('recipe_ingredients')
          .select('recipe_id, inventory_item_id')
          .in('recipe_id', recipeIds)
          .not('inventory_item_id', 'is', null);

        const inventoryIds = Array.from(new Set((ings || []).map(i => i.inventory_item_id as string)));
        if (inventoryIds.length === 0) {
          if (!cancelled) { setOutOfStockIds(new Set()); setLoading(false); }
          return;
        }

        const { data: stock } = await supabase
          .from('inventory_items')
          .select('id, stock')
          .in('id', inventoryIds);

        const stockMap = new Map((stock || []).map((s: any) => [s.id, Number(s.stock) || 0]));
        const recipeToMenu = new Map(
          (recipes || []).map(r => [r.id, r.linked_menu_item_id as string])
        );

        const outIds = new Set<string>();
        (ings || []).forEach((ing: any) => {
          const s = stockMap.get(ing.inventory_item_id) ?? 0;
          if (s <= 0) {
            const menuId = recipeToMenu.get(ing.recipe_id);
            if (menuId) outIds.add(menuId);
          }
        });

        if (!cancelled) setOutOfStockIds(outIds);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [userId]);

  return { outOfStockIds, loading };
};
