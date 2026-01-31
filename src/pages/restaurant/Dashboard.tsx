import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Utensils,
  ArrowUpRight,
  AlertTriangle,
  Lightbulb,
  Clock,
  Leaf,
  Store,
  Building2,
  RefreshCw,
  CheckCircle,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ActionPlan from '@/components/ActionPlan';
import { useCopilotAlerts } from '@/hooks/useCopilotAlerts';
import { useFinancesData } from '@/hooks/useFinancesData';
import { useRestaurantLifecycle } from '@/hooks/useRestaurantLifecycle';

interface KPIData {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
}

const RestaurantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState('Mi Restaurante');
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  
  // Check restaurant lifecycle stage
  const lifecycle = useRestaurantLifecycle();
  
  // Real data hooks
  const { alerts: copilotAlerts, unreadAlerts, generateAlerts, dismissAlert, isLoading: alertsLoading } = useCopilotAlerts();
  const { kpis: financeKpis, hasData: hasFinanceData } = useFinancesData();

  // ALL useEffect hooks MUST be called before any conditional returns
  useEffect(() => {
    const fetchBusiness = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('restaurant_businesses')
        .select('name')
        .eq('owner_id', user.id)
        .single();
      if (data) setBusinessName(data.name);
    };

    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Buenos días');
      else if (hour < 18) setGreeting('Buenas tardes');
      else setGreeting('Buenas noches');

      setCurrentTime(new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };

    fetchBusiness();
    updateGreeting();
  }, [user]);

  // Redirect based on lifecycle stage - AFTER all hooks
  if (!lifecycle.isLoading) {
    if (lifecycle.stage === 'pre_opening') {
      return <Navigate to="/r/pre-opening" replace />;
    }
    if (lifecycle.stage === 'first_90_days') {
      return <Navigate to="/r/first-90-days" replace />;
    }
    if (lifecycle.stage === 'conception' || lifecycle.stage === 'enablement') {
      return <Navigate to="/r/new-business" replace />;
    }
  }

  // KPI data - use real data when available, fallback to demo
  const kpis: KPIData[] = hasFinanceData && financeKpis ? [
    {
      label: 'Ventas (7 días)',
      value: `$${(financeKpis.totalRevenue / 1000).toFixed(1)}k`,
      change: 12.5,
      icon: <DollarSign className="h-5 w-5" />,
      trend: 'up',
    },
    {
      label: 'Food Cost',
      value: `${financeKpis.foodCostPercentage.toFixed(1)}%`,
      change: financeKpis.foodCostPercentage > 32 ? 2.1 : -1.5,
      icon: <Utensils className="h-5 w-5" />,
      trend: financeKpis.foodCostPercentage <= 32 ? 'up' : 'down',
    },
    {
      label: 'Ticket Promedio',
      value: `$${financeKpis.averageTicket.toFixed(0)}`,
      change: 5.2,
      icon: <Users className="h-5 w-5" />,
      trend: 'up',
    },
    {
      label: 'Clientes (7 días)',
      value: financeKpis.totalCovers.toString(),
      change: 8.3,
      icon: <TrendingUp className="h-5 w-5" />,
      trend: 'up',
    },
  ] : [
    {
      label: 'Ventas Hoy',
      value: '$42,580',
      change: 12.5,
      icon: <DollarSign className="h-5 w-5" />,
      trend: 'up',
    },
    {
      label: 'Food Cost',
      value: '28.4%',
      change: -2.1,
      icon: <Utensils className="h-5 w-5" />,
      trend: 'up',
    },
    {
      label: 'Labor Cost',
      value: '24.2%',
      change: 0.5,
      icon: <Users className="h-5 w-5" />,
      trend: 'down',
    },
    {
      label: 'Margen Neto',
      value: '18.6%',
      change: 3.2,
      icon: <TrendingUp className="h-5 w-5" />,
      trend: 'up',
    },
  ];

  // Map copilot alerts to display format
  const getAlertType = (priority: string | null): 'warning' | 'info' | 'success' => {
    if (priority === 'critical' || priority === 'high') return 'warning';
    if (priority === 'low') return 'success';
    return 'info';
  };

  const displayAlerts: Alert[] = copilotAlerts.length > 0 
    ? copilotAlerts.slice(0, 4).map(a => ({
        id: a.id,
        type: getAlertType(a.priority),
        title: a.title,
        message: a.message,
        action: a.action_url ? 'Ver más' : undefined
      }))
    : [
        {
          id: '1',
          type: 'warning',
          title: 'Food Cost por arriba del target',
          message: 'Tu food cost subió 2.1% esta semana. Te recomiendo revisar los precios con tu proveedor de carnes.',
          action: 'Ver análisis',
        },
        {
          id: '2',
          type: 'info',
          title: 'Oportunidad de optimización',
          message: 'Detecté que los miércoles tienes 40% menos ventas. ¿Qué tal una promoción de mitad de semana?',
          action: 'Crear promoción',
        },
        {
          id: '3',
          type: 'success',
          title: 'Inventario optimizado',
          message: 'El desperdicio se redujo 15% este mes. ¡Excelente trabajo del equipo!',
        },
      ];

  const quickActions = [
    { label: 'Finanzas IA', path: '/r/finances', icon: DollarSign },
    { label: 'Operaciones', path: '/r/operations', icon: Clock },
    { label: 'Talento', path: '/r/talent', icon: Users },
    { label: 'Menú', path: '/r/menu-engineering', icon: Utensils },
    { label: 'Ghost Kitchen', path: '/r/ghost-kitchen', icon: Store },
    { label: 'Sostenibilidad', path: '/r/sustainability', icon: Leaf },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            {greeting}, Carlos
          </h1>
          <p className="text-muted-foreground font-lato-light capitalize">
            {currentTime} • {businessName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/diagnosis')}>
            Ver Diagnóstico
          </Button>
          <Button onClick={() => navigate('/r/finances')}>
            Ver Reportes
          </Button>
        </div>
      </div>

      {/* Tabs for Dashboard vs Action Plan */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="action-plan">Plan de Acción</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="hover:shadow-elegant transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${
                  kpi.trend === 'up' ? 'bg-success/10 text-success' :
                  kpi.trend === 'down' ? 'bg-destructive/10 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {kpi.icon}
                </div>
                <Badge variant={kpi.trend === 'up' ? 'default' : 'destructive'} className="gap-1">
                  {kpi.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(kpi.change)}%
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-headline font-bold">{kpi.value}</p>
                <p className="text-sm text-muted-foreground font-lato-light">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Copilot Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <Lightbulb className="h-5 w-5 text-warning" />
                  Co-Piloto RestroWizard
                </CardTitle>
                <CardDescription className="font-lato-light">
                  Alertas y recomendaciones basadas en tus datos
                </CardDescription>
              </div>
              <Badge variant="secondary">{unreadAlerts.length || 3} nuevas</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.type === 'warning' ? 'bg-warning/5 border-warning/20' :
                  alert.type === 'success' ? 'bg-success/5 border-success/20' :
                  'bg-info/5 border-info/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full ${
                    alert.type === 'warning' ? 'bg-warning/20' :
                    alert.type === 'success' ? 'bg-success/20' :
                    'bg-info/20'
                  }`}>
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    ) : (
                      <Lightbulb className="h-4 w-4 text-info" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-lato-bold text-sm">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    {alert.action && (
                      <Button variant="link" className="p-0 h-auto mt-2 text-primary">
                        {alert.action} <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Acceso Rápido</CardTitle>
            <CardDescription className="font-lato-light">
              Módulos de gestión con IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Button
                key={action.path}
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => navigate(action.path)}
              >
                <action.icon className="h-5 w-5 text-primary" />
                {action.label}
                <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Rendimiento Semanal</CardTitle>
          <CardDescription className="font-lato-light">
            Comparativa vs semana anterior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ventas</span>
                <span className="font-medium">$298,450 / $320,000</span>
              </div>
              <Progress value={93} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Clientes</span>
                <span className="font-medium">1,842 / 2,000</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ticket Promedio</span>
                <span className="font-medium">$162 / $150</span>
              </div>
              <Progress value={108} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="action-plan" className="mt-6">
          <ActionPlan />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RestaurantDashboard;
