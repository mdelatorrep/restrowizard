import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { qk } from '@/lib/queryKeys';

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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: qk.menus.itemsByUser(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data: menus, error: menusError } = await supabase
        .from('restaurant_menus')
        .select('id')
        .eq('user_id', userId!);
      if (menusError) throw menusError;
      if (!menus || menus.length === 0) {
        return { menuItems: [] as MenuItem[], kpis: null as MenuEngineeringKPIs | null, hasData: false };
      }
      const menuIds = menus.map((m) => m.id);
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .in('menu_id', menuIds)
        .order('category', { ascending: true });
      if (itemsError) throw itemsError;
      const list = (items || []) as MenuItem[];

      let kpis: MenuEngineeringKPIs | null = null;
      if (list.length > 0) {
        const prices = list.map((i) => Number(i.price));
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const categories = new Set(list.map((i) => i.category));
        const categoryBreakdown: Record<string, number> = {};
        list.forEach((item) => {
          categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
        });
        kpis = {
          totalItems: list.length,
          avgPrice,
          categoriesCount: categories.size,
          featuredItems: list.filter((i) => i.is_featured).length,
          availableItems: list.filter((i) => i.is_available).length,
          categoryBreakdown,
          priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
        };
      }
      return { menuItems: list, kpis, hasData: list.length > 0 };
    },
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching menu data:', error);
      toast({
        title: 'Error al cargar datos del menú',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return {
    menuItems: data?.menuItems ?? [],
    kpis: data?.kpis ?? null,
    loading: isLoading,
    hasData: data?.hasData ?? false,
    isViewingClient,
    refetch,
  };
};
