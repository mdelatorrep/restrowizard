import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';

/**
 * BL-07 / C9-01: Devuelve un Set con los menu_item_id cuyo platillo NO puede
 * producirse porque algún ingrediente de su receta no alcanza la cantidad
 * requerida (ajustada por rendimiento). Solo considera ingredientes de la
 * receta vinculada al platillo — nunca otros ítems del inventario.
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
        // BL-03: incluir vínculos vía pivote `recipe_menu_items` además del legacy `menu_item_id`.
        const [recipesRes, linksRes] = await Promise.all([
          supabase.from('recipes').select('id, menu_item_id').eq('user_id', userId),
          supabase.from('recipe_menu_items').select('recipe_id, menu_item_id, is_primary'),
        ]);

        const allRecipes = recipesRes.data || [];
        const allLinks = (linksRes.data as any[]) || [];
        const ownedRecipeIds = new Set(allRecipes.map((r: any) => r.id));

        // recipe → set of menu_item ids it should affect (primary links + legacy)
        const recipeToMenus = new Map<string, Set<string>>();
        allRecipes.forEach((r: any) => {
          if (r.menu_item_id) {
            if (!recipeToMenus.has(r.id)) recipeToMenus.set(r.id, new Set());
            recipeToMenus.get(r.id)!.add(r.menu_item_id);
          }
        });
        allLinks.forEach((l: any) => {
          if (!ownedRecipeIds.has(l.recipe_id)) return;
          if (!l.is_primary) return; // solo la principal afecta disponibilidad
          if (!recipeToMenus.has(l.recipe_id)) recipeToMenus.set(l.recipe_id, new Set());
          recipeToMenus.get(l.recipe_id)!.add(l.menu_item_id);
        });

        const recipeIds = Array.from(recipeToMenus.keys());
        if (recipeIds.length === 0) {
          if (!cancelled) { setOutOfStockIds(new Set()); setLoading(false); }
          return;
        }

        const { data: ings } = await supabase
          .from('recipe_ingredients')
          .select('recipe_id, inventory_item_id, quantity, yield_percentage, is_optional')
          .in('recipe_id', recipeIds)
          .not('inventory_item_id', 'is', null);

        const inventoryIds = Array.from(
          new Set((ings || []).map(i => i.inventory_item_id as string))
        );
        if (inventoryIds.length === 0) {
          if (!cancelled) { setOutOfStockIds(new Set()); setLoading(false); }
          return;
        }

        const { data: stock } = await supabase
          .from('inventory_items')
          .select('id, current_stock, track_stock')
          .in('id', inventoryIds);

        const stockMap = new Map<string, number>(
          (stock || []).map((s: any) => [
            s.id as string,
            s.track_stock === false ? Number.POSITIVE_INFINITY : (Number(s.current_stock) || 0),
          ])
        );

        const outIds = new Set<string>();
        (ings || []).forEach((ing: any) => {
          if (ing.is_optional) return;
          const invId = ing.inventory_item_id as string;
          const available = stockMap.get(invId) ?? 0;
          const qty = Number(ing.quantity) || 0;
          const yieldPct = Number(ing.yield_percentage) || 100;
          const required = yieldPct > 0 ? qty * (100 / yieldPct) : qty;
          if (required > 0 && available < required) {
            const menuIds = recipeToMenus.get(ing.recipe_id);
            menuIds?.forEach(mid => outIds.add(mid));
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
