import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Users, Utensils, Clock, Leaf, Store } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ActionPlan from '@/components/ActionPlan';
import { useCopilotAlerts } from '@/hooks/useCopilotAlerts';
import { useFinancesData } from '@/hooks/useFinancesData';
import { useRestaurantLifecycle } from '@/hooks/useRestaurantLifecycle';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardKPIs, type KPIData } from '@/components/dashboard/DashboardKPIs';
import { CopilotAlertsCard, type DashboardAlert } from '@/components/dashboard/CopilotAlertsCard';
import { QuickActionsCard, type QuickAction } from '@/components/dashboard/QuickActionsCard';
import { WeeklyPerformanceCard } from '@/components/dashboard/WeeklyPerformanceCard';

const RestaurantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const lifecycle = useRestaurantLifecycle();
  const { alerts: copilotAlerts, unreadAlerts } = useCopilotAlerts();
  const { kpis: financeKpis, hasData: hasFinanceData } = useFinancesData();

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('restaurant_businesses')
        .select('name')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setBusinessName(data.name);
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

  const kpis: KPIData[] =
    hasFinanceData && financeKpis
      ? [
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
      <DashboardHero greeting={greeting} currentTime={currentTime} businessName={businessName} />

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
