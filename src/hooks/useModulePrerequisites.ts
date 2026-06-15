import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';

export interface ModuleStatus {
  enabled: boolean;
  reason?: string;
  prerequisite?: string;
}

export interface ModulePrerequisites {
  // Datos base
  hasRecipes: boolean;
  hasMenuItems: boolean;
  hasMenus: boolean;
  hasInventory: boolean;
  hasStaff: boolean;
  hasOrders: boolean;
  hasFeedback: boolean;
  hasLoyaltyCustomers: boolean;
  hasBrand: boolean;
  
  // Contadores
  recipesCount: number;
  menuItemsCount: number;
  menusCount: number;
  inventoryCount: number;
  staffCount: number;
  ordersCount: number;
  
  // Estado de módulos
  modules: Record<string, ModuleStatus>;
  
  loading: boolean;
}

export const useModulePrerequisites = () => {
  const { userId } = useDataUserId();
  const [loading, setLoading] = useState(true);
  // `null` means "unknown" (query failed) — UI treats it as "do not lock"
  // so transient 503s on HEAD count queries never lock modules erratically.
  const [data, setData] = useState<{
    recipesCount: number | null;
    menuItemsCount: number | null;
    menusCount: number | null;
    inventoryCount: number | null;
    staffCount: number | null;
    ordersCount: number | null;
    feedbackCount: number | null;
    loyaltyCount: number | null;
    hasBrand: boolean | null;
  }>({
    recipesCount: 0,
    menuItemsCount: 0,
    menusCount: 0,
    inventoryCount: 0,
    staffCount: 0,
    ordersCount: 0,
    feedbackCount: 0,
    loyaltyCount: 0,
    hasBrand: false,
  });

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // TK-18: HEAD (count: 'exact', head: true) devolvía 503 intermitente para
    // varias tablas grandes. Como sólo necesitamos saber si existe ≥1 fila
    // para habilitar módulos, usamos un GET ligero `select('id').limit(1)`
    // y devolvemos 1 o 0 (no el conteo real). Más barato y sin 503.
    const safeCount = async (
      table: string,
      filter?: { col: string; val: string }
    ): Promise<number | null> => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = supabase.from(table as any).select('id').limit(1);
        if (filter) q = q.eq(filter.col, filter.val);
        const { data, error } = await q;
        if (error) {
          console.warn(`[prerequisites] probe failed for ${table}:`, error.message);
          return null;
        }
        return (data?.length ?? 0) > 0 ? 1 : 0;
      } catch (e) {
        console.warn(`[prerequisites] probe threw for ${table}:`, e);
        return null;
      }
    };

    const fetchCounts = async () => {
      const [
        recipesCount,
        menusCount,
        inventoryCount,
        staffCount,
        ordersCount,
        feedbackCount,
        loyaltyCount,
        brandCount,
      ] = await Promise.all([
        safeCount('recipes', { col: 'user_id', val: userId }),
        safeCount('restaurant_menus', { col: 'user_id', val: userId }),
        safeCount('inventory_items', { col: 'user_id', val: userId }),
        safeCount('staff_members', { col: 'user_id', val: userId }),
        safeCount('restaurant_orders', { col: 'user_id', val: userId }),
        safeCount('customer_feedback', { col: 'user_id', val: userId }),
        safeCount('loyalty_customers', { col: 'user_id', val: userId }),
        safeCount('restaurant_brands', { col: 'user_id', val: userId }),
      ]);

      let menuItemsCount: number | null = 0;
      if (menusCount === null) {
        menuItemsCount = null;
      } else if (menusCount > 0) {
        try {
          const { data: menus } = await supabase
            .from('restaurant_menus').select('id').eq('user_id', userId);
          if (menus && menus.length > 0) {
            const { data: items, error } = await supabase
              .from('menu_items')
              .select('id')
              .in('menu_id', menus.map(m => m.id))
              .limit(1);
            menuItemsCount = error ? null : ((items?.length ?? 0) > 0 ? 1 : 0);
          }
        } catch {
          menuItemsCount = null;
        }
      }

      setData({
        recipesCount,
        menusCount,
        menuItemsCount,
        inventoryCount,
        staffCount,
        ordersCount,
        feedbackCount,
        loyaltyCount,
        hasBrand: brandCount === null ? null : brandCount > 0,
      });
      setLoading(false);
    };

    fetchCounts();

    // P2-10: refetch on demand so lock states (e.g. POS waiting on menu items,
    // POS Reports waiting on orders) update right after data is created.
    const onRefresh = () => fetchCounts();
    window.addEventListener('prerequisites:refresh', onRefresh);
    return () => window.removeEventListener('prerequisites:refresh', onRefresh);
  }, [userId]);

  const prerequisites = useMemo((): ModulePrerequisites => {
    // When a count is `null` (transient failure) treat the prerequisite as
    // satisfied so the user is never locked out due to a 503/network blip.
    const ok = (v: number | null) => v === null || v > 0;
    const hasRecipes = ok(data.recipesCount);
    const hasMenuItems = ok(data.menuItemsCount);
    const hasMenus = ok(data.menusCount);
    const hasInventory = ok(data.inventoryCount);
    const hasStaff = ok(data.staffCount);
    const hasOrders = ok(data.ordersCount);
    const hasFeedback = ok(data.feedbackCount);
    const hasLoyaltyCustomers = ok(data.loyaltyCount);
    const hasBrand = data.hasBrand === null ? true : data.hasBrand;

    // Define module dependencies
    const modules: Record<string, ModuleStatus> = {
      // Módulos base - siempre disponibles
      'brand': { enabled: true },
      'recipes': { enabled: true },
      'inventory': { enabled: true },
      'suppliers': { enabled: true },
      'staff-schedule': { enabled: true },
      'talent': { enabled: true },
      
      // Menús - requiere recetas O puede crear productos directamente
      'menus': { 
        enabled: true, // Siempre habilitado, puede crear productos sin recetas
        reason: !hasRecipes ? 'Tip: Crea recetas primero para calcular costos automáticamente' : undefined
      },
      
      // Ingeniería de Menú - requiere productos en menús
      'menu-engineering': {
        enabled: hasMenuItems,
        reason: !hasMenuItems ? 'Requiere productos en el menú' : undefined,
        prerequisite: !hasMenuItems ? 'menus' : undefined
      },
      
      // POS y Ventas - requiere menús con productos
      'pos': {
        enabled: hasMenuItems,
        reason: !hasMenuItems ? 'Requiere productos en el menú' : undefined,
        prerequisite: !hasMenuItems ? 'menus' : undefined
      },
      'pos-reports': {
        enabled: hasOrders,
        reason: !hasOrders ? 'Requiere ventas registradas' : undefined,
        prerequisite: !hasOrders ? 'pos' : undefined
      },
      'orders': {
        enabled: hasMenuItems,
        reason: !hasMenuItems ? 'Requiere productos en el menú' : undefined,
        prerequisite: !hasMenuItems ? 'menus' : undefined
      },
      'kitchen': {
        enabled: hasMenuItems,
        reason: !hasMenuItems ? 'Requiere productos en el menú' : undefined,
        prerequisite: !hasMenuItems ? 'menus' : undefined
      },
      
      // Delivery - requiere menús con productos
      'delivery': {
        enabled: hasMenuItems,
        reason: !hasMenuItems ? 'Requiere productos en el menú' : undefined,
        prerequisite: !hasMenuItems ? 'menus' : undefined
      },
      
      // Website - requiere marca
      'website': {
        enabled: true, // Habilitado pero recomienda marca
        reason: !hasBrand ? 'Tip: Define tu marca primero para personalizar el sitio' : undefined
      },
      
      // Finanzas - mejor con ventas
      'finances': {
        enabled: true,
        reason: !hasOrders ? 'Tip: Registra ventas para ver datos reales' : undefined
      },
      
      // Operaciones - mejor con datos
      'operations': {
        enabled: true,
        reason: (!hasOrders && !hasFeedback) ? 'Tip: Registra ventas y feedback para análisis' : undefined
      },
      
      // Feedback y Fidelización - siempre disponibles
      'feedback': { enabled: true },
      'loyalty': { enabled: true },
      
      // Reservaciones - siempre disponible
      'reservations': { enabled: true },
      
      // Metas - mejor con historial
      'sales-goals': {
        enabled: true,
        reason: !hasOrders ? 'Tip: Registra ventas para proyecciones precisas' : undefined
      },
      
      // Sostenibilidad - requiere inventario para huella de carbono
      'sustainability': {
        enabled: true,
        reason: !hasInventory ? 'Tip: Registra inventario para calcular huella de carbono' : undefined
      },
      
      // Ghost Kitchen y Cadenas - avanzados
      'ghost-kitchen': { enabled: true },
      'chain-management': { enabled: true },
      
      // Social y Soporte
      'social-listening': { enabled: true },
      'support': { enabled: true },

      // IA y documentos — Phase 2/3
      'knowledge': { enabled: true },
      'invoices': {
        enabled: true,
        reason: !hasInventory ? 'Tip: registra inventario y proveedores para enlazar facturas automáticamente' : undefined,
      },
    };

    return {
      hasRecipes,
      hasMenuItems,
      hasMenus,
      hasInventory,
      hasStaff,
      hasOrders,
      hasFeedback,
      hasLoyaltyCustomers,
      hasBrand,
      recipesCount: data.recipesCount ?? 0,
      menuItemsCount: data.menuItemsCount ?? 0,
      menusCount: data.menusCount ?? 0,
      inventoryCount: data.inventoryCount ?? 0,
      staffCount: data.staffCount ?? 0,
      ordersCount: data.ordersCount ?? 0,
      modules,
      loading,
    };
  }, [data, loading]);

  return prerequisites;
};
