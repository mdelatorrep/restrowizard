import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';

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
  const [menuItems, setMenuItems] = useState<MenuItemWithCosts[]>([]);
  const [bcgMatrix, setBcgMatrix] = useState<BCGMatrix | null>(null);
  const [insights, setInsights] = useState<MenuEngineeringInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchMenuData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // First, trigger a recalculation of scores
      await supabase.rpc('calculate_menu_item_scores', {
        p_user_id: userId,
        p_days: periodDays
      });

      // Get user's menus
      const { data: menus, error: menusError } = await supabase
        .from('restaurant_menus')
        .select('id')
        .eq('user_id', userId);

      if (menusError) throw menusError;

      if (!menus || menus.length === 0) {
        setMenuItems([]);
        setHasData(false);
        setLoading(false);
        return;
      }

      const menuIds = menus.map(m => m.id);

      // Get menu items with their recipe costs using the view
      const { data: items, error: itemsError } = await supabase
        .from('menu_items_with_costs')
        .select('*')
        .in('menu_id', menuIds);

      if (itemsError) throw itemsError;

      // Also get sales data for each item
      const { data: orders, error: ordersError } = await supabase
        .from('restaurant_orders')
        .select('items, total')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString())
        .not('status', 'in', '("cancelled","pending")');

      if (ordersError) throw ordersError;

      // Calculate sales per item
      const salesCount: Record<string, { count: number; revenue: number }> = {};
      
      if (orders) {
        for (const order of orders) {
          const orderItems = order.items as any[];
          if (Array.isArray(orderItems)) {
            for (const item of orderItems) {
              const itemId = item.menu_item_id;
              if (itemId) {
                if (!salesCount[itemId]) {
                  salesCount[itemId] = { count: 0, revenue: 0 };
                }
                salesCount[itemId].count += item.quantity || 1;
                salesCount[itemId].revenue += (item.price || 0) * (item.quantity || 1);
              }
            }
          }
        }
      }

      // Merge sales data with menu items
      const enrichedItems: MenuItemWithCosts[] = (items || []).map(item => ({
        ...item,
        price: Number(item.price),
        recipe_cost: Number(item.recipe_cost) || 0,
        margin_percent: Number(item.margin_percent) || 0,
        popularity_score: Number(item.popularity_score) || 0,
        profitability_score: Number(item.profitability_score) || 0,
        bcg_category: (item.bcg_category || 'unknown') as MenuItemWithCosts['bcg_category'],
        sales_count: salesCount[item.id]?.count || 0,
        revenue: salesCount[item.id]?.revenue || 0
      }));

      setMenuItems(enrichedItems);
      setHasData(enrichedItems.length > 0);

      // Build BCG Matrix
      const matrix: BCGMatrix = {
        stars: enrichedItems.filter(i => i.bcg_category === 'star'),
        cashCows: enrichedItems.filter(i => i.bcg_category === 'cash_cow'),
        questionMarks: enrichedItems.filter(i => i.bcg_category === 'question_mark'),
        dogs: enrichedItems.filter(i => i.bcg_category === 'dog')
      };
      setBcgMatrix(matrix);

      // Calculate insights
      if (enrichedItems.length > 0) {
        const avgMargin = enrichedItems.reduce((sum, i) => sum + i.margin_percent, 0) / enrichedItems.length;
        const avgPrice = enrichedItems.reduce((sum, i) => sum + i.price, 0) / enrichedItems.length;
        const avgPopularity = enrichedItems.reduce((sum, i) => sum + i.popularity_score, 0) / enrichedItems.length;
        const itemsWithRecipes = enrichedItems.filter(i => i.recipe_id).length;

        setInsights({
          totalItems: enrichedItems.length,
          avgMargin,
          avgPrice,
          avgPopularity,
          itemsWithRecipes,
          itemsWithoutRecipes: enrichedItems.length - itemsWithRecipes,
          lowMarginAlerts: enrichedItems.filter(i => i.margin_percent < 50 && i.margin_percent > 0).sort((a, b) => a.margin_percent - b.margin_percent),
          topPerformers: [...enrichedItems].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 5),
          underperformers: enrichedItems.filter(i => i.bcg_category === 'dog' && (i.sales_count || 0) === 0)
        });
      } else {
        setInsights(null);
      }
    } catch (error: any) {
      console.error('Error fetching menu engineering data:', error);
      toast({
        title: "Error al cargar datos de ingeniería de menú",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, periodDays, toast]);

  // Update a single item's scores manually
  const updateItemScores = useCallback(async (itemId: string) => {
    try {
      await supabase.rpc('calculate_menu_item_scores', {
        p_user_id: userId,
        p_days: periodDays
      });
      await fetchMenuData();
    } catch (error) {
      console.error('Error updating scores:', error);
    }
  }, [userId, periodDays, fetchMenuData]);

  // Get recommendations for an item based on its BCG category
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

    if (!item.recipe_id) {
      recommendations.unshift('⚠️ Sin receta vinculada - costos estimados');
    }

    if (item.margin_percent < 30) {
      recommendations.unshift('🔴 Margen crítico: revisar costos urgentemente');
    }

    return recommendations;
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  return {
    menuItems,
    bcgMatrix,
    insights,
    loading,
    hasData,
    isViewingClient,
    updateItemScores,
    getRecommendations,
    refetch: fetchMenuData
  };
};
