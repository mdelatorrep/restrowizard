import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { Truck, Package, Clock, MapPin, DollarSign, RefreshCw, CheckCircle, XCircle, Timer, Sparkles, Brain, TrendingUp } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useAIAgent } from '@/hooks/useAIAgent';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const Delivery: React.FC = () => {
  const { orders, loading, updateOrderStatus, refetch } = useOrders();
  const { forecastDeliveryDemand, optimizeDelivery, loading: aiLoading } = useAIAgent();
  const [activeTab, setActiveTab] = useState('pending');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Filter delivery orders only
  const deliveryOrders = orders.filter(order => order.order_type === 'delivery');
  
  const pendingOrders = deliveryOrders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const preparingOrders = deliveryOrders.filter(o => o.status === 'preparing');
  const enRouteOrders = deliveryOrders.filter(o => o.status === 'ready');
  const completedOrders = deliveryOrders.filter(o => o.status === 'completed' || o.status === 'delivered');
  const cancelledOrders = deliveryOrders.filter(o => o.status === 'cancelled');

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus);
    toast.success(`Pedido actualizado a: ${getStatusLabel(newStatus)}`);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'En Preparación',
      ready: 'En Camino',
      delivered: 'Entregado',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      confirmed: 'default',
      preparing: 'default',
      ready: 'default',
      delivered: 'default',
      completed: 'default',
      cancelled: 'destructive'
    };
    return variants[status] || 'default';
  };

  // Calculate KPIs
  const todayOrders = deliveryOrders.filter(o => 
    new Date(o.created_at).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgDeliveryTime = 35; // This would be calculated from actual data

  // AI Analysis handler
  const handleAIAnalysis = async () => {
    if (deliveryOrders.length === 0) {
      toast.error('No hay pedidos de delivery para analizar');
      return;
    }
    
    const deliveryData = {
      pedidos_hoy: todayOrders.length,
      ingresos_hoy: todayRevenue,
      tiempo_promedio: avgDeliveryTime,
      pendientes: pendingOrders.length,
      en_preparacion: preparingOrders.length,
      en_camino: enRouteOrders.length,
      completados: completedOrders.length,
      cancelados: cancelledOrders.length,
      pedidos_recientes: deliveryOrders.slice(0, 20).map(o => ({
        hora: new Date(o.created_at).toLocaleTimeString(),
        direccion: o.delivery_address,
        total: o.total,
        estado: o.status
      }))
    };

    const result = await forecastDeliveryDemand(deliveryData);
    
    if (result) {
      setAiInsights(result);
      setShowAIPanel(true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground flex items-center">
            <Truck className="mr-3 text-primary" size={32} />
            Gestión de Domicilios
          </h1>
          <p className="text-muted-foreground font-lato-light">
            Administra y rastrea todos los pedidos de delivery
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleAIAnalysis}
            disabled={aiLoading}
            className="gap-2 border-primary/30 hover:bg-primary/10"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            {aiLoading ? 'Analizando...' : 'Análisis IA'}
          </Button>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* AI Insights Panel */}
      {showAIPanel && (
        <AIInsightsPanel
          title="Análisis de Delivery"
          description="Pronóstico de demanda y optimización de entregas"
          insights={aiInsights}
          loading={aiLoading}
          onAnalyze={handleAIAnalysis}
          onClose={() => setShowAIPanel(false)}
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Hoy</p>
                <p className="text-2xl font-bold">{todayOrders.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas Hoy</p>
                <p className="text-2xl font-bold">${todayRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Proceso</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length + preparingOrders.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
                <p className="text-2xl font-bold">{avgDeliveryTime} min</p>
              </div>
              <Timer className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {deliveryOrders.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-12 w-12" />}
          title="Sin pedidos de delivery"
          description="Los pedidos de domicilio aparecerán aquí cuando tus clientes ordenen desde tu sitio web o app."
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              Pendientes ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="preparing">
              En Preparación ({preparingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="enroute">
              En Camino ({enRouteOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completados ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Orders */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pedidos Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay pedidos pendientes
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                          <TableCell>{order.customer_name || 'Cliente'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {order.delivery_address || 'Sin dirección'}
                            </div>
                          </TableCell>
                          <TableCell>{(order.items as any[])?.length || 0} items</TableCell>
                          <TableCell className="text-right font-bold">${(order.total || 0).toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(order.created_at), 'HH:mm', { locale: es })}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button 
                                size="sm" 
                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                              >
                                Aceptar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preparing Orders */}
          <TabsContent value="preparing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  En Preparación
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preparingOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay pedidos en preparación
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preparingOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                          <TableCell>{order.customer_name || 'Cliente'}</TableCell>
                          <TableCell>{(order.items as any[])?.length || 0} items</TableCell>
                          <TableCell className="text-right font-bold">${(order.total || 0).toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(order.created_at), 'HH:mm', { locale: es })}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              onClick={() => handleStatusUpdate(order.id, 'ready')}
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Enviar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* En Route Orders */}
          <TabsContent value="enroute">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  En Camino
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enRouteOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay pedidos en camino
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enRouteOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                          <TableCell>{order.customer_name || 'Cliente'}</TableCell>
                          <TableCell className="max-w-[250px]">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{order.delivery_address || 'Sin dirección'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold">${(order.total || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleStatusUpdate(order.id, 'delivered')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Entregado
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Orders */}
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Pedidos Completados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completedOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay pedidos completados hoy
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedOrders.slice(0, 20).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                          <TableCell>{order.customer_name || 'Cliente'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{order.delivery_address || '-'}</TableCell>
                          <TableCell className="text-right font-bold">${(order.total || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-600">
                              {getStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(order.created_at), 'HH:mm', { locale: es })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Delivery;
