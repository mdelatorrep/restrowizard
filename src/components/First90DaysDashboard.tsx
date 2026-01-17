import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, Calendar, TrendingUp, Users, DollarSign, Target,
  CheckCircle2, Circle, Clock, ChefHat, Megaphone, ArrowRight,
  Sparkles, Trophy, AlertCircle, Lightbulb, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirst90Days, Milestone } from '@/hooks/useFirst90Days';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const getCategoryIcon = (category: Milestone['category']) => {
  switch (category) {
    case 'revenue': return DollarSign;
    case 'operations': return ChefHat;
    case 'marketing': return Megaphone;
    case 'team': return Users;
    case 'customer': return Users;
    default: return Target;
  }
};

const getCategoryColor = (category: Milestone['category']) => {
  switch (category) {
    case 'revenue': return 'text-success';
    case 'operations': return 'text-primary';
    case 'marketing': return 'text-info';
    case 'team': return 'text-warning';
    case 'customer': return 'text-accent';
    default: return 'text-muted-foreground';
  }
};

export const First90DaysDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { metrics, businessData, isLoading } = useFirst90Days();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!metrics || !businessData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No se encontró información del negocio</p>
        </CardContent>
      </Card>
    );
  }

  const completedMilestones = metrics.milestones.filter(m => m.isCompleted).length;
  const upcomingMilestones = metrics.milestones.filter(
    m => !m.isCompleted && m.targetDay <= metrics.daysOpen + 14
  );

  // Mock weekly data for chart
  const weeklyChartData = Array.from({ length: metrics.weekNumber }, (_, i) => ({
    week: `Sem ${i + 1}`,
    revenue: metrics.revenueGrowth[i] || Math.random() * 50000 + 30000,
    customers: metrics.customerGrowth[i] || Math.random() * 300 + 100,
  }));

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl p-6 md:p-8 border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Rocket className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-headline font-bold">
                Primeros 90 Días
              </h1>
              <p className="text-muted-foreground">
                {businessData.name} • Día {metrics.daysOpen} de 90
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progreso</p>
              <p className="text-2xl font-bold text-primary">
                {metrics.progressPercentage.toFixed(0)}%
              </p>
            </div>
            <div className="w-20 h-20 relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-primary"
                  strokeDasharray={`${2 * Math.PI * 35}`}
                  strokeDashoffset={`${2 * Math.PI * 35 * (1 - metrics.progressPercentage / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{metrics.daysRemaining}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Inicio</span>
            <span className="font-medium">Semana {metrics.weekNumber}</span>
            <span>Día 90</span>
          </div>
          <Progress value={metrics.progressPercentage} className="h-3" />
        </div>
      </div>

      {/* Weekly Focus Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              Enfoque de la Semana {metrics.weeklyFocus.weekNumber}
            </CardTitle>
          </div>
          <CardDescription className="text-base font-medium text-foreground">
            {metrics.weeklyFocus.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{metrics.weeklyFocus.description}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Objetivos
              </h4>
              <ul className="space-y-2">
                {metrics.weeklyFocus.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Circle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                Tips
              </h4>
              <ul className="space-y-2">
                {metrics.weeklyFocus.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-warning">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-success" />
              <Badge variant="secondary">Total</Badge>
            </div>
            <p className="text-2xl font-bold">
              ${(metrics.totalRevenue / 1000).toFixed(1)}k
            </p>
            <p className="text-sm text-muted-foreground">Ventas acumuladas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-info" />
              <Badge variant="secondary">Total</Badge>
            </div>
            <p className="text-2xl font-bold">
              {metrics.totalCustomers.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Clientes atendidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Promedio</Badge>
            </div>
            <p className="text-2xl font-bold">
              ${metrics.averageTicket.toFixed(0)}
            </p>
            <p className="text-sm text-muted-foreground">Ticket promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <ChefHat className="h-5 w-5 text-warning" />
              <Badge variant={metrics.foodCostAverage <= 32 ? 'default' : 'destructive'}>
                {metrics.foodCostAverage <= 32 ? 'OK' : 'Alto'}
              </Badge>
            </div>
            <p className="text-2xl font-bold">
              {metrics.foodCostAverage.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Food Cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="progress">Progreso</TabsTrigger>
          <TabsTrigger value="milestones">Hitos</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="mt-6 space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolución Semanal
              </CardTitle>
              <CardDescription>
                Tendencia de ventas y clientes por semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Projections */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Proyección Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  ${(metrics.projectedMonthlyRevenue / 1000).toFixed(0)}k
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Basado en ventas diarias promedio de ${metrics.averageDailyRevenue.toFixed(0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Días Más Fuertes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {metrics.peakDays.map((day, i) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      {day}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Horarios pico: {metrics.peakHours.join(', ')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="mt-6 space-y-4">
          {/* Upcoming Milestones */}
          {upcomingMilestones.length > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Próximos Hitos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingMilestones.map((milestone) => {
                  const Icon = getCategoryIcon(milestone.category);
                  const daysUntil = milestone.targetDay - metrics.daysOpen;
                  return (
                    <div key={milestone.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                      <div className={`p-2 rounded-lg bg-muted ${getCategoryColor(milestone.category)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{milestone.title}</p>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                      <Badge variant="outline">
                        {daysUntil > 0 ? `En ${daysUntil} días` : 'Hoy'}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* All Milestones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  Todos los Hitos
                </CardTitle>
                <Badge>
                  {completedMilestones} / {metrics.milestones.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.milestones.map((milestone) => {
                  const Icon = getCategoryIcon(milestone.category);
                  return (
                    <div 
                      key={milestone.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        milestone.isCompleted ? 'bg-success/5 border-success/20' : 'bg-muted/30'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        milestone.isCompleted ? 'bg-success/20' : 'bg-muted'
                      }`}>
                        {milestone.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Icon className={`h-4 w-4 ${getCategoryColor(milestone.category)}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${milestone.isCompleted ? 'text-success' : ''}`}>
                          {milestone.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                      <Badge variant={milestone.isCompleted ? 'default' : 'outline'}>
                        Día {milestone.targetDay}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 space-y-4">
          {/* Efficiency Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Eficiencia</CardTitle>
              <CardDescription>
                Indicadores clave de operación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Food Cost</span>
                    <span className="font-bold">{metrics.foodCostAverage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(metrics.foodCostAverage, 40) * 2.5} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Objetivo: &lt; 32%
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Labor Cost</span>
                    <span className="font-bold">{metrics.laborCostAverage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(metrics.laborCostAverage, 35) * 2.86} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Objetivo: &lt; 28%
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Clientes/día</span>
                    <span className="font-bold">{metrics.averageDailyCustomers.toFixed(0)}</span>
                  </div>
                  <Progress 
                    value={Math.min(metrics.averageDailyCustomers, 100)} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Promedio del período
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                Recomendaciones Basadas en Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.foodCostAverage > 32 && (
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <p className="font-medium text-warning">Food Cost Elevado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tu food cost está en {metrics.foodCostAverage.toFixed(1)}%, por encima del objetivo de 32%. 
                    Considera revisar porciones y negociar con proveedores.
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2" onClick={() => navigate('/r/menu-engineering')}>
                    Ir a Ingeniería de Menú <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}

              {metrics.averageTicket < 150 && (
                <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                  <p className="font-medium text-info">Oportunidad de Ticket</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tu ticket promedio es de ${metrics.averageTicket.toFixed(0)}. 
                    Considera estrategias de upselling para aumentarlo.
                  </p>
                </div>
              )}

              {metrics.daysOpen >= 30 && (
                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <p className="font-medium text-success">¡Felicidades por tu primer mes!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Has atendido a {metrics.totalCustomers.toLocaleString()} clientes y generado 
                    ${(metrics.totalRevenue / 1000).toFixed(1)}k en ventas. ¡Sigue así!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CTA to regular dashboard */}
      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">¿Quieres ver el dashboard completo?</p>
              <p className="text-sm text-muted-foreground">
                Accede a todas las herramientas de RestroWizard
              </p>
            </div>
            <Button onClick={() => navigate('/r/dashboard')}>
              Ver Dashboard Completo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
