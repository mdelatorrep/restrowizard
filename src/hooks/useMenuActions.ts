import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MenuLike {
  id: string;
  name: string;
  description?: string | null;
  cuisine_type?: string | null;
  config?: any;
}

export const useMenuActions = (
  menus: MenuLike[],
  loadMenus: () => void,
) => {
  const { toast } = useToast();

  const deleteMenu = useCallback(async (menuId: string) => {
    try {
      const { error } = await supabase.from('restaurant_menus').delete().eq('id', menuId);
      if (error) throw error;
      toast({ title: 'Menú eliminado' });
      loadMenus();
    } catch (err) {
      console.error('Error deleting menu:', err);
      toast({ title: 'Error', description: 'No se pudo eliminar el menú', variant: 'destructive' });
    }
  }, [toast, loadMenus]);

  const duplicateMenu = useCallback(async (menuId: string) => {
    try {
      const menu = menus.find(m => m.id === menuId);
      if (!menu) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: slugData } = await supabase.rpc('generate_menu_slug', {
        menu_name: `${menu.name} (Copia)`,
      });

      const { data: newMenu, error } = await supabase
        .from('restaurant_menus')
        .insert({
          name: `${menu.name} (Copia)`,
          description: menu.description,
          cuisine_type: menu.cuisine_type as any,
          config: menu.config,
          user_id: user.id,
          public_url_slug: slugData,
          status: 'draft',
        } as any)
        .select()
        .single();

      if (error) throw error;

      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', menuId);

      if (items && items.length > 0 && newMenu) {
        const newItems = items.map(item => ({
          ...item,
          id: undefined,
          menu_id: newMenu.id,
          created_at: undefined,
          updated_at: undefined,
        }));
        await supabase.from('menu_items').insert(newItems);
      }

      toast({ title: 'Menú duplicado exitosamente' });
      loadMenus();
    } catch (err) {
      console.error('Error duplicating menu:', err);
      toast({ title: 'Error', description: 'No se pudo duplicar el menú', variant: 'destructive' });
    }
  }, [menus, toast, loadMenus]);

  return { deleteMenu, duplicateMenu };
};
