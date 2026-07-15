import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { qk } from '@/lib/queryKeys';

export interface ModuleStatus {
  enabled: boolean;
  reason?: string;
  prerequisite?: string;
}

export interface ModulePrerequisites {
  hasRecipes: boolean;
  hasMenuItems: boolean;
  hasMenus: boolean;
  hasInventory: boolean;
  hasStaff: boolean;
  hasOrders: boolean;
  hasFeedback: boolean;
  hasLoyaltyCustomers: boolean;
  hasBrand: boolean;
  recipesCount: number;
  menuItemsCount: number;
  menusCount: number;
  inventoryCount: number;
  staffCount: number;
  ordersCount: number;
  modules: Record<string, ModuleStatus>;
  loading: boolean;
}

interface Counts {
  recipesCount: number | null;
  menuItemsCount: number | null;
  menusCount: number | null;
  inventoryCount: number | null;
  staffCount: number | null;
  ordersCount: number | null;
  feedbackCount: number | null;
  loyaltyCount: number | null;
  hasBrand: boolean | null;
}

const ZERO: Counts = {
  recipesCount: 0, menuItemsCount: 0, menusCount: 0, inventoryCount: 0,
  staffCount: 0, ordersCount: 0, feedbackCount: 0, loyaltyCount: 0, hasBrand: false,
};

export const useModulePrerequisites = () => {
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();

  const { data: counts, isLoading } = useQuery({
    queryKey: qk.modules.prerequisites(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Counts> => {
      const safeCount = async (table: string, filter?: { col: string; val: string }): Promise<number | null> => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let q: any = supabase.from(table as any).select('id').limit(1);
          if (filter) q = q.eq(filter.col, filter.val);
          const { data, error } = await q;
          if (error) { console.warn(`[prerequisites] probe failed for ${table}:`, error.message); return null; }
          return (data?.length ?? 0) > 0 ? 1 : 0;
        } catch (e) {
          console.warn(`[prerequisites] probe threw for ${table}:`, e);
          return null;
        }
      };

      const [recipesCount, menusCount, inventoryCount, staffCount, ordersCount, feedbackCount, loyaltyCount, brandCount] = await Promise.all([
        safeCount('recipes', { col: 'user_id', val: userId! }),
        safeCount('restaurant_menus', { col: 'user_id', val: userId! }),
        safeCount('inventory_items', { col: 'user_id', val: userId! }),
        safeCount('staff_members', { col: 'user_id', val: userId! }),
        safeCount('restaurant_orders', { col: 'user_id', val: userId! }),
        safeCount('customer_feedback', { col: 'user_id', val: userId! }),
        safeCount('loyalty_customers', { col: 'user_id', val: userId! }),
        safeCount('restaurant_brands', { col: 'user_id', val: userId! }),
      ]);

      let menuItemsCount: number | null = 0;
      if (menusCount === null) {
        menuItemsCount = null;
      } else if (menusCount > 0) {
        try {
          const { data: menus } = await supabase.from('restaurant_menus').select('id').eq('user_id', userId!);
          if (menus && menus.length > 0) {
            const { data: items, error } = await supabase.from('menu_items').select('id').in('menu_id', menus.map((m) => m.id)).limit(1);
            menuItemsCount = error ? null : ((items?.length ?? 0) > 0 ? 1 : 0);
          }
        } catch {
          menuItemsCount = null;
        }
      }

      return {
        recipesCount, menusCount, menuItemsCount, inventoryCount, staffCount,
        ordersCount, feedbackCount, loyaltyCount, hasBrand: brandCount === null ? null : brandCount > 0,
      };
    },
  });

  useEffect(() => {
    const onRefresh = () => queryClient.invalidateQueries({ queryKey: qk.modules.prerequisites(userId) });
    window.addEventListener('prerequisites:refresh', onRefresh);
    return () => window.removeEventListener('prerequisites:refresh', onRefresh);
  }, [queryClient, userId]);

  const prerequisites = useMemo((): ModulePrerequisites => {
    const d = counts ?? ZERO;
    const ok = (v: number | null) => v === null || v > 0;
    const hasRecipes = ok(d.recipesCount);
    const hasMenuItems = ok(d.menuItemsCount);
    const hasMenus = ok(d.menusCount);
    const hasInventory = ok(d.inventoryCount);
    const hasStaff = ok(d.staffCount);
    const hasOrders = ok(d.ordersCount);
    const hasFeedback = ok(d.feedbackCount);
    const hasLoyaltyCustomers = ok(d.loyaltyCount);
    const hasBrand = d.hasBrand === null ? true : d.hasBrand;

    const modules: Record<string, ModuleStatus> = {
      'brand': { enabled: true },
      'recipes': { enabled: true },
      'inventory': { enabled: true },
      'suppliers': { enabled: true },
      'staff-schedule': { enabled: true },
      'talent': { enabled: true },
      'menus': { enabled: true, reason: !hasRecipes ? 'Tip: Crea recetas primero para calcular costos automáticamente' : undefined },
      'menu-engineering': { enabled: hasMenuItems, reason: !hasMenuItems ? 'Requiere productos en el menú' : undefined, prerequisite: !hasMenuItems ? 'menus' : undefined },
      'pos': { enabled: hasMenuItems, reason: !hasMenuItems ? 'Requiere productos en el menú' : undefined, prerequisite: !hasMenuItems ? 'menus' : undefined },
      'pos-reports': { enabled: hasOrders, reason: !hasOrders ? 'Requiere ventas registradas' : undefined, prerequisite: !hasOrders ? 'pos' : undefined },
      'orders': { enabled: hasMenuItems, reason: !hasMenuItems ? 'Requiere productos en el menú' : undefined, prerequisite: !hasMenuItems ? 'menus' : undefined },
      'kitchen': { enabled: hasMenuItems, reason: !hasMenuItems ? 'Requiere productos en el menú' : undefined, prerequisite: !hasMenuItems ? 'menus' : undefined },
      'delivery': { enabled: hasMenuItems, reason: !hasMenuItems ? 'Requiere productos en el menú' : undefined, prerequisite: !hasMenuItems ? 'menus' : undefined },
      'website': { enabled: true, reason: !hasBrand ? 'Tip: Define tu marca primero para personalizar el sitio' : undefined },
      'finances': { enabled: true, reason: !hasOrders ? 'Tip: Registra ventas para ver datos reales' : undefined },
      'operations': { enabled: true, reason: (!hasOrders && !hasFeedback) ? 'Tip: Registra ventas y feedback para análisis' : undefined },
      'feedback': { enabled: true },
      'loyalty': { enabled: true },
      'reservations': { enabled: true },
      'sales-goals': { enabled: true, reason: !hasOrders ? 'Tip: Registra ventas para proyecciones precisas' : undefined },
      'sustainability': { enabled: true, reason: !hasInventory ? 'Tip: Registra inventario para calcular huella de carbono' : undefined },
      'ghost-kitchen': { enabled: true },
      'chain-management': { enabled: true },
      'social-listening': { enabled: true },
      'support': { enabled: true },
      'knowledge': { enabled: true },
      'invoices': { enabled: true, reason: !hasInventory ? 'Tip: registra inventario y proveedores para enlazar facturas automáticamente' : undefined },
    };

    return {
      hasRecipes, hasMenuItems, hasMenus, hasInventory, hasStaff, hasOrders, hasFeedback, hasLoyaltyCustomers, hasBrand,
      recipesCount: d.recipesCount ?? 0,
      menuItemsCount: d.menuItemsCount ?? 0,
      menusCount: d.menusCount ?? 0,
      inventoryCount: d.inventoryCount ?? 0,
      staffCount: d.staffCount ?? 0,
      ordersCount: d.ordersCount ?? 0,
      modules,
      loading: isLoading,
    };
  }, [counts, isLoading]);

  return prerequisites;
};
