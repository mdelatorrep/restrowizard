import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealtimeTable } from './useRealtimeTable';
import { useToast } from './use-toast';
import { qk } from '@/lib/queryKeys';

export interface RestaurantTable {
  id: string;
  user_id: string;
  table_number: string;
  zone_id: string | null;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'billing' | 'maintenance';
  current_order_id: string | null;
  waiter_id: string | null;
  position_x: number;
  position_y: number;
  shape: 'rectangle' | 'circle' | 'square';
  created_at: string;
  updated_at: string;
}

export const usePOSTables = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tables = [], isLoading: loading } = useQuery({
    queryKey: qk.pos.tables(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<RestaurantTable[]> => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('user_id', user!.id)
        .order('table_number');
      if (error) throw error;
      return (data || []) as RestaurantTable[];
    },
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.pos.tables(user?.id) }),
    [queryClient, user?.id]
  );

  const createTable = async (tableData: {
    table_number: string;
    capacity?: number;
    zone_id?: string;
    shape?: 'rectangle' | 'circle' | 'square';
    position_x?: number;
    position_y?: number;
  }) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert({
          user_id: user.id,
          ...tableData
        })
        .select()
        .single();

      if (error) throw error;

      await invalidate();
      toast({
        title: "Mesa creada",
        description: `Mesa ${tableData.table_number} agregada`
      });

      return data as RestaurantTable;
    } catch (error: any) {
      console.error('Error creating table:', error);
      toast({
        title: "Error al crear mesa",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateTableStatus = async (
    tableId: string,
    status: RestaurantTable['status'],
    orderId?: string | null,
    waiterId?: string | null
  ) => {
    try {
      const updates: Partial<RestaurantTable> = { status };
      if (orderId !== undefined) updates.current_order_id = orderId;
      if (waiterId !== undefined) updates.waiter_id = waiterId;

      const { data, error } = await supabase
        .from('restaurant_tables')
        .update(updates)
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;

      await invalidate();
      return data as RestaurantTable;
    } catch (error: any) {
      console.error('Error updating table:', error);
      toast({
        title: "Error al actualizar mesa",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const assignOrderToTable = async (tableId: string, orderId: string) => {
    return updateTableStatus(tableId, 'occupied', orderId);
  };

  const releaseTable = async (tableId: string) => {
    return updateTableStatus(tableId, 'available', null, null);
  };

  const transferTable = async (fromTableId: string, toTableId: string) => {
    const fromTable = tables.find(t => t.id === fromTableId);
    if (!fromTable?.current_order_id) {
      toast({
        title: "Error",
        description: "La mesa de origen no tiene un pedido activo",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Update the destination table
      await updateTableStatus(toTableId, 'occupied', fromTable.current_order_id, fromTable.waiter_id);

      // Release the source table
      await releaseTable(fromTableId);

      // Update order with new table
      await supabase
        .from('restaurant_orders')
        .update({ table_id: toTableId })
        .eq('id', fromTable.current_order_id);

      await invalidate();

      toast({
        title: "Mesa transferida",
        description: "El pedido ha sido movido a la nueva mesa"
      });

      return true;
    } catch (error: any) {
      console.error('Error transferring table:', error);
      toast({
        title: "Error al transferir",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteTable = async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      await invalidate();
      toast({
        title: "Mesa eliminada"
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting table:', error);
      toast({
        title: "Error al eliminar mesa",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Subscribe to realtime updates -> invalidar la caché compartida
  useRealtimeTable<RestaurantTable>({
    table: 'restaurant_tables',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user?.id,
    onChange: () => { invalidate(); },
  });

  const availableTables = useMemo(() => tables.filter(t => t.status === 'available'), [tables]);
  const occupiedTables = useMemo(() => tables.filter(t => t.status === 'occupied'), [tables]);
  const reservedTables = useMemo(() => tables.filter(t => t.status === 'reserved'), [tables]);

  return {
    tables,
    loading,
    availableTables,
    occupiedTables,
    reservedTables,
    createTable,
    updateTableStatus,
    assignOrderToTable,
    releaseTable,
    transferTable,
    deleteTable,
    refetch: invalidate
  };
};
