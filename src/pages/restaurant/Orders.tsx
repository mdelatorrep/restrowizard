import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrders } from '@/hooks/useOrders';
import { ShoppingBag, Plus, Loader2, CheckCircle } from 'lucide-react';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrdersKPIs } from '@/components/orders/OrdersKPIs';
import { CreateOrderDialog } from '@/components/orders/CreateOrderDialog';
import { DeliveryZonesDialog } from '@/components/orders/DeliveryZonesDialog';

const Orders = () => {
  const { orders, zones, kpis, loading, createOrder, updateOrderStatus, createZone } = useOrders();
  const [activeTab, setActiveTab] = useState('active');

  const activeOrders = (orders || []).filter(o => !['completed', 'cancelled'].includes(o.status || ''));
  const completedOrders = (orders || []).filter(o => ['completed', 'cancelled'].includes(o.status || ''));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">Administra pedidos y domicilios</p>
        </div>
        <div className="flex gap-2">
          <DeliveryZonesDialog zones={zones || []} onCreate={createZone} />
          <CreateOrderDialog onCreate={createOrder} />
        </div>
      </div>

      <OrdersKPIs kpis={kpis} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Activos ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Historial ({completedOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sin pedidos activos</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Los nuevos pedidos aparecerán aquí
                </p>
                <Button disabled variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Usa el botón "Nuevo Pedido"
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map(order => (
                <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sin historial</h3>
                <p className="text-muted-foreground">Los pedidos completados aparecerán aquí</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedOrders.map(order => (
                <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Orders;
