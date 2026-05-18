import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [menus, setMenus] = useState<PublicMenuList[]>([]);
  const [menuItems, setMenuItems] = useState<PublicMenuItem[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !enabled) return;
    (async () => {
      const { data } = await supabase
        .from('restaurant_menus')
        .select('id, name, description')
        .eq('user_id', userId)
        .eq('status', 'published');
      if (data && data.length > 0) {
        setMenus(data);
        setSelectedMenu(data[0].id);
      }
    })();
  }, [userId, enabled]);

  useEffect(() => {
    if (!selectedMenu) return;
    (async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', selectedMenu)
        .eq('is_available', true)
        .order('category')
        .order('sort_order');
      if (data) {
        setMenuItems(data.map((item: any) => ({
          ...item,
          dietary_tags: (item.dietary_tags as string[]) || [],
        })));
      }
    })();
  }, [selectedMenu]);

  return { menus, menuItems, selectedMenu, setSelectedMenu };
};
