import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { Truck, Package, Clock, RefreshCw, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useAIAgent } from '@/hooks/useAIAgent';
import { toast } from 'sonner';
import { DeliveryKPIs } from '@/components/delivery/DeliveryKPIs';
import { PendingDeliveryTable } from '@/components/delivery/PendingDeliveryTable';
import { PreparingDeliveryTable } from '@/components/delivery/PreparingDeliveryTable';
import { EnRouteDeliveryTable } from '@/components/delivery/EnRouteDeliveryTable';
import { CompletedDeliveryTable } from '@/components/delivery/CompletedDeliveryTable';
import { getDeliveryStatusLabel } from '@/components/delivery/deliveryStatusConfig';

const Delivery: React.FC = () => {
  const { orders, loading, updateOrderStatus, refetch } = useOrders();
  const { forecastDeliveryDemand, loading: aiLoading } = useAIAgent();
  const [activeTab, setActiveTab] = useState('pending');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const deliveryOrders = (orders || []).filter(o => o.order_type === 'delivery');
  const pendingOrders = deliveryOrders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const preparingOrders = deliveryOrders.filter(o => o.status === 'preparing');
  const enRouteOrders = deliveryOrders.filter(o => o.status === 'ready');
  const completedOrders = deliveryOrders.filter(o => o.status === 'completed' || o.status === 'delivered');
  const cancelledOrders = deliveryOrders.filter(o => o.status === 'cancelled');

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus);
    toast.success(`Pedido actualizado a: ${getDeliveryStatusLabel(newStatus)}`);
  };

  const todayOrders = deliveryOrders.filter(
    o => new Date(o.created_at).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgDeliveryTime = 35;

  const handleAIAnalysis = async () => {
    if (deliveryOrders.length === 0) {
      toast.error('No hay pedidos de delivery para analizar');
      return;
    }
    const result = await forecastDeliveryDemand({
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
        estado: o.status,
      })),
    });
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
          <Button variant="outline" onClick={handleAIAnalysis} disabled={aiLoading} className="gap-2 border-primary/30 hover:bg-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
            {aiLoading ? 'Analizando...' : 'Análisis IA'}
          </Button>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

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

      <DeliveryKPIs
        todayOrdersCount={todayOrders.length}
        todayRevenue={todayRevenue}
        inProgressCount={pendingOrders.length + preparingOrders.length}
        avgDeliveryTime={avgDeliveryTime}
      />

      {deliveryOrders.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-12 w-12" />}
          title="Sin pedidos de delivery"
          description="Los pedidos de domicilio aparecerán aquí cuando tus clientes ordenen desde tu sitio web o app."
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Pendientes ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="preparing">En Preparación ({preparingOrders.length})</TabsTrigger>
            <TabsTrigger value="enroute">En Camino ({enRouteOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">Completados ({completedOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Pedidos Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingDeliveryTable orders={pendingOrders} onUpdate={handleStatusUpdate} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preparing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />En Preparación</CardTitle>
              </CardHeader>
              <CardContent>
                <PreparingDeliveryTable orders={preparingOrders} onUpdate={handleStatusUpdate} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enroute">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />En Camino</CardTitle>
              </CardHeader>
              <CardContent>
                <EnRouteDeliveryTable orders={enRouteOrders} onUpdate={handleStatusUpdate} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" />Pedidos Completados</CardTitle>
              </CardHeader>
              <CardContent>
                <CompletedDeliveryTable orders={completedOrders} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Delivery;
