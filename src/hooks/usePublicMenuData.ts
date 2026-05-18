import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type MenuItemRow = Tables<'menu_items'>;
type RestaurantBrandRow = Tables<'restaurant_brands'>;
type RestaurantMenu = Tables<'restaurant_menus'>;

export const usePublicMenuData = (slug?: string) => {
  const [menu, setMenu] = useState<RestaurantMenu | null>(null);
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [brand, setBrand] = useState<RestaurantBrandRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: menuData } = await supabase
          .from('restaurant_menus')
          .select('*')
          .eq('public_url_slug', slug)
          .eq('status', 'published')
          .maybeSingle();

        if (menuData && !cancelled) {
          setMenu(menuData);
          const { data: itemsData } = await supabase
            .from('menu_items')
            .select('*')
            .eq('menu_id', menuData.id)
            .eq('is_available', true)
            .order('sort_order');
          if (!cancelled) setItems(itemsData || []);

          const { data: brandData } = await supabase
            .from('restaurant_brands')
            .select('*')
            .eq('user_id', menuData.user_id)
            .maybeSingle();
          if (brandData && !cancelled) setBrand(brandData);
        }
      } catch (error) {
        console.error('Error loading menu:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  return { menu, items, brand, loading };
};
