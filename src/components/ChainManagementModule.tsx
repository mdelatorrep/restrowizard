import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  MapPin,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  ClipboardCheck,
  ArrowRightLeft,
  Plus,
  Eye,
  BarChart3,
  Star,
  AlertCircle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Mock data for chain management
const mockChainData = {
  chain: {
    name: 'Taco Supreme',
    logo: '🌮',
    totalLocations: 12,
    activeLocations: 11,
    totalRevenue: 4850000,
    avgRating: 4.6,
    founded: 2018
  },
  locations: [
    { id: 1, name: 'Polanco', type: 'flagship', revenue: 680000, rating: 4.8, staff: 25, status: 'excellent', compliance: 98 },
    { id: 2, name: 'Roma Norte', type: 'standard', revenue: 520000, rating: 4.7, staff: 18, status: 'good', compliance: 95 },
    { id: 3, name: 'Condesa', type: 'standard', revenue: 490000, rating: 4.6, staff: 16, status: 'good', compliance: 92 },
    { id: 4, name: 'Santa Fe', type: 'express', revenue: 380000, rating: 4.5, staff: 12, status: 'attention', compliance: 85 },
    { id: 5, name: 'Coyoacán', type: 'standard', revenue: 450000, rating: 4.4, staff: 15, status: 'good', compliance: 90 },
    { id: 6, name: 'Reforma', type: 'ghost_kitchen', revenue: 280000, rating: 4.3, staff: 8, status: 'attention', compliance: 88 }
  ],
  pendingTransfers: [
    { id: 1, from: 'Polanco', to: 'Santa Fe', items: 'Carne (50kg), Tortillas (200u)', value: 12500, status: 'pending' },
    { id: 2, from: 'Roma Norte', to: 'Reforma', items: 'Salsa Verde (20L), Queso (15kg)', value: 8200, status: 'in_transit' }
  ],
  complianceItems: [
    { id: 1, name: 'Limpieza de cocina', frequency: 'daily', lastCheck: '2024-01-14', avgScore: 94 },
    { id: 2, name: 'Inventario semanal', frequency: 'weekly', lastCheck: '2024-01-12', avgScore: 88 },
    { id: 3, name: 'Capacitación HACCP', frequency: 'monthly', lastCheck: '2024-01-01', avgScore: 91 },
    { id: 4, name: 'Auditoría de calidad', frequency: 'quarterly', lastCheck: '2023-12-15', avgScore: 86 }
  ],
  performanceChart: {
    labels: ['Polanco', 'Roma', 'Condesa', 'Santa Fe', 'Coyoacán', 'Reforma'],
    datasets: [
      {
        label: 'Ingresos ($k)',
        data: [680, 520, 490, 380, 450, 280],
        backgroundColor: 'hsl(var(--primary))',
        borderRadius: 8
      }
    ]
  },
  trendChart: {
    labels: ['Oct', 'Nov', 'Dic', 'Ene'],
    datasets: [
      {
        label: 'Polanco',
        data: [620, 650, 720, 680],
        borderColor: 'hsl(var(--chart-1))',
        tension: 0.4
      },
      {
        label: 'Roma Norte',
        data: [480, 500, 550, 520],
        borderColor: 'hsl(var(--chart-2))',
        tension: 0.4
      },
      {
        label: 'Santa Fe',
        data: [350, 360, 400, 380],
        borderColor: 'hsl(var(--chart-3))',
        tension: 0.4
      }
    ]
  }
};

const ChainManagementModule = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-500">Excelente</Badge>;
      case 'good':
        return <Badge className="bg-blue-500">Bueno</Badge>;
      case 'attention':
        return <Badge className="bg-yellow-500">Atención</Badge>;
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'flagship':
        return <Badge variant="outline" className="border-primary text-primary">Flagship</Badge>;
      case 'express':
        return <Badge variant="outline">Express</Badge>;
      case 'ghost_kitchen':
        return <Badge variant="outline">Ghost Kitchen</Badge>;
      default:
        return <Badge variant="outline">Estándar</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{mockChainData.chain.logo}</span>
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              {mockChainData.chain.name}
            </h2>
            <p className="text-muted-foreground">
              {mockChainData.chain.totalLocations} ubicaciones • Fundada en {mockChainData.chain.founded}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Nueva Transferencia
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Ubicación
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ubicaciones</p>
                <p className="text-2xl font-bold">{mockChainData.chain.activeLocations}/{mockChainData.chain.totalLocations}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold">${(mockChainData.chain.totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Empleados</p>
                <p className="text-2xl font-bold">{mockChainData.locations.reduce((a, b) => a + b.staff, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rating Promedio</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {mockChainData.chain.avgRating}
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transferencias</p>
                <p className="text-2xl font-bold">{mockChainData.pendingTransfers.length}</p>
              </div>
              <Package className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
          <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
          <TabsTrigger value="analytics">Analítica</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance by Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ingresos por Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Bar 
                  data={mockChainData.performanceChart}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } }
                  }}
                />
              </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendencia de Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Line 
                  data={mockChainData.trendChart}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Location Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado Rápido de Ubicaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {mockChainData.locations.map((loc) => (
                  <div key={loc.id} className="text-center p-4 rounded-lg border bg-card">
                    <p className="font-semibold">{loc.name}</p>
                    {getStatusBadge(loc.status)}
                    <p className="text-xl font-bold mt-2">${(loc.revenue / 1000).toFixed(0)}k</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm">{loc.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockChainData.locations.map((location) => (
              <Card key={location.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {location.name}
                    </CardTitle>
                    {getTypeBadge(location.type)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(location.status)}
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{location.rating}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ingresos</p>
                      <p className="font-bold text-lg">${(location.revenue / 1000).toFixed(0)}k</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Personal</p>
                      <p className="font-bold text-lg">{location.staff}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Cumplimiento</span>
                      <span>{location.compliance}%</span>
                    </div>
                    <Progress value={location.compliance} className="h-2" />
                  </div>

                  <Button variant="outline" className="w-full" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Transferencias de Inventario
              </CardTitle>
              <CardDescription>
                Gestiona el movimiento de productos entre ubicaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockChainData.pendingTransfers.map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-semibold">{transfer.from}</p>
                        <p className="text-xs text-muted-foreground">Origen</p>
                      </div>
                      <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-semibold">{transfer.to}</p>
                        <p className="text-xs text-muted-foreground">Destino</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{transfer.items}</p>
                      <p className="font-bold">${transfer.value.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={transfer.status === 'pending' ? 'secondary' : 'default'}>
                        {transfer.status === 'pending' ? 'Pendiente' : 'En tránsito'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        {transfer.status === 'pending' ? 'Aprobar' : 'Confirmar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Checklists de Cumplimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockChainData.complianceItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Frecuencia: {item.frequency} • Último: {new Date(item.lastCheck).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{item.avgScore}%</p>
                        <p className="text-xs text-muted-foreground">Promedio</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Registros
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance by Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cumplimiento por Ubicación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockChainData.locations.map((loc) => (
                  <div key={loc.id} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{loc.name}</span>
                      <span className={loc.compliance >= 90 ? 'text-green-500' : loc.compliance >= 80 ? 'text-yellow-500' : 'text-destructive'}>
                        {loc.compliance}%
                      </span>
                    </div>
                    <Progress value={loc.compliance} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Insights IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-200">Oportunidad</span>
                  </div>
                  <p className="text-sm mt-1">
                    Polanco tiene 15% más capacidad disponible. Considera promociones para horas valle.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-yellow-800 dark:text-yellow-200">Atención</span>
                  </div>
                  <p className="text-sm mt-1">
                    Santa Fe muestra decline en cumplimiento. Programar visita de supervisión.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-800 dark:text-blue-200">Recomendación</span>
                  </div>
                  <p className="text-sm mt-1">
                    El menú de temporada de Condesa tuvo +22% ventas. Replicar en otras ubicaciones.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparativa de Métricas</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar 
                  data={{
                    labels: mockChainData.locations.map(l => l.name),
                    datasets: [
                      {
                        label: 'Cumplimiento %',
                        data: mockChainData.locations.map(l => l.compliance),
                        backgroundColor: 'hsl(var(--chart-1))'
                      },
                      {
                        label: 'Rating x20',
                        data: mockChainData.locations.map(l => l.rating * 20),
                        backgroundColor: 'hsl(var(--chart-2))'
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChainManagementModule;
