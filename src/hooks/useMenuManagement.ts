import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { qk } from '@/lib/queryKeys';
import {
  fetchMenuManagementData,
  groupItemsByCategory,
  computeMenuStats,
  type MenuManagementData,
} from './menuManagement/menuManagementData';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// B-31: los tipos y la carga viven en ./menuManagement/menuManagementData.
export type {
  MenuCategory, MenuModifier, ModifierOption, MenuAllergen, MenuItem,
  RestaurantMenu, MenuItemWithDetails, MenuModifierWithOptions,
} from './menuManagement/menuManagementData';

const EMPTY: MenuManagementData = { menu: null, categories: [], items: [], modifiers: [], allergens: [] };

export const useMenuManagement = (menuId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data = EMPTY, isLoading: loading } = useQuery({
    queryKey: qk.menus.management(menuId),
    enabled: !!menuId,
    queryFn: async () => {
      try {
        return await fetchMenuManagementData(menuId);
      } catch (error) {
        console.error('Error loading menu data:', error);
        toast({ title: 'Error', description: 'No se pudo cargar el menú', variant: 'destructive' });
        throw error;
      }
    },
  });

  const { menu, categories, items, modifiers, allergens } = data;

  const reload = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.menus.management(menuId) }),
    [queryClient, menuId]
  );

  /**
   * Los ítems de este menú son los MISMOS que leen el POS, la carta pública y la
   * ingeniería de menú. Antes el editor solo parcheaba su estado local: agregabas
   * un plato y el POS seguía sin verlo hasta recargar la página.
   */
  const reloadItems = useCallback(async () => {
    await reload();
    await queryClient.invalidateQueries({ queryKey: qk.menus.items(menuId) });
    await queryClient.invalidateQueries({ queryKey: ['menu-items-user'] });
    await queryClient.invalidateQueries({ queryKey: ['pos-menu'] });
    await queryClient.invalidateQueries({ queryKey: ['public-menu-items'] });
    await queryClient.invalidateQueries({ queryKey: ['menu-availability'] });
    // El POS se desbloquea según el conteo de ítems (ver useModulePrerequisites).
    window.dispatchEvent(new CustomEvent('prerequisites:refresh'));
  }, [reload, queryClient, menuId]);

  // ---- Categorías ----
  const createCategory = async (data: Omit<TablesInsert<'menu_categories'>, 'menu_id'>) => {
    try {
      const { data: result, error } = await supabase
        .from('menu_categories')
        .insert({ ...data, menu_id: menuId })
        .select()
        .single();
      if (error) throw error;
      await reload();
      toast({ title: 'Categoría creada' });
      return result;
    } catch (error) {
      console.error('Error creating category:', error);
      toast({ title: 'Error', description: 'No se pudo crear la categoría', variant: 'destructive' });
      return null;
    }
  };

  const updateCategory = async (id: string, data: TablesUpdate<'menu_categories'>) => {
    try {
      const { data: result, error } = await supabase
        .from('menu_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await reload();
      toast({ title: 'Categoría actualizada' });
      return result;
    } catch (error) {
      console.error('Error updating category:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar la categoría', variant: 'destructive' });
      return null;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from('menu_categories').delete().eq('id', id);
      if (error) throw error;
      await reload();
      toast({ title: 'Categoría eliminada' });
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar la categoría', variant: 'destructive' });
      return false;
    }
  };

  const reorderCategories = async (newOrder: Array<{ id: string; name: string }>) => {
    try {
      const updates = newOrder.map((cat, index) => ({
        id: cat.id,
        sort_order: index,
        menu_id: menuId,
        name: cat.name,
      }));
      const { error } = await supabase.from('menu_categories').upsert(updates);
      if (error) throw error;
      await reload();
      return true;
    } catch (error) {
      console.error('Error reordering categories:', error);
      return false;
    }
  };

  // ---- Ítems ----
  const createItem = async (data: Omit<TablesInsert<'menu_items'>, 'menu_id'> & { name: string; category: string }) => {
    try {
      const { data: result, error } = await supabase
        .from('menu_items')
        .insert({ ...data, menu_id: menuId })
        .select()
        .single();
      if (error) throw error;
      await reloadItems();
      toast({ title: 'Ítem creado' });
      return result;
    } catch (error) {
      console.error('Error creating item:', error);
      toast({ title: 'Error', description: 'No se pudo crear el ítem', variant: 'destructive' });
      return null;
    }
  };

  const updateItem = async (id: string, data: TablesUpdate<'menu_items'>) => {
    try {
      const { data: result, error } = await supabase
        .from('menu_items')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await reloadItems();
      return result;
    } catch (error) {
      console.error('Error updating item:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el ítem', variant: 'destructive' });
      return null;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      await reloadItems();
      toast({ title: 'Ítem eliminado' });
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el ítem', variant: 'destructive' });
      return false;
    }
  };

  const toggleItemAvailability = async (id: string, isAvailable: boolean) => {
    return updateItem(id, { is_available: isAvailable });
  };

  const reorderItems = async (_categoryOrAll: string, newOrder: Array<{ id: string; name: string; category: string }>) => {
    try {
      const updates = newOrder.map((item, index) => ({
        id: item.id,
        sort_order: index,
        menu_id: menuId,
        name: item.name,
        category: item.category,
      }));
      const { error } = await supabase.from('menu_items').upsert(updates);
      if (error) throw error;
      await reloadItems();
      return true;
    } catch (error) {
      console.error('Error reordering items:', error);
      return false;
    }
  };

  // ---- Modificadores ----
  const createModifier = async (data: Omit<TablesInsert<'menu_item_modifiers'>, 'menu_id'>) => {
    try {
      const { data: result, error } = await supabase
        .from('menu_item_modifiers')
        .insert({ ...data, menu_id: menuId })
        .select()
        .single();
      if (error) throw error;
      await reload();
      toast({ title: 'Modificador creado' });
      return result;
    } catch (error) {
      console.error('Error creating modifier:', error);
      toast({ title: 'Error', description: 'No se pudo crear el modificador', variant: 'destructive' });
      return null;
    }
  };

  const updateModifier = async (id: string, data: TablesUpdate<'menu_item_modifiers'>) => {
    try {
      const { data: result, error } = await supabase
        .from('menu_item_modifiers')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await reload();
      return result;
    } catch (error) {
      console.error('Error updating modifier:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el modificador', variant: 'destructive' });
      return null;
    }
  };

  const deleteModifier = async (id: string) => {
    try {
      const { error } = await supabase.from('menu_item_modifiers').delete().eq('id', id);
      if (error) throw error;
      await reload();
      toast({ title: 'Modificador eliminado' });
      return true;
    } catch (error) {
      console.error('Error deleting modifier:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el modificador', variant: 'destructive' });
      return false;
    }
  };

  const createModifierOption = async (modifierId: string, data: Omit<TablesInsert<'menu_modifier_options'>, 'modifier_id'>) => {
    try {
      const { data: result, error } = await supabase
        .from('menu_modifier_options')
        .insert({ ...data, modifier_id: modifierId })
        .select()
        .single();
      if (error) throw error;
      await reload();
      return result;
    } catch (error) {
      console.error('Error creating modifier option:', error);
      toast({ title: 'Error', description: 'No se pudo crear la opción', variant: 'destructive' });
      return null;
    }
  };

  const deleteModifierOption = async (_modifierId: string, optionId: string) => {
    try {
      const { error } = await supabase.from('menu_modifier_options').delete().eq('id', optionId);
      if (error) throw error;
      await reload();
      return true;
    } catch (error) {
      console.error('Error deleting modifier option:', error);
      return false;
    }
  };

  // ---- Imagen ----
  const uploadItemImage = async (itemId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${menuId}/${itemId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      await updateItem(itemId, { image_url: imageUrl });
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Error', description: 'No se pudo subir la imagen', variant: 'destructive' });
      return null;
    }
  };

  const getItemsByCategory = useCallback(
    () => groupItemsByCategory(categories, items),
    [categories, items]
  );

  const stats = useMemo(() => computeMenuStats(items), [items]);

  return {
    menu,
    categories,
    items,
    modifiers,
    allergens,
    loading,
    stats,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    createItem,
    updateItem,
    deleteItem,
    toggleItemAvailability,
    reorderItems,
    uploadItemImage,
    getItemsByCategory,
    createModifier,
    updateModifier,
    deleteModifier,
    createModifierOption,
    deleteModifierOption,
    reload,
  };
};
