import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { qk } from '@/lib/queryKeys';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type MenuTemplate = Tables<'menu_templates'>;
export type RestaurantMenu = Tables<'restaurant_menus'>;
export type MenuItem = Tables<'menu_items'>;
export type MenuTemplateInsert = TablesInsert<'menu_templates'>;
export type RestaurantMenuInsert = TablesInsert<'restaurant_menus'>;
export type MenuItemInsert = TablesInsert<'menu_items'>;

export const useMenus = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Plantillas: catálogo global, no depende del usuario.
  const { data: templates = [] } = useQuery({
    queryKey: qk.menus.templates(),
    queryFn: async (): Promise<MenuTemplate[]> => {
      const { data, error } = await supabase
        .from('menu_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: menus = [], isLoading: loading } = useQuery({
    queryKey: qk.menus.all(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<RestaurantMenu[]> => {
      const { data, error } = await supabase
        .from('restaurant_menus')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const loadMenus = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.menus.all(user?.id) }),
    [queryClient, user?.id]
  );

  const loadTemplates = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.menus.templates() }),
    [queryClient]
  );

  // Compatibilidad: otros módulos aún emiten `menus:changed`.
  useEffect(() => {
    const onChanged = () => { loadMenus(); };
    window.addEventListener('menus:changed', onChanged);
    return () => window.removeEventListener('menus:changed', onChanged);
  }, [loadMenus]);

  // Create new menu
  const createMenu = async (menuData: Omit<RestaurantMenuInsert, 'user_id' | 'public_url_slug'> & { name: string; cuisine_type: string }) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      // Generate URL slug
      const { data: slugData } = await supabase.rpc('generate_menu_slug', {
        menu_name: menuData.name || 'menu'
      });

      const newMenu: RestaurantMenuInsert = {
        ...menuData,
        user_id: user.id,
        public_url_slug: slugData,
      };

      const { data, error } = await supabase
        .from('restaurant_menus')
        .insert(newMenu)
        .select()
        .single();

      if (error) throw error;

      // La caché compartida ya sincroniza cualquier otra instancia de useMenus.
      // `prerequisites:refresh` sigue: POS/Pedidos se desbloquean al crear el menú.
      await loadMenus();
      window.dispatchEvent(new CustomEvent('prerequisites:refresh'));

      toast({
        title: 'Éxito',
        description: 'Menú creado exitosamente',
      });

      return data;
    } catch (error) {
      console.error('Error creating menu:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el menú',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update menu
  const updateMenu = async (id: string, updates: TablesUpdate<'restaurant_menus'>) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_menus')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await loadMenus();

      toast({
        title: 'Éxito',
        description: 'Menú actualizado exitosamente',
      });

      return data;
    } catch (error) {
      console.error('Error updating menu:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el menú',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Publish menu
  const publishMenu = async (id: string) => {
    return updateMenu(id, { status: 'published' });
  };

  // Get menu items
  const getMenuItems = async (menuId: string) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', menuId)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading menu items:', error);
      return [];
    }
  };

  const invalidateMenuItems = useCallback(
    async (menuId: string) => {
      await queryClient.invalidateQueries({ queryKey: qk.menus.items(menuId) });
      await queryClient.invalidateQueries({ queryKey: qk.menus.itemsByUser(user?.id) });
    },
    [queryClient, user?.id]
  );

  // Add menu item
  const addMenuItem = async (menuId: string, item: Omit<MenuItemInsert, 'menu_id'> & { name: string; category: string }) => {
    try {
      const newItem: MenuItemInsert = {
        ...item,
        menu_id: menuId,
      };

      const { data, error } = await supabase
        .from('menu_items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;

      await invalidateMenuItems(menuId);
      // Notify prerequisites (POS unlock waits on menu items count)
      window.dispatchEvent(new CustomEvent('prerequisites:refresh'));

      toast({
        title: 'Éxito',
        description: 'Elemento agregado al menú',
      });

      return data;
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el elemento',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update menu item
  const updateMenuItem = async (id: string, updates: TablesUpdate<'menu_items'>) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await invalidateMenuItems((data as any).menu_id);

      toast({
        title: 'Éxito',
        description: 'Elemento actualizado',
      });

      return data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el elemento',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Delete menu item
  const deleteMenuItem = async (id: string) => {
    try {
      const { data: existing } = await supabase
        .from('menu_items')
        .select('menu_id')
        .eq('id', id)
        .maybeSingle();

      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (existing?.menu_id) await invalidateMenuItems(existing.menu_id);
      window.dispatchEvent(new CustomEvent('prerequisites:refresh'));

      toast({
        title: 'Éxito',
        description: 'Elemento eliminado del menú',
      });

      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el elemento',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    templates,
    menus,
    loading,
    loadTemplates,
    loadMenus,
    createMenu,
    updateMenu,
    publishMenu,
    getMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  };
};
