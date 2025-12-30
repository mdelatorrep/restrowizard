import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Briefcase,
  Users,
  TrendingUp,
  FileText,
  DollarSign,
  Calendar,
  Star,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  BarChart3,
  Building2,
  MessageSquare,
  Sparkles
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
import { Bar, Line } from 'react-chartjs-2';

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

// Mock data for consultant dashboard
const mockConsultantData = {
  profile: {
    name: 'Carlos Rodríguez',
    company: 'Gastro Consulting MX',
    specializations: ['Finanzas', 'Operaciones', 'Menú Engineering'],
    activeClients: 8,
    totalRevenue: 156000,
    avgRating: 4.9
  },
  clients: [
    {
      id: 1,
      name: 'La Trattoria Italiana',
      logo: '🍝',
      status: 'active',
      health: 85,
      monthlyFee: 15000,
      alerts: 2,
      lastVisit: '2024-01-10',
      maturityLevel: 'En desarrollo'
    },
    {
      id: 2,
      name: 'Sushi Master',
      logo: '🍣',
      status: 'active',
      health: 92,
      monthlyFee: 18000,
      alerts: 0,
      lastVisit: '2024-01-12',
      maturityLevel: 'Optimizado'
    },
    {
      id: 3,
      name: 'Taquería El Patrón',
      logo: '🌮',
      status: 'active',
      health: 68,
      monthlyFee: 12000,
      alerts: 5,
      lastVisit: '2024-01-08',
      maturityLevel: 'Inicial'
    },
    {
      id: 4,
      name: 'Burger House',
      logo: '🍔',
      status: 'paused',
      health: 45,
      monthlyFee: 0,
      alerts: 8,
      lastVisit: '2023-12-15',
      maturityLevel: 'En riesgo'
    }
  ],
  pendingInvoices: [
    { id: 1, client: 'La Trattoria Italiana', amount: 15000, dueDate: '2024-01-15', status: 'pending' },
    { id: 2, client: 'Sushi Master', amount: 18000, dueDate: '2024-01-20', status: 'pending' },
    { id: 3, client: 'Taquería El Patrón', amount: 12000, dueDate: '2024-01-10', status: 'overdue' }
  ],
  recentAlerts: [
    { id: 1, client: 'Taquería El Patrón', type: 'financial', message: 'Food cost subió a 38%', priority: 'high' },
    { id: 2, client: 'La Trattoria Italiana', type: 'inventory', message: 'Bajo stock de ingredientes clave', priority: 'medium' },
    { id: 3, client: 'Burger House', type: 'staff', message: 'Alta rotación de personal (45%)', priority: 'high' },
    { id: 4, client: 'Taquería El Patrón', type: 'operations', message: 'Tiempo de espera aumentó 8 min', priority: 'medium' }
  ],
  portfolioPerformance: {
    labels: ['Oct', 'Nov', 'Dic', 'Ene'],
    datasets: [
      {
        label: 'Ingresos Totales Clientes',
        data: [2800000, 3100000, 3450000, 3200000],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  },
  clientComparison: {
    labels: ['La Trattoria', 'Sushi Master', 'Taquería', 'Burger House'],
    datasets: [
      {
        label: 'Food Cost %',
        data: [28, 25, 38, 42],
        backgroundColor: 'hsl(var(--chart-1))'
      },
      {
        label: 'Labor Cost %',
        data: [22, 20, 28, 35],
        backgroundColor: 'hsl(var(--chart-2))'
      }
    ]
  }
};

const ConsultantDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-500';
    if (health >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getHealthBadge = (health: number) => {
    if (health >= 80) return <Badge className="bg-green-500">Saludable</Badge>;
    if (health >= 60) return <Badge className="bg-yellow-500">Atención</Badge>;
    return <Badge variant="destructive">Crítico</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>CR</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-primary" />
              Portal de Consultor
            </h2>
            <p className="text-muted-foreground">
              {mockConsultantData.profile.company} • {mockConsultantData.profile.activeClients} clientes activos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Activos</p>
                <p className="text-3xl font-bold">{mockConsultantData.profile.activeClients}</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Mensuales</p>
                <p className="text-3xl font-bold">${(mockConsultantData.profile.totalRevenue / 1000).toFixed(0)}k</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas Pendientes</p>
                <p className="text-3xl font-bold text-destructive">{mockConsultantData.recentAlerts.length}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calificación</p>
                <p className="text-3xl font-bold flex items-center gap-1">
                  {mockConsultantData.profile.avgRating}
                  <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                </p>
              </div>
              <Star className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Portfolio Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Rendimiento del Portafolio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Line 
                  data={mockConsultantData.portfolioPerformance}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } }
                  }}
                />
              </CardContent>
            </Card>

            {/* Client Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Comparativa de Costos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Bar 
                  data={mockConsultantData.clientComparison}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Alertas Recientes de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockConsultantData.recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        alert.priority === 'high' ? 'bg-destructive' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium">{alert.client}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockConsultantData.clients.map((client) => (
              <Card key={client.id} className={client.status === 'paused' ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{client.logo}</span>
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getHealthBadge(client.health)}
                          <Badge variant="outline">{client.maturityLevel}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Salud del Negocio</span>
                      <span className={getHealthColor(client.health)}>{client.health}%</span>
                    </div>
                    <Progress value={client.health} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tarifa Mensual</p>
                      <p className="font-semibold">${client.monthlyFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Alertas</p>
                      <p className={`font-semibold ${client.alerts > 3 ? 'text-destructive' : ''}`}>
                        {client.alerts} pendientes
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Dashboard
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Mensaje
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Centro de Alertas</CardTitle>
              <CardDescription>
                Todas las alertas de tu portafolio de clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockConsultantData.recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        alert.priority === 'high' ? 'bg-destructive/10' : 'bg-yellow-500/10'
                      }`}>
                        <AlertCircle className={`h-5 w-5 ${
                          alert.priority === 'high' ? 'text-destructive' : 'text-yellow-500'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{alert.client}</p>
                          <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                            {alert.priority === 'high' ? 'Alta' : 'Media'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Sparkles className="h-4 w-4 mr-1" />
                        Solución IA
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generador de Reportes
              </CardTitle>
              <CardDescription>
                Crea reportes personalizados para tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-6 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-primary mb-2" />
                    <h4 className="font-semibold">Reporte Financiero</h4>
                    <p className="text-sm text-muted-foreground">P&L, costos, márgenes</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-6 text-center">
                    <Users className="h-12 w-12 mx-auto text-primary mb-2" />
                    <h4 className="font-semibold">Reporte de Personal</h4>
                    <p className="text-sm text-muted-foreground">Rotación, productividad</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-6 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-primary mb-2" />
                    <h4 className="font-semibold">Reporte de Madurez</h4>
                    <p className="text-sm text-muted-foreground">Diagnóstico completo</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Facturas Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockConsultantData.pendingInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div>
                      <p className="font-medium">{invoice.client}</p>
                      <p className="text-sm text-muted-foreground">
                        Vence: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">${invoice.amount.toLocaleString()}</p>
                        <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {invoice.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Enviar Recordatorio
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Facturado Este Mes</p>
                <p className="text-3xl font-bold text-green-500">$45,000</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Por Cobrar</p>
                <p className="text-3xl font-bold text-yellow-500">$45,000</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Vencido</p>
                <p className="text-3xl font-bold text-destructive">$12,000</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultantDashboard;
