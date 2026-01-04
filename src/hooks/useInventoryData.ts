import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from './useDataUserId';
import { useToast } from './use-toast';

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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [kpis, setKpis] = useState<InventoryKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchInventory = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .order('item_name');

      if (error) throw error;

      setInventory(data || []);
      setHasData((data?.length || 0) > 0);

      // Calculate KPIs
      if (data && data.length > 0) {
        const totalValue = data.reduce((sum, item) => 
          sum + (item.current_stock * Number(item.unit_cost || 0)), 0);

        const lowStockItems = data.filter(item => 
          item.reorder_point && item.current_stock <= Number(item.reorder_point) && item.current_stock > 0);

        const outOfStockItems = data.filter(item => item.current_stock <= 0);

        const categoryBreakdown: Record<string, number> = {};
        data.forEach(item => {
          const category = item.category || 'General';
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
        });

        setKpis({
          totalItems: data.length,
          totalValue,
          lowStockItems,
          outOfStockItems,
          categoryBreakdown,
          averageStockDays: 14 // This would need historical data to calculate properly
        });
      } else {
        setKpis(null);
      }
    } catch (error: any) {
      console.error('Error fetching inventory data:', error);
      toast({
        title: "Error al cargar inventario",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          ...item,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ítem agregado",
        description: "El ítem de inventario se ha guardado"
      });

      await fetchInventory();
      return data;
    } catch (error: any) {
      console.error('Error adding inventory item:', error);
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          ...updates,
          last_restocked_at: updates.current_stock !== undefined ? new Date().toISOString() : undefined
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Inventario actualizado"
      });

      await fetchInventory();
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Ítem eliminado"
      });

      await fetchInventory();
    } catch (error: any) {
      console.error('Error deleting inventory item:', error);
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [userId]);

  return {
    inventory,
    kpis,
    loading,
    hasData,
    isViewingClient,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    refetch: fetchInventory
  };
};
