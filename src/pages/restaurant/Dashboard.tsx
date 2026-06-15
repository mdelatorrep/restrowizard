import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Users, Utensils, Clock, Leaf, Store } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ActionPlan from '@/components/ActionPlan';
import { useCopilotAlerts } from '@/hooks/useCopilotAlerts';
import { useAggregatedFinances } from '@/hooks/useAggregatedFinances';
import { useRestaurantLifecycle } from '@/hooks/useRestaurantLifecycle';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardKPIs, type KPIData } from '@/components/dashboard/DashboardKPIs';
import { CopilotAlertsCard, type DashboardAlert } from '@/components/dashboard/CopilotAlertsCard';
import { QuickActionsCard, type QuickAction } from '@/components/dashboard/QuickActionsCard';
import { WeeklyPerformanceCard } from '@/components/dashboard/WeeklyPerformanceCard';
import { formatCurrency } from '@/lib/formatCurrency';

const RestaurantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const lifecycle = useRestaurantLifecycle();
  const { alerts: copilotAlerts, unreadAlerts } = useCopilotAlerts();
  // P2-8 / H-06: comparativo real con período anterior (7 días previos).
  const sevenDayRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, []);
  const prevSevenDayRange = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() - 7);
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, []);
  const { kpis: financeKpis, hasData: hasFinanceData } = useAggregatedFinances(sevenDayRange);
  const { kpis: prevFinanceKpis } = useAggregatedFinances(prevSevenDayRange);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!user) return;
      const [{ data: biz }, { data: prof }] = await Promise.all([
        supabase
          .from('restaurant_businesses')
          .select('name')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('full_name, restaurant_name')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);
      if (biz?.name) setBusinessName(biz.name);
      else if (prof?.restaurant_name) setBusinessName(prof.restaurant_name);
      const meta = (user.user_metadata ?? {}) as Record<string, any>;
      setUserName(prof?.full_name || meta.full_name || user.email?.split('@')[0] || '');
    };

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 18) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');

    setCurrentTime(
      new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );

    fetchBusiness();
  }, [user]);

  if (!lifecycle.isLoading) {
    if (lifecycle.stage === 'pre_opening') return <Navigate to="/r/pre-opening" replace />;
    if (lifecycle.stage === 'first_90_days') return <Navigate to="/r/first-90-days" replace />;
    if (lifecycle.stage === 'conception' || lifecycle.stage === 'enablement')
      return <Navigate to="/r/new-business" replace />;
  }

  // H-06: variación real vs período anterior (positivo = mejor, negativo = peor).
  const pctChange = (curr: number, prev: number): number => {
    if (!prev || prev === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  };
  const revChange = pctChange(financeKpis?.totalRevenue || 0, prevFinanceKpis?.totalRevenue || 0);
  const ticketChange = pctChange(financeKpis?.avgTicket || 0, prevFinanceKpis?.avgTicket || 0);
  const coversChange = pctChange(financeKpis?.totalCovers || 0, prevFinanceKpis?.totalCovers || 0);
  // Para Food Cost, la "mejora" es bajar el % (cuanto menor, mejor).
  const foodCostDelta = (financeKpis?.foodCostPercentage || 0) - (prevFinanceKpis?.foodCostPercentage || 0);
  const foodCostChange = Math.round(foodCostDelta * 10) / 10; // puntos porcentuales

  const kpis: KPIData[] =
    hasFinanceData && financeKpis
      ? [
          {
            label: 'Ventas (7 días)',
            value: formatCurrency(financeKpis.totalRevenue, 'COP'),
            change: revChange,
            icon: <DollarSign className="h-5 w-5" />,
            trend: revChange >= 0 ? 'up' : 'down',
          },
          {
            label: 'Food Cost',
            value: `${financeKpis.foodCostPercentage.toFixed(1)}%`,
            change: foodCostChange,
            icon: <Utensils className="h-5 w-5" />,
            // Bajar food cost es positivo
            trend: foodCostDelta <= 0 ? 'up' : 'down',
          },
          {
            label: 'Ticket Promedio',
            value: formatCurrency(financeKpis.avgTicket, 'COP'),
            change: ticketChange,
            icon: <Users className="h-5 w-5" />,
            trend: ticketChange >= 0 ? 'up' : 'down',
          },
          {
            label: 'Clientes (7 días)',
            value: financeKpis.totalCovers.toString(),
            change: coversChange,
            icon: <TrendingUp className="h-5 w-5" />,
            trend: coversChange >= 0 ? 'up' : 'down',
          },
        ]
      : [
          { label: 'Ventas (7 días)', value: '—', change: 0, icon: <DollarSign className="h-5 w-5" />, trend: 'up' },
          { label: 'Food Cost', value: '—', change: 0, icon: <Utensils className="h-5 w-5" />, trend: 'up' },
          { label: 'Ticket Promedio', value: '—', change: 0, icon: <Users className="h-5 w-5" />, trend: 'up' },
          { label: 'Clientes (7 días)', value: '—', change: 0, icon: <TrendingUp className="h-5 w-5" />, trend: 'up' },
        ];

  const getAlertType = (priority: string | null): 'warning' | 'info' | 'success' => {
    if (priority === 'critical' || priority === 'high') return 'warning';
    if (priority === 'low') return 'success';
    return 'info';
  };

  const displayAlerts: DashboardAlert[] = copilotAlerts.slice(0, 4).map((a) => ({
    id: a.id,
    type: getAlertType(a.priority),
    title: a.title,
    message: a.message,
    action: a.action_url ? 'Ver más' : undefined,
  }));

  const quickActions: QuickAction[] = [
    { label: 'Finanzas IA', path: '/r/finances', icon: DollarSign },
    { label: 'Operaciones', path: '/r/operations', icon: Clock },
    { label: 'Talento', path: '/r/talent', icon: Users },
    { label: 'Menú', path: '/r/menu-engineering', icon: Utensils },
    { label: 'Ghost Kitchen', path: '/r/ghost-kitchen', icon: Store },
    { label: 'Sostenibilidad', path: '/r/sustainability', icon: Leaf },
  ];

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      <DashboardHero greeting={greeting} currentTime={currentTime} businessName={businessName} userName={userName} />

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="action-plan">Plan de Acción</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 md:space-y-6 mt-4">
          <DashboardKPIs kpis={kpis} />

          <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
            <CopilotAlertsCard alerts={displayAlerts} unreadCount={unreadAlerts.length} />
            <QuickActionsCard actions={quickActions} onNavigate={navigate} />
          </div>

          <WeeklyPerformanceCard />
        </TabsContent>

        <TabsContent value="action-plan" className="mt-4">
          <ActionPlan />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RestaurantDashboard;
