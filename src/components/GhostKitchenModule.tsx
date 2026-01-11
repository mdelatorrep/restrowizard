import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useGhostKitchenData } from '@/hooks/useGhostKitchenData';
import { ModuleEmptyState } from '@/components/ui/empty-state';
import { useQueryClient } from '@tanstack/react-query';
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

interface NewBrandFormData {
  brand_name: string;
  cuisine_type: string;
  logo_emoji: string;
}

const GhostKitchenModule = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNewBrandForm, setShowNewBrandForm] = useState(false);
  const [formData, setFormData] = useState<NewBrandFormData>({
    brand_name: '',
    cuisine_type: '',
    logo_emoji: '🍔'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    virtualBrands, 
    aggregatorOrders, 
    productionQueue, 
    kpis, 
    ordersByPlatform,
    hasData, 
    isLoading,
    isViewingClient 
  } = useGhostKitchenData();

  // Map real data to display format
  const displayBrands = virtualBrands.map(b => ({
    id: b.id,
    name: b.brand_name,
    logo: b.brand_logo || '🍴',
    status: b.is_active ? 'active' : 'paused',
    orders_today: aggregatorOrders.filter(o => o.brand_id === b.id).length,
    revenue_today: aggregatorOrders.filter(o => o.brand_id === b.id).reduce((sum, o) => sum + (o.subtotal || 0), 0),
    avg_prep_time: b.avg_preparation_time || 15,
    rating: 4.5,
    cuisine: b.cuisine_type || 'General'
  }));

  const handleCreateBrand = async () => {
    if (!user || !formData.brand_name) {
      toast({
        title: "Error",
        description: "El nombre de la marca es obligatorio",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('virtual_brands')
        .insert({
          user_id: user.id,
          brand_name: formData.brand_name,
          cuisine_type: formData.cuisine_type as any || 'other',
          brand_logo: formData.logo_emoji,
          is_active: true
        });

      if (error) throw error;

      toast({ title: "Marca creada", description: "Tu nueva marca virtual está lista" });
      setShowNewBrandForm(false);
      setFormData({ brand_name: '', cuisine_type: '', logo_emoji: '🍔' });
      queryClient.invalidateQueries({ queryKey: ['virtual-brands'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la marca",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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

  const NewBrandModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Nueva Marca Virtual</CardTitle>
          <CardDescription>Crea una nueva marca para tu ghost kitchen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la Marca *</Label>
            <Input 
              placeholder="Ej: Pizza Express" 
              value={formData.brand_name}
              onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Cocina</Label>
            <Select value={formData.cuisine_type} onValueChange={(v) => setFormData({ ...formData, cuisine_type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="american">Americana</SelectItem>
                <SelectItem value="mexican">Mexicana</SelectItem>
                <SelectItem value="italian">Italiana</SelectItem>
                <SelectItem value="japanese">Japonesa</SelectItem>
                <SelectItem value="chinese">China</SelectItem>
                <SelectItem value="other">Otra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Emoji/Logo</Label>
            <Select value={formData.logo_emoji} onValueChange={(v) => setFormData({ ...formData, logo_emoji: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="🍔">🍔 Hamburguesas</SelectItem>
                <SelectItem value="🍕">🍕 Pizza</SelectItem>
                <SelectItem value="🍣">🍣 Sushi</SelectItem>
                <SelectItem value="🌮">🌮 Tacos</SelectItem>
                <SelectItem value="🍜">🍜 Noodles</SelectItem>
                <SelectItem value="🥗">🥗 Saludable</SelectItem>
                <SelectItem value="🍗">🍗 Pollo</SelectItem>
                <SelectItem value="🍴">🍴 General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowNewBrandForm(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleCreateBrand} disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Marca'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Show empty state if no data
  if (!hasData && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ChefHat className="h-7 w-7 text-primary" />
              Ghost Kitchen Manager
            </h2>
            <p className="text-muted-foreground mt-1">
              Gestiona múltiples marcas virtuales desde una sola cocina
            </p>
          </div>
        </div>

        <ModuleEmptyState
          moduleName="Ghost Kitchen"
          description="Crea marcas virtuales para operar múltiples conceptos desde tu cocina y conecta con agregadores de delivery."
          features={[
            "Gestión de múltiples marcas virtuales",
            "Dashboard unificado de todos los agregadores",
            "Cola de producción en tiempo real",
            "Análisis de comisiones y rentabilidad por plataforma"
          ]}
          onGetStarted={() => setShowNewBrandForm(true)}
        />

        {showNewBrandForm && <NewBrandModal />}
      </div>
    );
  }

  // Chart data
  const revenueByPlatform = {
    labels: Object.keys(ordersByPlatform).length > 0 
      ? Object.keys(ordersByPlatform).map(p => p.replace('_', ' ').toUpperCase())
      : ['Sin datos'],
    datasets: [{
      data: Object.keys(ordersByPlatform).length > 0 
        ? Object.values(ordersByPlatform).map(p => p.revenue)
        : [1],
      backgroundColor: [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))'
      ],
      borderWidth: 0
    }]
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
            {isViewingClient && <Badge variant="outline" className="ml-2">Datos del cliente</Badge>}
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
                <p className="text-2xl font-bold">{kpis.totalOrders}</p>
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
                <p className="text-2xl font-bold">${kpis.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marcas Activas</p>
                <p className="text-2xl font-bold">{displayBrands.filter(b => b.status === 'active').length}</p>
              </div>
              <Store className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Producción</p>
                <p className="text-2xl font-bold">{productionQueue.length}</p>
              </div>
              <Timer className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comisiones</p>
                <p className="text-2xl font-bold text-destructive">-${kpis.commissionPaid.toLocaleString()}</p>
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

            {/* Brands Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de Marcas</CardTitle>
              </CardHeader>
              <CardContent>
                {displayBrands.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay marcas registradas
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayBrands.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{brand.logo}</span>
                          <div>
                            <p className="font-semibold">{brand.name}</p>
                            <p className="text-sm text-muted-foreground">{brand.cuisine}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${brand.revenue_today.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{brand.orders_today} órdenes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              {Object.keys(ordersByPlatform).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de agregadores aún. Las órdenes aparecerán aquí.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.entries(ordersByPlatform).map(([platform, data]) => (
                    <div key={platform} className="p-4 rounded-lg border bg-card">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold capitalize">{platform.replace('_', ' ')}</span>
                        <Badge variant="outline">{data.orders} órdenes</Badge>
                      </div>
                      <p className="text-2xl font-bold">${data.revenue.toLocaleString()}</p>
                      <p className="text-sm text-destructive">
                        Comisión: -${data.commission.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayBrands.map((brand) => (
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
                Cola de Producción
              </CardTitle>
              <CardDescription>
                Gestiona las órdenes activas de todas las marcas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productionQueue.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Sin órdenes en cola</p>
                  <p className="text-sm">Las órdenes nuevas aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {productionQueue.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold">#{order.order_id?.slice(-4) || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{order.brand_id?.slice(0, 6)}</p>
                        </div>
                        <div>
                          <p className="font-medium">{order.item_name} x{order.quantity || 1}</p>
                          <p className="text-sm text-muted-foreground">Estación: {order.station || 'General'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(order.status || 'pending')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
                    labels: displayBrands.map(b => b.name),
                    datasets: [{
                      label: 'Ingresos',
                      data: displayBrands.map(b => b.revenue_today),
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
                  <p className="font-semibold text-destructive">Comisiones pagadas: ${kpis.commissionPaid.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {kpis.totalRevenue > 0 
                      ? `Representa el ${Math.round(kpis.commissionPaid / kpis.totalRevenue * 100)}% de tus ingresos`
                      : 'Sin datos de ingresos'
                    }
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="font-semibold text-green-600">Recomendación IA</p>
                  <p className="text-sm mt-1">
                    Incrementar pedidos directos puede ahorrarte comisiones significativas
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {showNewBrandForm && <NewBrandModal />}
    </div>
  );
};

export default GhostKitchenModule;
