import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Receipt,
  Calendar,
  Clock,
  Award,
  CreditCard,
  Banknote,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw
} from 'lucide-react';
import { useSalesReports, ReportPeriod } from '@/hooks/useSalesReports';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartConfig 
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const chartConfig: ChartConfig = {
  totalSales: {
    label: 'Ventas',
    color: 'hsl(var(--primary))'
  },
  orderCount: {
    label: 'Pedidos',
    color: 'hsl(var(--secondary))'
  },
  avgTicket: {
    label: 'Ticket Promedio',
    color: 'hsl(var(--accent))'
  }
};

export const SalesReports = () => {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const { chartData, kpis, topProducts, hourlyData, loading, hasData } = useSalesReports(period);

  const periodLabels: Record<ReportPeriod, string> = {
    daily: 'Últimos 7 días',
    weekly: 'Últimas 4 semanas',
    monthly: 'Últimos 3 meses'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reportes de Ventas</h2>
          <p className="text-muted-foreground">{periodLabels[period]}</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <TabsList>
              <TabsTrigger value="daily" className="gap-2">
                <Calendar className="h-4 w-4" />
                Diario
              </TabsTrigger>
              <TabsTrigger value="weekly" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Semanal
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Mensual
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</p>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                kpis.growthPercent >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
              )}>
                <DollarSign className={cn(
                  "h-6 w-6",
                  kpis.growthPercent >= 0 ? "text-green-600" : "text-red-600"
                )} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {kpis.growthPercent >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={cn(
                "text-sm font-medium",
                kpis.growthPercent >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {kpis.growthPercent >= 0 ? '+' : ''}{kpis.growthPercent.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">vs periodo anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pedidos</p>
                <p className="text-2xl font-bold">{kpis.totalOrders}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {(kpis.totalOrders / (period === 'daily' ? 7 : period === 'weekly' ? 28 : 90)).toFixed(1)} pedidos/día promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis.avgTicket)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Por transacción
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mejor Día</p>
                <p className="text-2xl font-bold">{kpis.bestDay || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {formatCurrency(kpis.bestDayAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tendencia de Ventas
            </CardTitle>
            <CardDescription>
              Evolución de ingresos en el periodo seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value: any) => formatCurrency(value)}
                    />} 
                  />
                  <Area
                    type="monotone"
                    dataKey="totalSales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos de ventas en este periodo
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Métodos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Efectivo', value: kpis.cashPercent, color: 'hsl(var(--chart-1))' },
                      { name: 'Tarjeta', value: kpis.cardPercent, color: 'hsl(var(--chart-2))' },
                      { name: 'Otros', value: 100 - kpis.cashPercent - kpis.cardPercent, color: 'hsl(var(--chart-3))' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {[
                      { name: 'Efectivo', value: kpis.cashPercent, color: 'hsl(142, 76%, 36%)' },
                      { name: 'Tarjeta', value: kpis.cardPercent, color: 'hsl(221, 83%, 53%)' },
                      { name: 'Otros', value: 100 - kpis.cashPercent - kpis.cardPercent, color: 'hsl(280, 65%, 60%)' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Efectivo</span>
                </div>
                <Badge variant="secondary">{kpis.cashPercent.toFixed(1)}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Tarjeta</span>
                </div>
                <Badge variant="secondary">{kpis.cardPercent.toFixed(1)}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Otros</span>
                </div>
                <Badge variant="secondary">{(100 - kpis.cashPercent - kpis.cardPercent).toFixed(1)}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Productos Más Vendidos
            </CardTitle>
            <CardDescription>Top 10 por ingresos generados</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div 
                      key={product.name} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          index === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50" :
                          index === 1 ? "bg-slate-100 text-slate-700 dark:bg-slate-800" :
                          index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity} unidades
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No hay datos de productos
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Ventas por Hora
            </CardTitle>
            <CardDescription>Distribución horaria de pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={hourlyData.filter(h => h.orders > 0 || (h.hour >= 8 && h.hour <= 23))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={1}
                />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value: any, name: any) => {
                      if (name === 'orders') return `${value} pedidos`;
                      return formatCurrency(value);
                    }}
                  />} 
                />
                <Bar 
                  dataKey="sales" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="Ventas"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
