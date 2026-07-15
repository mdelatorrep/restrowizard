import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';
import { createSessionSupabaseClient } from '@/lib/createSessionSupabaseClient';
import { qk } from '@/lib/queryKeys';

export interface InventoryItem {
  id: string;
  item_name: string;
  category: string | null;
  current_stock: number;
  unit: string;
  unit_cost: number | null;
  reorder_point: number | null;
  supplier_name: string | null;
  last_restocked_at: string | null;
}

export interface InventoryKPIs {
  totalItems: number;
  totalValue: number;
  lowStockItems: InventoryItem[];
  outOfStockItems: InventoryItem[];
  categoryBreakdown: Record<string, number>;
  averageStockDays: number;
}

export const useInventoryData = () => {
  const { userId, isViewingClient } = useDataUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: qk.inventory.items(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId!)
        .order('item_name');
      if (error) throw error;
      const list: InventoryItem[] = rows || [];

      let kpis: InventoryKPIs | null = null;
      if (list.length > 0) {
        const totalValue = list.reduce((sum, item) => sum + (item.current_stock * Number(item.unit_cost || 0)), 0);
        const lowStockItems = list.filter((item) =>
          item.reorder_point && item.current_stock <= Number(item.reorder_point) && item.current_stock > 0);
        const outOfStockItems = list.filter((item) => item.current_stock <= 0);
        const categoryBreakdown: Record<string, number> = {};
        list.forEach((item) => {
          const category = item.category || 'General';
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
        });
        kpis = {
          totalItems: list.length,
          totalValue,
          lowStockItems,
          outOfStockItems,
          categoryBreakdown,
          averageStockDays: 14,
        };
      }
      return { inventory: list, kpis, hasData: list.length > 0 };
    },
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching inventory data:', error);
      toast({ title: 'Error al cargar inventario', description: (error as Error).message, variant: 'destructive' });
    }
  }, [error, toast]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.inventory.items(userId) });

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    if (!userId) return null;
    try {
      const sessionSupabase = await createSessionSupabaseClient();
      const { data, error } = await sessionSupabase
        .from('inventory_items')
        .insert({ ...item, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Ítem agregado', description: 'El ítem de inventario se ha guardado' });
      await invalidate();
      return data;
    } catch (error: any) {
      console.error('Error adding inventory item:', error);
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({ ...updates, last_restocked_at: updates.current_stock !== undefined ? new Date().toISOString() : undefined })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Inventario actualizado' });
      await invalidate();
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      toast({ title: 'Error al actualizar', description: error.message, variant: 'destructive' });
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Ítem eliminado' });
      await invalidate();
    } catch (error: any) {
      console.error('Error deleting inventory item:', error);
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    }
  };

  return {
    inventory: data?.inventory ?? [],
    kpis: data?.kpis ?? null,
    loading: isLoading,
    hasData: data?.hasData ?? false,
    isViewingClient,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    refetch,
  };
};
