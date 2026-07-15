import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { qk } from '@/lib/queryKeys';

export interface PublicMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  dietary_tags: string[];
}

export interface PublicMenuList {
  id: string;
  name: string;
  description: string | null;
}

export const usePublicRestaurantMenus = (userId: string | undefined, enabled: boolean) => {
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  const { data: menus = [] } = useQuery({
    queryKey: qk.public.userMenus(userId),
    enabled: !!userId && enabled,
    queryFn: async (): Promise<PublicMenuList[]> => {
      const { data } = await supabase
        .from('restaurant_menus')
        .select('id, name, description')
        .eq('user_id', userId!)
        .eq('status', 'published');
      return data || [];
    },
  });

  useEffect(() => {
    if (menus.length > 0 && !selectedMenu) setSelectedMenu(menus[0].id);
  }, [menus, selectedMenu]);

  const { data: menuItems = [] } = useQuery({
    queryKey: qk.public.menuItemsList(selectedMenu),
    enabled: !!selectedMenu,
    queryFn: async (): Promise<PublicMenuItem[]> => {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', selectedMenu!)
        .eq('is_available', true)
        .order('category')
        .order('sort_order');
      return (data || []).map((item: any) => ({ ...item, dietary_tags: (item.dietary_tags as string[]) || [] }));
    },
  });

  return { menus, menuItems, selectedMenu, setSelectedMenu };
};
