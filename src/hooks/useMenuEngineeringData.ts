import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { qk } from '@/lib/queryKeys';
import { toOrderLines, getLineMenuItemId, getLineQuantity, getLineRevenue } from '@/lib/orderItems';

export interface MenuItemWithCosts {
  id: string;
  menu_id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  allergens: string[] | null;
  dietary_tags: string[] | null;
  popularity_score: number;
  profitability_score: number;
  bcg_category: 'star' | 'cash_cow' | 'question_mark' | 'dog' | 'unknown';
  recipe_id: string | null;
  recipe_name: string | null;
  recipe_cost: number;
  margin_percent: number;
  sales_count?: number;
  revenue?: number;
}

export interface BCGMatrix {
  stars: MenuItemWithCosts[];
  cashCows: MenuItemWithCosts[];
  questionMarks: MenuItemWithCosts[];
  dogs: MenuItemWithCosts[];
}

export interface MenuEngineeringInsights {
  totalItems: number;
  avgMargin: number;
  avgPrice: number;
  avgPopularity: number;
  itemsWithRecipes: number;
  itemsWithoutRecipes: number;
  lowMarginAlerts: MenuItemWithCosts[];
  topPerformers: MenuItemWithCosts[];
  underperformers: MenuItemWithCosts[];
}

export const useMenuEngineeringData = (periodDays: number = 30) => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: qk.menus.engineering(userId, periodDays),
    enabled: !!userId,
    queryFn: async () => {
      await supabase.rpc('calculate_menu_item_scores', { p_user_id: userId, p_days: periodDays });

      const { data: menus, error: menusError } = await supabase.from('restaurant_menus').select('id').eq('user_id', userId!);
      if (menusError) throw menusError;
      if (!menus || menus.length === 0) {
        return { menuItems: [] as MenuItemWithCosts[], bcgMatrix: null as BCGMatrix | null, insights: null as MenuEngineeringInsights | null, hasData: false };
      }
      const menuIds = menus.map((m) => m.id);

      const { data: items, error: itemsError } = await supabase.from('menu_items_with_costs').select('*').in('menu_id', menuIds);
      if (itemsError) throw itemsError;

      const { data: orders, error: ordersError } = await supabase
        .from('restaurant_orders')
        .select('items, total')
        .eq('user_id', userId!)
        .gte('created_at', new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString())
        .not('status', 'in', '("cancelled","pending")');
      if (ordersError) throw ordersError;

      const salesCount: Record<string, { count: number; revenue: number }> = {};
      for (const order of orders || []) {
        // B-37: las líneas del POS usan `unit_price` y las web/manuales `price`.
        for (const item of toOrderLines(order.items)) {
          const itemId = getLineMenuItemId(item);
          if (itemId) {
            if (!salesCount[itemId]) salesCount[itemId] = { count: 0, revenue: 0 };
            salesCount[itemId].count += getLineQuantity(item);
            salesCount[itemId].revenue += getLineRevenue(item);
          }
        }
      }

      const enrichedItems: MenuItemWithCosts[] = (items || []).map((item: any) => ({
        ...item,
        price: Number(item.price),
        recipe_cost: Number(item.recipe_cost) || 0,
        margin_percent: Number(item.margin_percent) || 0,
        popularity_score: Number(item.popularity_score) || 0,
        profitability_score: Number(item.profitability_score) || 0,
        bcg_category: (item.bcg_category || 'unknown') as MenuItemWithCosts['bcg_category'],
        sales_count: salesCount[item.id]?.count || 0,
        revenue: salesCount[item.id]?.revenue || 0,
      }));

      const bcgMatrix: BCGMatrix = {
        stars: enrichedItems.filter((i) => i.bcg_category === 'star'),
        cashCows: enrichedItems.filter((i) => i.bcg_category === 'cash_cow'),
        questionMarks: enrichedItems.filter((i) => i.bcg_category === 'question_mark'),
        dogs: enrichedItems.filter((i) => i.bcg_category === 'dog'),
      };

      let insights: MenuEngineeringInsights | null = null;
      if (enrichedItems.length > 0) {
        const avgMargin = enrichedItems.reduce((sum, i) => sum + i.margin_percent, 0) / enrichedItems.length;
        const avgPrice = enrichedItems.reduce((sum, i) => sum + i.price, 0) / enrichedItems.length;
        const avgPopularity = enrichedItems.reduce((sum, i) => sum + i.popularity_score, 0) / enrichedItems.length;
        const itemsWithRecipes = enrichedItems.filter((i) => i.recipe_id).length;
        insights = {
          totalItems: enrichedItems.length,
          avgMargin,
          avgPrice,
          avgPopularity,
          itemsWithRecipes,
          itemsWithoutRecipes: enrichedItems.length - itemsWithRecipes,
          lowMarginAlerts: enrichedItems.filter((i) => i.margin_percent < 50 && i.margin_percent > 0).sort((a, b) => a.margin_percent - b.margin_percent),
          topPerformers: [...enrichedItems].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 5),
          underperformers: enrichedItems.filter((i) => i.bcg_category === 'dog' && (i.sales_count || 0) === 0),
        };
      }

      return { menuItems: enrichedItems, bcgMatrix, insights, hasData: enrichedItems.length > 0 };
    },
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching menu engineering data:', error);
      toast({ title: 'Error al cargar datos de ingeniería de menú', description: (error as Error).message, variant: 'destructive' });
    }
  }, [error, toast]);

  const updateItemScores = useCallback(async (_itemId: string) => {
    try {
      await supabase.rpc('calculate_menu_item_scores', { p_user_id: userId, p_days: periodDays });
      await queryClient.invalidateQueries({ queryKey: qk.menus.engineering(userId, periodDays) });
    } catch (error) {
      console.error('Error updating scores:', error);
    }
  }, [userId, periodDays, queryClient]);

  const getRecommendations = useCallback((item: MenuItemWithCosts): string[] => {
    const recommendations: string[] = [];
    switch (item.bcg_category) {
      case 'star':
        recommendations.push('Mantener prominencia en el menú');
        recommendations.push('Considerar variaciones o versiones premium');
        recommendations.push('Usar como ancla para upselling');
        break;
      case 'cash_cow':
        recommendations.push('Optimizar posición en el menú para aumentar visibilidad');
        recommendations.push('Considerar incluir en combos o promociones');
        recommendations.push('Evaluar ligero aumento de precio');
        break;
      case 'question_mark':
        recommendations.push('Revisar costo de ingredientes');
        recommendations.push('Considerar ajuste de precio');
        recommendations.push('Evaluar si la receta puede optimizarse');
        break;
      case 'dog':
        recommendations.push('Considerar eliminar del menú');
        recommendations.push('Reevaluar receta y presentación');
        recommendations.push('Analizar si el target de mercado es correcto');
        break;
      default:
        recommendations.push('Vincular receta para análisis de costos');
        recommendations.push('Registrar ventas para análisis de popularidad');
    }
    if (!item.recipe_id) recommendations.unshift('⚠️ Sin receta vinculada - costos estimados');
    if (item.margin_percent < 30) recommendations.unshift('🔴 Margen crítico: revisar costos urgentemente');
    return recommendations;
  }, []);

  return {
    menuItems: data?.menuItems ?? [],
    bcgMatrix: data?.bcgMatrix ?? null,
    insights: data?.insights ?? null,
    loading: isLoading,
    hasData: data?.hasData ?? false,
    isViewingClient,
    updateItemScores,
    getRecommendations,
    refetch,
  };
};
