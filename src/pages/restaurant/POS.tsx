import { useState, useEffect } from 'react';
import { usePOSSession } from '@/hooks/usePOSSession';
import { usePOSCart } from '@/hooks/usePOSCart';
import { usePOSTables } from '@/hooks/usePOSTables';
import { usePOSPayment, PaymentSplit } from '@/hooks/usePOSPayment';
import { usePOSDiscounts } from '@/hooks/usePOSDiscounts';
import { useMenuItemsData } from '@/hooks/useMenuItemsData';
import { useLoyaltyData } from '@/hooks/useLoyaltyData';
import { useInventoryDeduction } from '@/hooks/useInventoryDeduction';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { OpenSessionDialog } from '@/components/pos/OpenSessionDialog';
import { CloseSessionDialog } from '@/components/pos/CloseSessionDialog';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { POSHeader } from '@/components/pos/POSHeader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// MenuGrid / CartPanel / POSHeader / Dialog components extracted to src/components/pos/

// Main POS Component
const POS = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentSession, hasOpenSession, openSession, closeSession, loading: sessionLoading } = usePOSSession();
  const { cart, items, addItem, removeItem, updateItemQuantity, clearCart, total, subtotal, taxAmount } = usePOSCart(0);
  const { tables, updateTableStatus, releaseTable } = usePOSTables();
  const { processPayment } = usePOSPayment();
  const { discounts, applyDiscount: validateDiscount } = usePOSDiscounts();
  const { menuItems, loading: menuLoading } = useMenuItemsData();
  const { customers, awardPoints } = useLoyaltyData();
  const { deductInventoryForOrder } = useInventoryDeduction();
  
  // Offline sync
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncAt,
    syncErrors,
    saveSaleOffline,
    syncPendingSales,
    retryFailedSales,
    getPendingSales,
    clearPendingSales,
    cacheProductsForOffline
  } = useOfflineSync();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [openSessionDialog, setOpenSessionDialog] = useState(false);
  const [closeSessionDialog, setCloseSessionDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  // Cache products for offline use when they load
  useEffect(() => {
    if (menuItems.length > 0) {
      cacheProductsForOffline(menuItems);
    }
  }, [menuItems, cacheProductsForOffline]);

  // Get unique categories
  const categories = [...new Set(menuItems.filter(i => i.category).map(i => i.category))];

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.is_available;
  });




  const handleAddToCart = (item: any) => {
    addItem({
      menu_item_id: item.id,
      name: item.name,
      price: Number(item.price)
    });
  };

  const handleOpenSession = async (name: string, amount: number) => {
    await openSession(name, amount);
  };

  const handleCloseSession = async (amount: number, notes?: string) => {
    await closeSession(amount, notes);
  };

  const handlePayment = async (payments: PaymentSplit[], tipAmount: number) => {
    if (!user?.id || items.length === 0) return;

    const saleId = `sale-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const saleData = {
      id: saleId,
      tableId: selectedTable,
      tableName: selectedTable ? tables.find(t => t.id === selectedTable)?.table_number?.toString() : undefined,
      items: items.map(i => ({
        id: i.menu_item_id,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      })),
      subtotal: subtotal,
      discountAmount: 0,
      taxAmount: taxAmount,
      tipAmount: tipAmount,
      total: total + tipAmount,
      payments: payments.map(p => ({
        methodId: p.method_id,
        methodName: p.method_name,
        amount: p.amount
      })),
      customerName: selectedCustomer?.customer_name,
      createdAt: new Date().toISOString()
    };

    // If offline, save locally
    if (!isOnline) {
      const saved = await saveSaleOffline(saleData);
      if (saved) {
        // Clear cart and reset
        clearCart();
        setSelectedCustomer(null);
        if (selectedTable) {
          setSelectedTable(null);
        }
        toast({
          title: "Venta guardada offline",
          description: "Se sincronizará cuando haya conexión"
        });
      }
      return;
    }

    try {
      // TK-02: persistir el método de pago principal (categoría canónica) en la orden.
      // Si hay pago dividido, se usa el método con mayor monto como principal y se
      // guarda el desglose completo en metadata.payments. Esto evita que Reportes
      // muestre "Otros 100%" cuando se cobró en efectivo / tarjeta / etc.
      const canonical = (name: string): string => {
        const n = (name || '').toLowerCase();
        if (n.includes('efectivo') || n.includes('cash')) return 'efectivo';
        if (n.includes('nequi')) return 'nequi';
        if (n.includes('davi')) return 'daviplata';
        if (n.includes('transfer')) return 'transferencia';
        if (n.includes('crédito') || n.includes('credito') || n.includes('credit')) return 'tarjeta_credito';
        if (n.includes('débito') || n.includes('debito') || n.includes('debit') || n.includes('tarjeta')) return 'tarjeta_debito';
        if (n.includes('qr')) return 'qr';
        return 'otro';
      };
      const principal = [...payments].sort((a, b) => b.amount - a.amount)[0];
      const paymentMethod = principal ? canonical(principal.method_name) : 'otro';

      // Create order
      const orderPayload: any = {
        session_id: currentSession?.id,
        table_id: selectedTable,
        items: items.map(i => ({
          menu_item_id: i.menu_item_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity
        })),
        subtotal: subtotal,
        tax_amount: taxAmount,
        tip_amount: tipAmount,
        total: total + tipAmount,
        status: 'completed',
        order_type: selectedTable ? 'dine_in' : 'takeout',
        is_pos_order: true,
        guests_count: 1,
        payment_method: paymentMethod,
        payment_status: 'paid',
      };

      const { data: order, error: orderError } = await supabase
        .from('restaurant_orders')
        .insert(orderPayload)
        .select()
        .single();

      if (orderError) throw orderError;

      // Process payment transactions
      await processPayment(order.id, payments, tipAmount);

      // Deduct inventory automatically based on recipes
      const inventoryResult = await deductInventoryForOrder(order.id, items.map(i => ({
        menu_item_id: i.menu_item_id,
        name: i.name,
        quantity: i.quantity
      })));

      if (inventoryResult.deductedCount === 0 && inventoryResult.missingRecipeCount > 0) {
        toast({
          title: 'Sin descuento de inventario',
          description: `${inventoryResult.missingRecipeCount} platillo(s) no tienen receta vinculada. Vincula una receta para costear y descontar stock.`,
        });
      }

      // Award loyalty points if customer selected
      if (selectedCustomer) {
        const pointsToAward = Math.floor(total / 1000); // 1 point per 1000 pesos
        if (pointsToAward > 0) {
          await awardPoints(selectedCustomer.id, pointsToAward, 'Compra en POS');
        }
      }

      // Release table if assigned
      if (selectedTable) {
        await releaseTable(selectedTable);
        setSelectedTable(null);
      }

      // Clear cart
      clearCart();
      setSelectedCustomer(null);

      toast({
        title: "¡Venta completada!",
        description: `Orden #${order.order_number} - $${(total + tipAmount).toLocaleString()}`
      });

    } catch (error: any) {
      console.error('Error completing sale:', error);
      
      // If network error, save offline
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || !navigator.onLine) {
        const saved = await saveSaleOffline(saleData);
        if (saved) {
          clearCart();
          setSelectedCustomer(null);
          if (selectedTable) {
            setSelectedTable(null);
          }
          toast({
            title: "Guardado offline",
            description: "La venta se sincronizará cuando haya conexión"
          });
          return;
        }
      }
      
      toast({
        title: "Error al completar venta",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Auto-open session dialog if no session
  useEffect(() => {
    if (!sessionLoading && !hasOpenSession) {
      setOpenSessionDialog(true);
    }
  }, [sessionLoading, hasOpenSession]);

  if (sessionLoading || menuLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <POSHeader
        hasOpenSession={hasOpenSession}
        currentSession={currentSession}
        isOnline={isOnline}
        pendingCount={pendingCount}
        onOpenSession={() => setOpenSessionDialog(true)}
        onCloseSession={() => setCloseSessionDialog(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <MenuGrid
          items={filteredItems}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddToCart={handleAddToCart}
          disabled={!hasOpenSession}
        />

        <CartPanel
          items={items}
          subtotal={subtotal}
          taxAmount={taxAmount}
          total={total}
          hasOpenSession={hasOpenSession}
          tables={tables}
          selectedTable={selectedTable}
          onSelectTable={setSelectedTable}
          customers={customers}
          customerSearch={customerSearch}
          onCustomerSearchChange={setCustomerSearch}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          onUpdateQty={updateItemQuantity}
          onRemove={removeItem}
          onClear={clearCart}
          onCheckout={() => setPaymentDialog(true)}
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingCount={pendingCount}
          lastSyncAt={lastSyncAt}
          syncErrors={syncErrors}
          onSync={syncPendingSales}
          onRetryFailed={retryFailedSales}
          onClearPending={clearPendingSales}
          getPendingSales={getPendingSales}
        />
      </div>

      {/* Dialogs */}
      <OpenSessionDialog
        open={openSessionDialog}
        onOpenChange={setOpenSessionDialog}
        onOpen={handleOpenSession}
      />

      <CloseSessionDialog
        open={closeSessionDialog}
        onOpenChange={setCloseSessionDialog}
        session={currentSession}
        onClose={handleCloseSession}
      />

      <PaymentDialog
        open={paymentDialog}
        onOpenChange={setPaymentDialog}
        total={total}
        onComplete={handlePayment}
      />
    </div>
  );
};

export default POS;
