import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type MenuTemplate = Tables<'menu_templates'>;
export type RestaurantMenu = Tables<'restaurant_menus'>;
export type MenuItem = Tables<'menu_items'>;
export type MenuTemplateInsert = TablesInsert<'menu_templates'>;
export type RestaurantMenuInsert = TablesInsert<'restaurant_menus'>;
export type MenuItemInsert = TablesInsert<'menu_items'>;

export const useMenus = () => {
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load menu templates
  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las plantillas',
        variant: 'destructive',
      });
    }
  };

  // Load user's menus
  const loadMenus = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('restaurant_menus')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error('Error loading menus:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los menús',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new menu
  const createMenu = async (menuData: Omit<RestaurantMenuInsert, 'user_id' | 'public_url_slug'> & { name: string; cuisine_type: string }) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

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

      // Optimistic + global notify so other useMenus instances (e.g. the page
      // mounted behind the dialog) refresh, and prerequisites re-evaluate so
      // POS / Orders unlock after the menu is created.
      setMenus(prev => [data as RestaurantMenu, ...(prev || []).filter(m => m.id !== (data as any).id)]);
      window.dispatchEvent(new CustomEvent('menus:changed'));
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
    } finally {
      setLoading(false);
    }
  };

  // Update menu
  const updateMenu = async (id: string, updates: TablesUpdate<'restaurant_menus'>) => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

  useEffect(() => {
    loadTemplates();
    loadMenus();
  }, []);

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
