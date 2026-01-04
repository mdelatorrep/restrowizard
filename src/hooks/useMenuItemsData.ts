import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';

export interface MenuItem {
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
}

export interface MenuEngineeringKPIs {
  totalItems: number;
  avgPrice: number;
  categoriesCount: number;
  featuredItems: number;
  availableItems: number;
  categoryBreakdown: Record<string, number>;
  priceRange: { min: number; max: number };
}

export const useMenuItemsData = () => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [kpis, setKpis] = useState<MenuEngineeringKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // First get user's menus
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

      // Then get menu items
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .in('menu_id', menuIds)
        .order('category', { ascending: true });

      if (itemsError) throw itemsError;

      setMenuItems(items || []);
      setHasData((items?.length || 0) > 0);

      // Calculate KPIs
      if (items && items.length > 0) {
        const prices = items.map(i => Number(i.price));
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const categories = new Set(items.map(i => i.category));
        const featuredItems = items.filter(i => i.is_featured).length;
        const availableItems = items.filter(i => i.is_available).length;

        const categoryBreakdown: Record<string, number> = {};
        items.forEach(item => {
          categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
        });

        setKpis({
          totalItems: items.length,
          avgPrice,
          categoriesCount: categories.size,
          featuredItems,
          availableItems,
          categoryBreakdown,
          priceRange: { min: Math.min(...prices), max: Math.max(...prices) }
        });
      } else {
        setKpis(null);
      }
    } catch (error: any) {
      console.error('Error fetching menu data:', error);
      toast({
        title: "Error al cargar datos del menú",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  return {
    menuItems,
    kpis,
    loading,
    hasData,
    isViewingClient,
    refetch: fetchData
  };
};
