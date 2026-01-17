import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrders, RestaurantOrder } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingBag, Plus, Loader2, Clock, MapPin, Phone, User,
  ChefHat, Truck, CheckCircle, XCircle, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  preparing: { label: 'Preparando', color: 'bg-orange-100 text-orange-800', icon: ChefHat },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  delivering: { label: 'En Camino', color: 'bg-purple-100 text-purple-800', icon: Truck },
  completed: { label: 'Completado', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  return (
    <Badge className={config.color}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};

const OrderCard = ({ order, onUpdateStatus }: { order: RestaurantOrder; onUpdateStatus: (id: string, status: string) => void }) => {
  const items = Array.isArray(order.items) ? order.items : [];
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Pedido #{order.order_number}</CardTitle>
            <CardDescription>
              {format(new Date(order.created_at!), 'PPp', { locale: es })}
            </CardDescription>
          </div>
          <StatusBadge status={order.status || 'pending'} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {order.customer_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{order.customer_name}</span>
            </div>
          )}
          {order.customer_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{order.customer_phone}</span>
            </div>
          )}
          {order.delivery_address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="line-clamp-1">{order.delivery_address}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <p className="text-sm font-medium mb-2">Items ({items.length})</p>
          <div className="space-y-1">
            {items.slice(0, 3).map((item: { name?: string; quantity?: number }, idx: number) => (
              <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                <span>{item.quantity}x {item.name}</span>
              </div>
            ))}
            {items.length > 3 && (
              <p className="text-xs text-muted-foreground">+{items.length - 3} más</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="font-bold">${order.total.toLocaleString()}</span>
          </div>
          <Select
            value={order.status || 'pending'}
            onValueChange={(value) => onUpdateStatus(order.id, value)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="ready">Listo</SelectItem>
              <SelectItem value="delivering">En Camino</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

const Orders = () => {
  const { orders, zones, kpis, loading, hasData, createOrder, updateOrderStatus, createZone } = useOrders();
  const { toast } = useToast();
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    order_type: 'delivery',
    items: [{ name: '', quantity: 1, price: 0 }],
  });

  const [zoneForm, setZoneForm] = useState({
    zone_name: '',
    delivery_fee: 0,
    min_order: 0,
    estimated_time_minutes: 30,
  });

  const handleCreateOrder = async () => {
    const subtotal = orderForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await createOrder({
      ...orderForm,
      items: orderForm.items,
      subtotal,
      total: subtotal,
      source: 'phone',
    });
    setShowOrderDialog(false);
    setOrderForm({
      customer_name: '',
      customer_phone: '',
      delivery_address: '',
      order_type: 'delivery',
      items: [{ name: '', quantity: 1, price: 0 }],
    });
  };

  const handleCreateZone = async () => {
    if (!zoneForm.zone_name.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }
    await createZone(zoneForm);
    setShowZoneDialog(false);
    setZoneForm({ zone_name: '', delivery_fee: 0, min_order: 0, estimated_time_minutes: 30 });
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    await updateOrderStatus(orderId, status);
  };

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status || ''));
  const completedOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status || ''));

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
          <Dialog open={showZoneDialog} onOpenChange={setShowZoneDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Zonas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gestionar Zonas de Delivery</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {zones.length > 0 && (
                  <div className="space-y-2">
                    {zones.map(zone => (
                      <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{zone.zone_name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${zone.delivery_fee?.toLocaleString()} • Min: ${zone.min_order?.toLocaleString()} • ~{zone.estimated_time_minutes} min
                          </p>
                        </div>
                        <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                          {zone.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t pt-4">
                  <p className="font-medium mb-3">Nueva Zona</p>
                  <div className="grid gap-3">
                    <Input
                      placeholder="Nombre de la zona"
                      value={zoneForm.zone_name}
                      onChange={(e) => setZoneForm({ ...zoneForm, zone_name: e.target.value })}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Tarifa</Label>
                        <Input
                          type="number"
                          value={zoneForm.delivery_fee}
                          onChange={(e) => setZoneForm({ ...zoneForm, delivery_fee: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Mínimo</Label>
                        <Input
                          type="number"
                          value={zoneForm.min_order}
                          onChange={(e) => setZoneForm({ ...zoneForm, min_order: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Tiempo (min)</Label>
                        <Input
                          type="number"
                          value={zoneForm.estimated_time_minutes}
                          onChange={(e) => setZoneForm({ ...zoneForm, estimated_time_minutes: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreateZone}>Agregar Zona</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Pedido Manual</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Cliente</Label>
                    <Input
                      value={orderForm.customer_name}
                      onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                      placeholder="Nombre"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={orderForm.customer_phone}
                      onChange={(e) => setOrderForm({ ...orderForm, customer_phone: e.target.value })}
                      placeholder="3001234567"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de Pedido</Label>
                  <Select
                    value={orderForm.order_type}
                    onValueChange={(value) => setOrderForm({ ...orderForm, order_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine_in">En Mesa</SelectItem>
                      <SelectItem value="takeout">Para Llevar</SelectItem>
                      <SelectItem value="delivery">Domicilio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {orderForm.order_type === 'delivery' && (
                  <div className="grid gap-2">
                    <Label>Dirección de Entrega</Label>
                    <Input
                      value={orderForm.delivery_address}
                      onChange={(e) => setOrderForm({ ...orderForm, delivery_address: e.target.value })}
                      placeholder="Dirección completa"
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Items</Label>
                  {orderForm.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Producto"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...orderForm.items];
                          newItems[idx].name = e.target.value;
                          setOrderForm({ ...orderForm, items: newItems });
                        }}
                        className="col-span-2"
                      />
                      <Input
                        type="number"
                        placeholder="Cant."
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...orderForm.items];
                          newItems[idx].quantity = parseInt(e.target.value) || 1;
                          setOrderForm({ ...orderForm, items: newItems });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Precio"
                        value={item.price}
                        onChange={(e) => {
                          const newItems = [...orderForm.items];
                          newItems[idx].price = parseFloat(e.target.value) || 0;
                          setOrderForm({ ...orderForm, items: newItems });
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOrderForm({
                      ...orderForm,
                      items: [...orderForm.items, { name: '', quantity: 1, price: 0 }]
                    })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Item
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowOrderDialog(false)}>Cancelar</Button>
                <Button onClick={handleCreateOrder}>Crear Pedido</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Hoy</p>
                <p className="text-3xl font-bold">{kpis?.todayOrders || 0}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas Hoy</p>
                <p className="text-3xl font-bold">${kpis?.avgOrderValue?.toLocaleString() || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">{kpis?.pendingOrders || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-3xl font-bold">{kpis?.completionRate || 0}%</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Activos ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Historial ({completedOrders.length})
          </TabsTrigger>
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
                <Button onClick={() => setShowOrderDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Pedido Manual
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={handleUpdateStatus}
                />
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
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Orders;
