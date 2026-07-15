import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { qk } from '@/lib/queryKeys';

type MenuItemRow = Tables<'menu_items'>;
type RestaurantBrandRow = Tables<'restaurant_brands'>;
type RestaurantMenu = Tables<'restaurant_menus'>;

export const usePublicMenuData = (slug?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: qk.public.menuBySlug(slug),
    enabled: !!slug,
    queryFn: async () => {
      const { data: menuData } = await supabase
        .from('restaurant_menus')
        .select('*')
        .eq('public_url_slug', slug!)
        .eq('status', 'published')
        .maybeSingle();
      if (!menuData) return { menu: null as RestaurantMenu | null, items: [] as MenuItemRow[], brand: null as RestaurantBrandRow | null };

      const { data: itemsData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', menuData.id)
        .eq('is_available', true)
        .order('sort_order');
      const { data: brandData } = await supabase
        .from('restaurant_brands')
        .select('*')
        .eq('user_id', menuData.user_id)
        .maybeSingle();
      return { menu: menuData, items: itemsData || [], brand: brandData ?? null };
    },
  });

  return { menu: data?.menu ?? null, items: data?.items ?? [], brand: data?.brand ?? null, loading: isLoading };
};
