import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

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

export interface MenuManagementData {
  menu: RestaurantMenu | null;
  categories: MenuCategory[];
  items: MenuItem[];
  modifiers: MenuModifierWithOptions[];
  allergens: MenuAllergen[];
}

/** Carga completa del editor de menú (B-31: extraído del hook para bajarlo de 400L). */
export const fetchMenuManagementData = async (menuId: string): Promise<MenuManagementData> => {
  const [menuRes, categoriesRes, itemsRes, modifiersRes, allergensRes] = await Promise.all([
    supabase.from('restaurant_menus').select('*').eq('id', menuId).single(),
    supabase.from('menu_categories').select('*').eq('menu_id', menuId).order('sort_order'),
    supabase.from('menu_items').select('*').eq('menu_id', menuId).order('sort_order'),
    supabase.from('menu_item_modifiers').select('*').eq('menu_id', menuId).order('sort_order'),
    supabase.from('menu_allergens').select('*').order('sort_order'),
  ]);

  if (menuRes.error) throw menuRes.error;

  let modifiers: MenuModifierWithOptions[] = [];
  if (modifiersRes.data && modifiersRes.data.length > 0) {
    const modifierIds = modifiersRes.data.map(m => m.id);
    const { data: optionsData } = await supabase
      .from('menu_modifier_options')
      .select('*')
      .in('modifier_id', modifierIds)
      .order('sort_order');

    modifiers = modifiersRes.data.map(mod => ({
      ...mod,
      options: optionsData?.filter(opt => opt.modifier_id === mod.id) || []
    }));
  }

  return {
    menu: menuRes.data ?? null,
    categories: categoriesRes.data ?? [],
    items: itemsRes.data ?? [],
    modifiers,
    allergens: allergensRes.data ?? [],
  };
};

/** Agrupa ítems por categoría (custom primero, luego categorías legacy). */
export const groupItemsByCategory = (
  categories: MenuCategory[],
  items: MenuItem[]
): Record<string, MenuItem[]> => {
  const grouped: Record<string, MenuItem[]> = {};

  categories.forEach(cat => {
    grouped[cat.name] = items.filter(item => item.category === cat.name || item.category_id === cat.id);
  });

  items.forEach(item => {
    const categoryName = item.category;
    if (!grouped[categoryName]) grouped[categoryName] = [];
    if (!grouped[categoryName].find(i => i.id === item.id)) {
      grouped[categoryName].push(item);
    }
  });

  return grouped;
};

export interface MenuStats {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  categoriesCount: number;
  avgPrice: number;
  featuredItems: number;
}

export const computeMenuStats = (items: MenuItem[]): MenuStats => ({
  totalItems: items.length,
  availableItems: items.filter(i => i.is_available).length,
  unavailableItems: items.filter(i => !i.is_available).length,
  categoriesCount: new Set(items.map(i => i.category)).size,
  avgPrice: items.length > 0 ? items.reduce((sum, i) => sum + (i.price || 0), 0) / items.length : 0,
  featuredItems: items.filter(i => i.is_featured).length,
});
