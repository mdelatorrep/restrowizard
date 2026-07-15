import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineStorage, PendingSale } from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  syncErrors: string[];
}

export const useOfflineSync = () => {
  const { user } = useAuth();
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    syncErrors: []
  });
  
  const syncInProgress = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    offlineStorage.init().catch(console.error);
    updatePendingCount();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored');
      setState(prev => ({ ...prev, isOnline: true }));
      toast.success('Conexión restaurada', {
        description: 'Sincronizando ventas pendientes...'
      });
      syncPendingSales();
    };

    const handleOffline = () => {
      console.log('📴 Connection lost');
      setState(prev => ({ ...prev, isOnline: false }));
      toast.warning('Sin conexión', {
        description: 'Las ventas se guardarán localmente'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineStorage.getPendingSalesCount();
      setState(prev => ({ ...prev, pendingCount: count }));
    } catch (error) {
      console.error('Error getting pending count:', error);
    }
  }, []);

  const saveSaleOffline = useCallback(async (saleData: Omit<PendingSale, 'syncStatus' | 'retryCount'>) => {
    try {
      await offlineStorage.addPendingSale(saleData);
      await updatePendingCount();
      
      toast.info('Venta guardada offline', {
        description: 'Se sincronizará cuando haya conexión'
      });
      
      return true;
    } catch (error) {
      console.error('Error saving sale offline:', error);
      toast.error('Error al guardar venta offline');
      return false;
    }
  }, [updatePendingCount]);

  const syncSingleSale = useCallback(async (sale: PendingSale): Promise<boolean> => {
    if (!user) return false;

    try {
      // Mark as syncing
      await offlineStorage.updatePendingSale(sale.id, { syncStatus: 'syncing' });

      // Create order if not exists
      let orderId = sale.orderId;
      
      if (!orderId) {
        // B-36: la línea debe llevar `name` y `price` (forma canónica que leen los
        // reportes); antes se perdía el nombre y el precio iba como `unit_price`.
        const orderItems = sale.items.map(item => ({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes || null
        }));

        const orderPayload: any = {
          // B-36: `user_id` es NOT NULL — sin esto TODA sincronización offline
          // fallaba y la venta moría en IndexedDB tras 3 reintentos.
          user_id: user.id,
          table_id: sale.tableId,
          items: orderItems,
          subtotal: sale.subtotal,
          discount_amount: sale.discountAmount,
          tax_amount: sale.taxAmount,
          tip_amount: sale.tipAmount,
          total: sale.total,
          status: 'completed',
          payment_status: 'paid',
          customer_name: sale.customerName,
          // B-36: `order_number` es integer con secuencia; mandarle "OFF-xxx"
          // reventaba el insert. Se deja que la secuencia lo asigne.
          // B-21: la venta offline nace en caja -> mismo canal que el POS.
          sales_channel: 'pos',
          is_pos_order: true,
          created_at: sale.createdAt,
        };

        const { data: orderData, error: orderError } = await supabase
          .from('restaurant_orders')
          .insert(orderPayload)
          .select('id')
          .single();

        if (orderError) throw orderError;
        orderId = orderData.id;
      }

      // Record transactions for each payment
      for (const payment of sale.payments) {
        const transactionPayload: any = {
          order_id: orderId,
          payment_method_id: payment.methodId,
          amount: payment.amount,
          transaction_type: 'sale'
        };
        await supabase.from('pos_transactions').insert(transactionPayload);
      }

      // Delete from pending
      await offlineStorage.deletePendingSale(sale.id);
      
      console.log('✅ Sale synced:', sale.id);
      return true;
    } catch (error: any) {
      console.error('❌ Error syncing sale:', sale.id, error);
      
      const retryCount = sale.retryCount + 1;
      await offlineStorage.updatePendingSale(sale.id, {
        syncStatus: retryCount >= 3 ? 'failed' : 'pending',
        retryCount,
        lastError: error.message
      });
      
      return false;
    }
  }, [user]);

  const syncPendingSales = useCallback(async () => {
    if (!state.isOnline || syncInProgress.current || !user) {
      return;
    }

    syncInProgress.current = true;
    setState(prev => ({ ...prev, isSyncing: true, syncErrors: [] }));

    try {
      const pendingSales = await offlineStorage.getPendingSalesByStatus('pending');
      
      if (pendingSales.length === 0) {
        setState(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncAt: new Date()
        }));
        syncInProgress.current = false;
        return;
      }

      console.log(`🔄 Syncing ${pendingSales.length} pending sales...`);
      
      const errors: string[] = [];
      let successCount = 0;

      for (const sale of pendingSales) {
        const success = await syncSingleSale(sale);
        if (success) {
          successCount++;
        } else {
          errors.push(`Venta ${sale.id.slice(0, 8)}... falló`);
        }
      }

      await updatePendingCount();

      if (successCount > 0) {
        toast.success(`${successCount} venta(s) sincronizada(s)`, {
          description: errors.length > 0 ? `${errors.length} con errores` : undefined
        });
      }

      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        syncErrors: errors
      }));

      // Retry failed sales after delay
      const failedSales = await offlineStorage.getPendingSalesByStatus('pending');
      if (failedSales.length > 0) {
        retryTimeoutRef.current = setTimeout(() => {
          syncPendingSales();
        }, 30000); // Retry after 30 seconds
      }
    } catch (error) {
      console.error('Error during sync:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
    } finally {
      syncInProgress.current = false;
    }
  }, [state.isOnline, user, syncSingleSale, updatePendingCount]);

  const retryFailedSales = useCallback(async () => {
    const failedSales = await offlineStorage.getPendingSalesByStatus('failed');
    
    for (const sale of failedSales) {
      await offlineStorage.updatePendingSale(sale.id, {
        syncStatus: 'pending',
        retryCount: 0
      });
    }
    
    await updatePendingCount();
    syncPendingSales();
  }, [syncPendingSales, updatePendingCount]);

  const getPendingSales = useCallback(async () => {
    return offlineStorage.getPendingSales();
  }, []);

  const clearPendingSales = useCallback(async () => {
    await offlineStorage.clearAllData();
    await updatePendingCount();
    toast.info('Datos offline eliminados');
  }, [updatePendingCount]);

  // Cache products for offline use
  const cacheProductsForOffline = useCallback(async (products: any[]) => {
    await offlineStorage.cacheProducts(products);
  }, []);

  const getCachedProducts = useCallback(async () => {
    return offlineStorage.getCachedProducts();
  }, []);

  // Cache tables for offline use
  const cacheTablesForOffline = useCallback(async (tables: any[]) => {
    await offlineStorage.cacheTables(tables);
  }, []);

  const getCachedTables = useCallback(async () => {
    return offlineStorage.getCachedTables();
  }, []);

  // Force sync when coming back online
  useEffect(() => {
    if (state.isOnline && state.pendingCount > 0 && !state.isSyncing) {
      syncPendingSales();
    }
  }, [state.isOnline, state.pendingCount, state.isSyncing, syncPendingSales]);

  return {
    ...state,
    saveSaleOffline,
    syncPendingSales,
    retryFailedSales,
    getPendingSales,
    clearPendingSales,
    cacheProductsForOffline,
    getCachedProducts,
    cacheTablesForOffline,
    getCachedTables,
    updatePendingCount
  };
};
