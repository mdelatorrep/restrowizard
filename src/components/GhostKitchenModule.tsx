import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  ChefHat,
  Store,
  Package,
  TrendingUp,
  Clock,
  Smartphone,
  Plus,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Sparkles,
  BarChart3,
  Timer
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Mock data
const mockGhostKitchenData = {
  brands: [
    { 
      id: 1, 
      name: 'Burger Lab', 
      logo: '🍔', 
      status: 'active',
      orders_today: 45,
      revenue_today: 8250,
      avg_prep_time: 12,
      rating: 4.7,
      platform: 'rappi'
    },
    { 
      id: 2, 
      name: 'Sushi Express', 
      logo: '🍣', 
      status: 'active',
      orders_today: 32,
      revenue_today: 9600,
      avg_prep_time: 18,
      rating: 4.8,
      platform: 'uber_eats'
    },
    { 
      id: 3, 
      name: 'Taco Loco', 
      logo: '🌮', 
      status: 'paused',
      orders_today: 0,
      revenue_today: 0,
      avg_prep_time: 8,
      rating: 4.5,
      platform: 'didi_food'
    }
  ],
  aggregators: [
    { name: 'Rappi', orders: 156, revenue: 28400, commission: 4260, color: 'hsl(var(--chart-1))' },
    { name: 'Uber Eats', orders: 98, revenue: 21200, commission: 6360, color: 'hsl(var(--chart-2))' },
    { name: 'DiDi Food', orders: 67, revenue: 12800, commission: 2560, color: 'hsl(var(--chart-3))' },
    { name: 'Directo', orders: 34, revenue: 8900, commission: 0, color: 'hsl(var(--chart-4))' }
  ],
  productionQueue: [
    { id: 1, order: '#4521', brand: 'Burger Lab', items: '2x Smash Burger, 1x Papas', status: 'cooking', timer: 4, station: 'Parrilla' },
    { id: 2, order: '#4522', brand: 'Sushi Express', items: '1x Roll California, 1x Nigiri Mix', status: 'preparing', timer: 8, station: 'Sushi' },
    { id: 3, order: '#4523', brand: 'Burger Lab', items: '1x Chicken Burger', status: 'pending', timer: 0, station: 'Parrilla' },
    { id: 4, order: '#4524', brand: 'Sushi Express', items: '2x Roll Spicy Tuna', status: 'ready', timer: 0, station: 'Sushi' }
  ],
  hourlyOrders: [
    { hour: '12:00', orders: 12, revenue: 2400 },
    { hour: '13:00', orders: 28, revenue: 5600 },
    { hour: '14:00', orders: 22, revenue: 4400 },
    { hour: '15:00', orders: 8, revenue: 1600 },
    { hour: '16:00', orders: 5, revenue: 1000 },
    { hour: '17:00', orders: 15, revenue: 3000 },
    { hour: '18:00', orders: 35, revenue: 7000 },
    { hour: '19:00', orders: 42, revenue: 8400 },
    { hour: '20:00', orders: 38, revenue: 7600 }
  ],
  kpis: {
    totalOrders: 355,
    totalRevenue: 71300,
    avgPrepTime: 14,
    onTimeRate: 92,
    commissionPaid: 13180
  }
};

const GhostKitchenModule = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [productionQueue, setProductionQueue] = useState(mockGhostKitchenData.productionQueue);
  const [showNewBrandForm, setShowNewBrandForm] = useState(false);

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    setProductionQueue(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    toast({
      title: "Estado actualizado",
      description: `Orden actualizada a: ${newStatus}`,
    });
  };

  const revenueByPlatform = {
    labels: mockGhostKitchenData.aggregators.map(a => a.name),
    datasets: [{
      data: mockGhostKitchenData.aggregators.map(a => a.revenue),
      backgroundColor: mockGhostKitchenData.aggregators.map(a => a.color),
      borderWidth: 0
    }]
  };

  const hourlyChart = {
    labels: mockGhostKitchenData.hourlyOrders.map(h => h.hour),
    datasets: [
      {
        label: 'Órdenes',
        data: mockGhostKitchenData.hourlyOrders.map(h => h.orders),
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Ingresos ($)',
        data: mockGhostKitchenData.hourlyOrders.map(h => h.revenue),
        borderColor: 'hsl(var(--chart-2))',
        backgroundColor: 'transparent',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cooking':
        return <Badge className="bg-orange-500">Cocinando</Badge>;
      case 'preparing':
        return <Badge className="bg-blue-500">Preparando</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'ready':
        return <Badge className="bg-green-500">Listo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-primary" />
            Ghost Kitchen Manager
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestiona múltiples marcas virtuales desde una sola cocina
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewBrandForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Marca
          </Button>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Optimizar Producción
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Órdenes Hoy</p>
                <p className="text-2xl font-bold">{mockGhostKitchenData.kpis.totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Hoy</p>
                <p className="text-2xl font-bold">${mockGhostKitchenData.kpis.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
                <p className="text-2xl font-bold">{mockGhostKitchenData.kpis.avgPrepTime} min</p>
              </div>
              <Timer className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Tiempo</p>
                <p className="text-2xl font-bold">{mockGhostKitchenData.kpis.onTimeRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comisiones</p>
                <p className="text-2xl font-bold text-destructive">-${mockGhostKitchenData.kpis.commissionPaid.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="brands">Marcas</TabsTrigger>
          <TabsTrigger value="production">Producción</TabsTrigger>
          <TabsTrigger value="analytics">Analítica</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue by Platform */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ingresos por Plataforma</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-64 h-64">
                  <Doughnut 
                    data={revenueByPlatform}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: 'bottom' } }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hourly Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rendimiento por Hora</CardTitle>
              </CardHeader>
              <CardContent>
                <Line 
                  data={hourlyChart}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } },
                    scales: {
                      y: { 
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'Órdenes' }
                      },
                      y1: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: 'Ingresos ($)' },
                        grid: { drawOnChartArea: false }
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Aggregator Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Rendimiento por Agregador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {mockGhostKitchenData.aggregators.map((agg) => (
                  <div key={agg.name} className="p-4 rounded-lg border bg-card">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{agg.name}</span>
                      <Badge variant="outline">{agg.orders} órdenes</Badge>
                    </div>
                    <p className="text-2xl font-bold">${agg.revenue.toLocaleString()}</p>
                    <p className="text-sm text-destructive">
                      Comisión: -${agg.commission.toLocaleString()} ({Math.round(agg.commission / agg.revenue * 100)}%)
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockGhostKitchenData.brands.map((brand) => (
              <Card key={brand.id} className={brand.status === 'paused' ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{brand.logo}</span>
                      <div>
                        <CardTitle className="text-lg">{brand.name}</CardTitle>
                        <Badge variant={brand.status === 'active' ? 'default' : 'secondary'}>
                          {brand.status === 'active' ? 'Activa' : 'Pausada'}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      {brand.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Órdenes Hoy</p>
                      <p className="text-xl font-bold">{brand.orders_today}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ingresos</p>
                      <p className="text-xl font-bold">${brand.revenue_today.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {brand.avg_prep_time} min prep
                    </span>
                    <span className="flex items-center gap-1">
                      ⭐ {brand.rating}
                    </span>
                  </div>
                  <Badge variant="outline" className="w-full justify-center">
                    {brand.platform.replace('_', ' ').toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}

            {/* Add New Brand Card */}
            <Card className="border-dashed flex items-center justify-center min-h-[250px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowNewBrandForm(true)}>
              <div className="text-center">
                <Plus className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 font-medium">Agregar Nueva Marca</p>
                <p className="text-sm text-muted-foreground">Crea una marca virtual</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Cola de Producción en Tiempo Real
              </CardTitle>
              <CardDescription>
                Gestiona las órdenes activas de todas las marcas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productionQueue.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold">{order.order}</p>
                        <p className="text-xs text-muted-foreground">{order.brand}</p>
                      </div>
                      <div>
                        <p className="font-medium">{order.items}</p>
                        <p className="text-sm text-muted-foreground">Estación: {order.station}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {order.timer > 0 && (
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{order.timer}</p>
                          <p className="text-xs text-muted-foreground">min</p>
                        </div>
                      )}
                      {getStatusBadge(order.status)}
                      <div className="flex gap-1">
                        {order.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                            Iniciar
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, 'cooking')}>
                            Cocinar
                          </Button>
                        )}
                        {order.status === 'cooking' && (
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, 'ready')}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Listo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Station Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🔥 Estación Parrilla</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold">2</p>
                  <p className="text-muted-foreground">órdenes activas</p>
                </div>
                <Progress value={60} className="mt-4" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🍣 Estación Sushi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold">2</p>
                  <p className="text-muted-foreground">órdenes activas</p>
                </div>
                <Progress value={80} className="mt-4" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">📦 Empaque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold">1</p>
                  <p className="text-muted-foreground">listo para entrega</p>
                </div>
                <Progress value={20} className="mt-4" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rentabilidad por Marca</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar 
                  data={{
                    labels: mockGhostKitchenData.brands.map(b => b.name),
                    datasets: [{
                      label: 'Ingresos',
                      data: mockGhostKitchenData.brands.map(b => b.revenue_today),
                      backgroundColor: 'hsl(var(--primary))',
                      borderRadius: 8
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } }
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análisis de Comisiones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="font-semibold text-destructive">Comisiones este mes: ${mockGhostKitchenData.kpis.commissionPaid.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Representa el {Math.round(mockGhostKitchenData.kpis.commissionPaid / mockGhostKitchenData.kpis.totalRevenue * 100)}% de tus ingresos
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="font-semibold text-green-600">Recomendación IA</p>
                  <p className="text-sm mt-1">
                    Incrementar pedidos directos un 20% ahorraría ~$2,500/mes en comisiones
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Brand Form Modal */}
      {showNewBrandForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Nueva Marca Virtual</CardTitle>
              <CardDescription>Crea una nueva marca para tu ghost kitchen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre de la Marca</Label>
                <Input placeholder="Ej: Pizza Express" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Cocina</Label>
                <Input placeholder="Ej: Italiana, Mexicana, etc." />
              </div>
              <div className="space-y-2">
                <Label>Plataforma Principal</Label>
                <Input placeholder="Ej: Rappi, Uber Eats" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowNewBrandForm(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={() => {
                  toast({ title: "Marca creada", description: "Tu nueva marca virtual está lista" });
                  setShowNewBrandForm(false);
                }}>
                  Crear Marca
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GhostKitchenModule;
