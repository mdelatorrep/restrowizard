import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Types
export type MenuCategory = Tables<'menu_categories'>;
export type MenuModifier = Tables<'menu_item_modifiers'>;
export type ModifierOption = Tables<'menu_modifier_options'>;
export type MenuAllergen = Tables<'menu_allergens'>;
export type MenuItem = Tables<'menu_items'>;
export type RestaurantMenu = Tables<'restaurant_menus'>;

export interface MenuItemWithDetails extends MenuItem {
  modifiers?: MenuModifier[];
}

export interface MenuModifierWithOptions extends MenuModifier {
  options: ModifierOption[];
}

export const useMenuManagement = (menuId: string) => {
  const [menu, setMenu] = useState<RestaurantMenu | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [modifiers, setModifiers] = useState<MenuModifierWithOptions[]>([]);
  const [allergens, setAllergens] = useState<MenuAllergen[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load all menu data
  const loadMenuData = useCallback(async () => {
    if (!menuId) return;
    
    try {
      setLoading(true);
      
      // Parallel fetch
      const [menuRes, categoriesRes, itemsRes, modifiersRes, allergensRes] = await Promise.all([
        supabase.from('restaurant_menus').select('*').eq('id', menuId).single(),
        supabase.from('menu_categories').select('*').eq('menu_id', menuId).order('sort_order'),
        supabase.from('menu_items').select('*').eq('menu_id', menuId).order('sort_order'),
        supabase.from('menu_item_modifiers').select('*').eq('menu_id', menuId).order('sort_order'),
        supabase.from('menu_allergens').select('*').order('sort_order'),
      ]);

      if (menuRes.data) setMenu(menuRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
      if (allergensRes.data) setAllergens(allergensRes.data);

      // Load modifier options
      if (modifiersRes.data && modifiersRes.data.length > 0) {
        const modifierIds = modifiersRes.data.map(m => m.id);
        const { data: optionsData } = await supabase
          .from('menu_modifier_options')
          .select('*')
          .in('modifier_id', modifierIds)
          .order('sort_order');

        const modifiersWithOptions = modifiersRes.data.map(mod => ({
          ...mod,
          options: optionsData?.filter(opt => opt.modifier_id === mod.id) || []
        }));
        setModifiers(modifiersWithOptions);
      } else {
        setModifiers([]);
      }

    } catch (error) {
      console.error('Error loading menu data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el menú',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [menuId, toast]);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  // Category operations
  const createCategory = async (data: Omit<TablesInsert<'menu_categories'>, 'menu_id'>) => {
    try {
      const { data: result, error } = await supabase
        .from('menu_categories')
        .insert({ ...data, menu_id: menuId })
        .select()
        .single();

      if (error) throw error;
      setCategories(prev => [...prev, result]);
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
      setCategories(prev => prev.map(c => c.id === id ? result : c));
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
      setCategories(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Categoría eliminada' });
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar la categoría', variant: 'destructive' });
      return false;
    }
  };

  const reorderCategories = async (newOrder: MenuCategory[]) => {
    try {
      const updates = newOrder.map((cat, index) => ({
        id: cat.id,
        sort_order: index,
        menu_id: menuId,
        name: cat.name,
      }));

      const { error } = await supabase.from('menu_categories').upsert(updates);
      if (error) throw error;
      setCategories(newOrder.map((cat, index) => ({ ...cat, sort_order: index })));
      return true;
    } catch (error) {
      console.error('Error reordering categories:', error);
      return false;
    }
  };

  // Item operations
  const createItem = async (data: Omit<TablesInsert<'menu_items'>, 'menu_id'> & { name: string; category: string }) => {
    try {
      const { data: result, error } = await supabase
        .from('menu_items')
        .insert({ ...data, menu_id: menuId, sort_order: items.length })
        .select()
        .single();

      if (error) throw error;
      setItems(prev => [...prev, result]);
      toast({ title: 'Platillo agregado' });
      return result;
    } catch (error) {
      console.error('Error creating item:', error);
      toast({ title: 'Error', description: 'No se pudo crear el platillo', variant: 'destructive' });
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
      setItems(prev => prev.map(i => i.id === id ? result : i));
      toast({ title: 'Platillo actualizado' });
      return result;
    } catch (error) {
      console.error('Error updating item:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el platillo', variant: 'destructive' });
      return null;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: 'Platillo eliminado' });
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el platillo', variant: 'destructive' });
      return false;
    }
  };

  const toggleItemAvailability = async (id: string, isAvailable: boolean) => {
    return updateItem(id, { is_available: isAvailable });
  };

  const reorderItems = async (categoryOrAll: string, newOrder: MenuItem[]) => {
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
      
      // Update local state maintaining items from other categories
      setItems(prev => {
        const otherItems = prev.filter(i => i.category !== categoryOrAll || !newOrder.find(n => n.id === i.id));
        const updatedItems = newOrder.map((item, index) => ({ ...item, sort_order: index }));
        return [...otherItems, ...updatedItems].sort((a, b) => a.sort_order - b.sort_order);
      });
      return true;
    } catch (error) {
      console.error('Error reordering items:', error);
      return false;
    }
  };

  // Modifier operations
  const createModifier = async (data: Omit<TablesInsert<'menu_item_modifiers'>, 'menu_id'>) => {
    try {
      const { data: result, error } = await supabase
        .from('menu_item_modifiers')
        .insert({ ...data, menu_id: menuId })
        .select()
        .single();

      if (error) throw error;
      setModifiers(prev => [...prev, { ...result, options: [] }]);
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
      setModifiers(prev => prev.map(m => m.id === id ? { ...result, options: m.options } : m));
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
      setModifiers(prev => prev.filter(m => m.id !== id));
      toast({ title: 'Modificador eliminado' });
      return true;
    } catch (error) {
      console.error('Error deleting modifier:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el modificador', variant: 'destructive' });
      return false;
    }
  };

  // Modifier option operations
  const createModifierOption = async (modifierId: string, data: Omit<TablesInsert<'menu_modifier_options'>, 'modifier_id'>) => {
    try {
      const { data: result, error } = await supabase
        .from('menu_modifier_options')
        .insert({ ...data, modifier_id: modifierId })
        .select()
        .single();

      if (error) throw error;
      setModifiers(prev => prev.map(m => 
        m.id === modifierId 
          ? { ...m, options: [...m.options, result] }
          : m
      ));
      return result;
    } catch (error) {
      console.error('Error creating modifier option:', error);
      toast({ title: 'Error', description: 'No se pudo crear la opción', variant: 'destructive' });
      return null;
    }
  };

  const deleteModifierOption = async (modifierId: string, optionId: string) => {
    try {
      const { error } = await supabase.from('menu_modifier_options').delete().eq('id', optionId);
      if (error) throw error;
      setModifiers(prev => prev.map(m => 
        m.id === modifierId 
          ? { ...m, options: m.options.filter(o => o.id !== optionId) }
          : m
      ));
      return true;
    } catch (error) {
      console.error('Error deleting modifier option:', error);
      return false;
    }
  };

  // Upload item image
  const uploadItemImage = async (itemId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${menuId}/${itemId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;
      
      await updateItem(itemId, { image_url: imageUrl });
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Error', description: 'No se pudo subir la imagen', variant: 'destructive' });
      return null;
    }
  };

  // Get items grouped by category
  const getItemsByCategory = useCallback(() => {
    const grouped: Record<string, MenuItem[]> = {};
    
    // First, add custom categories
    categories.forEach(cat => {
      grouped[cat.name] = items.filter(item => item.category === cat.name || item.category_id === cat.id);
    });

    // Then add items with legacy categories not in custom categories
    items.forEach(item => {
      const categoryName = item.category;
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      if (!grouped[categoryName].find(i => i.id === item.id)) {
        grouped[categoryName].push(item);
      }
    });

    return grouped;
  }, [categories, items]);

  // Stats
  const stats = {
    totalItems: items.length,
    availableItems: items.filter(i => i.is_available).length,
    unavailableItems: items.filter(i => !i.is_available).length,
    categoriesCount: new Set(items.map(i => i.category)).size,
    avgPrice: items.length > 0 
      ? items.reduce((sum, i) => sum + (i.price || 0), 0) / items.length 
      : 0,
    featuredItems: items.filter(i => i.is_featured).length,
  };

  return {
    menu,
    categories,
    items,
    modifiers,
    allergens,
    loading,
    stats,
    // Category operations
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    // Item operations
    createItem,
    updateItem,
    deleteItem,
    toggleItemAvailability,
    reorderItems,
    uploadItemImage,
    getItemsByCategory,
    // Modifier operations
    createModifier,
    updateModifier,
    deleteModifier,
    createModifierOption,
    deleteModifierOption,
    // Reload
    reload: loadMenuData,
  };
};
