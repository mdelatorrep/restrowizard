import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useConsultantProfile } from '@/hooks/useConsultantProfile';
import { useConsultantClients } from '@/hooks/useConsultantClients';
import { useConsultantAlerts } from '@/hooks/useConsultantAlerts';
import { useConsultantBilling } from '@/hooks/useConsultantBilling';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  TrendingUp,
  FileText,
  DollarSign,
  Star,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  BarChart3,
  MessageSquare,
  Sparkles,
  ArrowRight
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

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useConsultantProfile();
  const { clients, activeClients, totalMonthlyRevenue, loading: clientsLoading } = useConsultantClients();
  const { alerts, highPriorityAlerts, loading: alertsLoading } = useConsultantAlerts();
  const { pendingInvoices, overdueInvoices, totalPending, thisMonthPaid, loading: billingLoading } = useConsultantBilling();
  
  const [activeTab, setActiveTab] = useState('overview');

  const isLoading = profileLoading || clientsLoading || alertsLoading || billingLoading;

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

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      'inicial': 'bg-red-500',
      'en_desarrollo': 'bg-yellow-500',
      'optimizado': 'bg-green-500',
      'lider': 'bg-blue-500'
    };
    return <Badge className={colors[level] || 'bg-muted'}>{level.replace('_', ' ')}</Badge>;
  };

  // Chart data from real clients
  const clientComparisonData = {
    labels: clients.slice(0, 4).map(c => c.business?.name?.substring(0, 12) || 'Cliente'),
    datasets: [
      {
        label: 'Puntuación Madurez',
        data: clients.slice(0, 4).map(c => c.diagnosis?.overall_score || 0),
        backgroundColor: 'hsl(var(--chart-1))'
      }
    ]
  };

  const revenueData = {
    labels: ['Oct', 'Nov', 'Dic', 'Ene'],
    datasets: [
      {
        label: 'Ingresos',
        data: [totalMonthlyRevenue * 0.8, totalMonthlyRevenue * 0.9, totalMonthlyRevenue * 0.95, totalMonthlyRevenue],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const hasClients = clients.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.logo_url || '/placeholder.svg'} />
            <AvatarFallback>{profile?.company_name?.slice(0, 2).toUpperCase() || 'CO'}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-primary" />
              Portal de Consultor
            </h2>
            <p className="text-muted-foreground">
              {profile?.company_name || 'Mi Consultoría'} • {activeClients.length} clientes activos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/c/reports')}>
            <FileText className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
          <Button onClick={() => navigate('/c/clients')}>
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
                <p className="text-3xl font-bold">{activeClients.length}</p>
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
                <p className="text-3xl font-bold">${(totalMonthlyRevenue / 1000).toFixed(0)}k</p>
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
                <p className="text-3xl font-bold text-destructive">{highPriorityAlerts.length}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Cobrar</p>
                <p className="text-3xl font-bold flex items-center gap-1">
                  ${(totalPending / 1000).toFixed(0)}k
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
          {!hasClients ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes clientes aún</h3>
                <p className="text-muted-foreground mb-4">
                  Agrega tu primer cliente para comenzar a gestionar su negocio
                </p>
                <Button onClick={() => navigate('/c/clients')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Cliente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Portfolio Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Ingresos del Portafolio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Line 
                    data={revenueData}
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
                    Madurez por Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Bar 
                    data={clientComparisonData}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { y: { max: 100 } }
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Alertas Recientes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/c/alerts')}>
                  Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.slice(0, 4).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          alert.priority === 'high' || alert.priority === 'critical' ? 'bg-destructive' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium">{alert.business_name}</p>
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
          )}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4 mt-4">
          {!hasClients ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes clientes aún</h3>
                <p className="text-muted-foreground mb-4">
                  Agrega tu primer cliente para comenzar
                </p>
                <Button onClick={() => navigate('/c/clients')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Cliente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map((client) => (
                <Card key={client.id} className={client.status === 'paused' ? 'opacity-60' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                          {client.business?.cuisine_type === 'italiana' ? '🍝' :
                           client.business?.cuisine_type === 'japonesa' ? '🍣' :
                           client.business?.cuisine_type === 'mexicana' ? '🌮' : '🍽️'}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{client.business?.name || 'Cliente'}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {client.diagnosis && getHealthBadge(client.diagnosis.overall_score)}
                            {client.diagnosis && getLevelBadge(client.diagnosis.overall_level)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Puntuación Madurez</span>
                        <span className={getHealthColor(client.diagnosis?.overall_score || 0)}>
                          {client.diagnosis?.overall_score || 0}%
                        </span>
                      </div>
                      <Progress value={client.diagnosis?.overall_score || 0} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tarifa Mensual</p>
                        <p className="font-semibold">${(client.monthly_fee || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Alertas</p>
                        <p className={`font-semibold ${(client.alerts_count || 0) > 3 ? 'text-destructive' : ''}`}>
                          {client.alerts_count || 0} pendientes
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
          )}
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => navigate('/c/clients')}>
              Gestionar Clientes <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Centro de Alertas</CardTitle>
                <CardDescription>
                  Todas las alertas de tu portafolio de clientes
                </CardDescription>
              </div>
              <Button onClick={() => navigate('/c/alerts')}>
                Ver Centro Completo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No hay alertas pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          alert.priority === 'high' || alert.priority === 'critical' ? 'bg-destructive/10' : 'bg-yellow-500/10'
                        }`}>
                          <AlertCircle className={`h-5 w-5 ${
                            alert.priority === 'high' || alert.priority === 'critical' ? 'text-destructive' : 'text-yellow-500'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{alert.business_name}</p>
                            <Badge variant={alert.priority === 'high' || alert.priority === 'critical' ? 'destructive' : 'secondary'}>
                              {alert.priority === 'high' || alert.priority === 'critical' ? 'Alta' : 'Media'}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generador de Reportes
                </CardTitle>
                <CardDescription>
                  Crea reportes personalizados para tus clientes
                </CardDescription>
              </div>
              <Button onClick={() => navigate('/c/reports')}>
                Abrir Generador <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/c/reports')}>
                  <CardContent className="pt-6 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-primary mb-2" />
                    <h4 className="font-semibold">Reporte Financiero</h4>
                    <p className="text-sm text-muted-foreground">P&L, costos, márgenes</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/c/reports')}>
                  <CardContent className="pt-6 text-center">
                    <Users className="h-12 w-12 mx-auto text-primary mb-2" />
                    <h4 className="font-semibold">Reporte Operativo</h4>
                    <p className="text-sm text-muted-foreground">Eficiencia, tiempos</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/c/reports')}>
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-12 w-12 mx-auto text-primary mb-2" />
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Facturación
                </CardTitle>
                <CardDescription>
                  Gestiona las facturas de tus clientes
                </CardDescription>
              </div>
              <Button onClick={() => navigate('/c/billing')}>
                Abrir Facturación <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Cobrado este mes</p>
                    <p className="text-2xl font-bold text-green-500">${thisMonthPaid.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Pendiente</p>
                    <p className="text-2xl font-bold">${totalPending.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Vencido</p>
                    <p className="text-2xl font-bold text-destructive">${overdueInvoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              {pendingInvoices.length === 0 && overdueInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No hay facturas pendientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...overdueInvoices, ...pendingInvoices].slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{invoice.business_name}</p>
                        <p className="text-sm text-muted-foreground">{invoice.invoice_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${invoice.amount.toLocaleString()}</p>
                        <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {invoice.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultantDashboard;
