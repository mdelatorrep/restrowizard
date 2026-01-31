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
  const [data, setData] = useState({
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

    const fetchCounts = async () => {
      try {
        // Fetch all counts in parallel
        const [
          recipesRes,
          menusRes,
          menuItemsRes,
          inventoryRes,
          staffRes,
          ordersRes,
          feedbackRes,
          loyaltyRes,
          brandRes
        ] = await Promise.all([
          supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('restaurant_menus').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('menu_items').select('id, menu_id', { count: 'exact' }).limit(1),
          supabase.from('inventory_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('staff_members').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('restaurant_orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('customer_feedback').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('loyalty_customers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('restaurant_brands').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        ]);

        // For menu items, we need to check if the menu belongs to the user
        let menuItemsCount = 0;
        if (menusRes.count && menusRes.count > 0) {
          const { data: menus } = await supabase
            .from('restaurant_menus')
            .select('id')
            .eq('user_id', userId);
          
          if (menus && menus.length > 0) {
            const menuIds = menus.map(m => m.id);
            const { count } = await supabase
              .from('menu_items')
              .select('id', { count: 'exact', head: true })
              .in('menu_id', menuIds);
            menuItemsCount = count || 0;
          }
        }

        setData({
          recipesCount: recipesRes.count || 0,
          menusCount: menusRes.count || 0,
          menuItemsCount,
          inventoryCount: inventoryRes.count || 0,
          staffCount: staffRes.count || 0,
          ordersCount: ordersRes.count || 0,
          feedbackCount: feedbackRes.count || 0,
          loyaltyCount: loyaltyRes.count || 0,
          hasBrand: (brandRes.count || 0) > 0,
        });
      } catch (error) {
        console.error('Error fetching module prerequisites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [userId]);

  const prerequisites = useMemo((): ModulePrerequisites => {
    const hasRecipes = data.recipesCount > 0;
    const hasMenuItems = data.menuItemsCount > 0;
    const hasMenus = data.menusCount > 0;
    const hasInventory = data.inventoryCount > 0;
    const hasStaff = data.staffCount > 0;
    const hasOrders = data.ordersCount > 0;
    const hasFeedback = data.feedbackCount > 0;
    const hasLoyaltyCustomers = data.loyaltyCount > 0;
    const hasBrand = data.hasBrand;

    // Define module dependencies
    const modules: Record<string, ModuleStatus> = {
      // Módulos base - siempre disponibles
      'brand': { enabled: true },
      'recipes': { enabled: true },
      'inventory': { enabled: true },
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
      recipesCount: data.recipesCount,
      menuItemsCount: data.menuItemsCount,
      menusCount: data.menusCount,
      inventoryCount: data.inventoryCount,
      staffCount: data.staffCount,
      ordersCount: data.ordersCount,
      modules,
      loading,
    };
  }, [data, loading]);

  return prerequisites;
};
