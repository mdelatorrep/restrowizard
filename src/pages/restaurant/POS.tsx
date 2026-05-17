import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  Calculator,
  CheckCircle2,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// MenuGrid / CartPanel / Dialog components extracted to src/components/pos/

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

  // Filtered customers
  const filteredCustomers = customers.filter(c => 
    c.customer_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c as any).email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c as any).phone?.includes(customerSearch)
  ).slice(0, 5);

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
        guests_count: 1
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
      
      if (inventoryResult.deductedCount > 0) {
        console.log(`Inventory deducted for ${inventoryResult.deductedCount} items`);
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
      {/* Header */}
      <div className="bg-card border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {hasOpenSession ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Caja Abierta
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Caja Cerrada
              </Badge>
            )}
          </div>
          {currentSession && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="text-sm">
                <span className="text-muted-foreground">Cajero:</span>{' '}
                <span className="font-medium">{currentSession.cashier_name}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Ventas:</span>{' '}
                <span className="font-medium">{currentSession.sales_count}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-medium text-primary">${Number(currentSession.total_sales).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Offline Indicator */}
          {(!isOnline || pendingCount > 0) && (
            <div className="flex items-center gap-2">
              {!isOnline && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
                  {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}
          
          {!hasOpenSession ? (
            <Button size="sm" onClick={() => setOpenSessionDialog(true)}>
              <DollarSign className="h-4 w-4 mr-1" />
              Abrir Caja
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setCloseSessionDialog(true)}>
              <Calculator className="h-4 w-4 mr-1" />
              Cerrar Caja
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col border-r">
          {/* Search & Categories */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={!selectedCategory ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                >
                  Todos
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat || null)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Product Grid */}
          <ScrollArea className="flex-1 p-4">
            {filteredItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay productos disponibles</p>
                <p className="text-sm">Agrega productos desde el módulo de Menús</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredItems.map(item => (
                  <Card
                    key={item.id}
                    className={cn(
                      "cursor-pointer hover:border-primary transition-colors",
                      !hasOpenSession && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => handleAddToCart(item)}
                  >
                    <CardContent className="p-3">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-20 object-cover rounded mb-2"
                        />
                      )}
                      <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                      <p className="text-primary font-bold mt-1">
                        ${Number(item.price).toLocaleString()}
                      </p>
                      {item.category && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {item.category}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-96 flex flex-col bg-card">
          {/* Table & Customer Selection */}
          <div className="p-4 border-b space-y-3">
            {/* Table Selection */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-start"
                onClick={() => {}}
              >
                <Table2 className="h-4 w-4 mr-2" />
                {selectedTable 
                  ? `Mesa ${tables.find(t => t.id === selectedTable)?.table_number}`
                  : 'Sin mesa'
                }
              </Button>
              {selectedTable && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedTable(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Customer Search */}
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="pl-10"
              />
              {customerSearch && filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-popover border rounded-lg shadow-lg mt-1">
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      className="w-full px-4 py-2 text-left hover:bg-accent flex items-center justify-between"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch('');
                      }}
                    >
                      <div>
                        <p className="font-medium">{c.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{(c as any).phone || (c as any).email}</p>
                      </div>
                      <Badge variant="secondary">{(c as any).lifetime_points || 0} pts</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="flex items-center justify-between bg-accent/50 rounded-lg px-3 py-2">
                <div>
                  <p className="font-medium text-sm">{selectedCustomer.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCustomer.total_points} puntos</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 p-4">
            {items.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Carrito vacío</p>
                <p className="text-sm">Agrega productos para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-accent/30 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ${item.price.toLocaleString()} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-bold w-20 text-right">
                      ${(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Cart Footer */}
          <div className="p-4 border-t space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA</span>
                  <span>${taxAmount.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${total.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={clearCart}
                disabled={items.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
              <Button
                onClick={() => setPaymentDialog(true)}
                disabled={items.length === 0 || !hasOpenSession}
                className="bg-primary"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Cobrar
              </Button>
            </div>

            {/* Offline Sync Panel */}
            {(!isOnline || pendingCount > 0) && (
              <div className="mt-3">
                <OfflineIndicator
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
            )}
          </div>
        </div>
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
