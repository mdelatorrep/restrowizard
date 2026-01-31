import React, { useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
    Brain, Target, Heart, TrendingUp, Zap, Eye, MessageSquare,
    Clock, Star, ChefHat, Smartphone, BarChart3, Users,
    Activity, Gauge, Gift, Mail, RefreshCw, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';
import { useOperationsData } from '@/hooks/useOperationsData';
import { useFeedbackData } from '@/hooks/useFeedbackData';
import { useLoyaltyData } from '@/hooks/useLoyaltyData';
import { EmptyState } from '@/components/ui/empty-state';
import { useActiveClient } from '@/contexts/ActiveClientContext';

interface OperationsMetricProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
    description: string;
    colorClass: string;
}

const OperationsMetric: React.FC<OperationsMetricProps> = ({ icon, title, value, trend, description, colorClass }) => (
    <Card className="relative overflow-hidden">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className={`rounded-full p-3 ${colorClass}`}>
                    {React.cloneElement(icon as React.ReactElement, { size: 24 })}
                </div>
                {trend && (
                    <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {trend === 'up' ? <TrendingUp size={20} /> : <Activity size={20} />}
                    </div>
                )}
            </div>
            <div className="mt-4">
                <h3 className="text-2xl font-bold text-foreground">{value}</h3>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
        </CardContent>
    </Card>
);

const OperationsAIModule: React.FC = () => {
    const [aiInsights, setAiInsights] = useState<string>('');
    const { loading: aiLoading, analyzeOperations } = useAIAgent();
    const { toast } = useToast();
    const { activeClient } = useActiveClient();
    
    // Fetch real data from hooks
    const { kpis, benchmarks, hasData: hasOperationsData, loading: operationsLoading, isViewingClient, refetch } = useOperationsData();
    const { feedback: feedbackData, loading: feedbackLoading } = useFeedbackData();
    const { customers: loyaltyCustomers, loading: loyaltyLoading } = useLoyaltyData();
    
    // Calculate loyalty stats from customers
    const loyaltyStats = {
        totalMembers: loyaltyCustomers?.length || 0,
        vipMembers: loyaltyCustomers?.filter(c => c.tier_id === 'vip').length || 0,
        regularMembers: loyaltyCustomers?.filter(c => c.tier_id === 'regular').length || 0,
        occasionalMembers: loyaltyCustomers?.filter(c => !c.tier_id || c.tier_id === 'basic').length || 0
    };

    const isLoading = operationsLoading || feedbackLoading || loyaltyLoading;
    const hasAnyData = hasOperationsData || (feedbackData && feedbackData.length > 0) || loyaltyStats;

    const runAIAnalysis = async () => {
        const analysisData = {
            kpis,
            feedbackCount: feedbackData?.length || 0,
            loyaltyMembers: loyaltyStats?.totalMembers || 0,
            avgSatisfaction: kpis?.customerSatisfaction || 4.0
        };
        
        const analysis = await analyzeOperations(analysisData);
        
        if (analysis) {
            setAiInsights(analysis);
            toast({
                title: "Análisis IA completado",
                description: "Se han generado nuevos insights de operaciones",
            });
        }
    };

    // Build satisfaction chart from real feedback data only
    const satisfactionData = feedbackData?.slice(0, 7).map(f => f.rating || 0) || [];
    const satisfactionChart = {
        labels: feedbackData?.slice(0, 7).map((_, i) => `Sem ${i + 1}`) || [],
        datasets: [{
            label: 'Satisfacción del Cliente',
            data: satisfactionData,
            borderColor: 'hsl(var(--primary))',
            backgroundColor: 'hsl(var(--primary) / 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    // Build customer flow chart from real KPIs only
    const customerFlowChart = {
        labels: kpis?.peakHours || [],
        datasets: [
            {
                label: 'Pedidos por Hora',
                data: kpis?.peakHours?.map(() => kpis?.ordersToday ? Math.ceil(kpis.ordersToday / (kpis.peakHours?.length || 1)) : 0) || [],
                backgroundColor: 'hsl(var(--primary))',
                yAxisID: 'y'
            }
        ]
    };

    // Build loyalty distribution from real data only (no fallbacks)
    const loyaltyDistributionChart = {
        labels: ['VIP', 'Regulares', 'Ocasionales'],
        datasets: [{
            data: [
                loyaltyStats?.vipMembers || 0,
                loyaltyStats?.regularMembers || 0,
                loyaltyStats?.occasionalMembers || 0
            ],
            backgroundColor: [
                'hsl(var(--primary))',
                'hsl(var(--secondary))',
                'hsl(var(--accent))'
            ]
        }]
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-96" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-40" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    if (!hasAnyData) {
        return (
            <EmptyState
                icon={<BarChart3 className="h-12 w-12" />}
                title="Sin datos de operaciones"
                description="Comienza a registrar ventas, feedback de clientes y datos del programa de lealtad para ver análisis operativos."
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header del módulo */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center">
                        <Brain className="mr-3 text-primary" size={32} />
                        Operaciones Inteligentes y Experiencia del Cliente IA
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Usando tecnología para operar con máxima eficiencia y entregar valor excepcional
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={runAIAnalysis} 
                        disabled={aiLoading}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {aiLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Análisis IA
                    </Button>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                        IA Activa
                    </Badge>
                </div>
            </div>

            {/* AI Insights Panel */}
            {aiInsights && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center text-primary">
                            <Brain className="mr-2" size={20} />
                            Insights IA - Operaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                            {aiInsights}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <OperationsMetric
                    icon={<Star />}
                    title="Satisfacción Cliente"
                    value={`${kpis?.customerSatisfaction?.toFixed(1) || '4.0'}/5`}
                    trend="up"
                    description="Promedio ponderado omnicanal"
                    colorClass="bg-yellow-100 text-yellow-600"
                />
                <OperationsMetric
                    icon={<Heart />}
                    title="Miembros Lealtad"
                    value={`${loyaltyStats?.totalMembers || 0}`}
                    trend="up"
                    description="Clientes en programa de fidelidad"
                    colorClass="bg-pink-100 text-pink-600"
                />
                <OperationsMetric
                    icon={<Clock />}
                    title="Tiempo Promedio Orden"
                    value={`${kpis?.avgOrderTime || 18} min`}
                    trend={kpis?.avgOrderTime && benchmarks?.avgOrderTime && kpis.avgOrderTime <= benchmarks.avgOrderTime ? 'up' : 'down'}
                    description={`Benchmark: ${benchmarks?.avgOrderTime || 18} min`}
                    colorClass="bg-green-100 text-green-600"
                />
                <OperationsMetric
                    icon={<BarChart3 />}
                    title="Pedidos Hoy"
                    value={kpis?.ordersToday?.toString() || '0'}
                    trend="up"
                    description={`${kpis?.completedOrders || 0} completados`}
                    colorClass="bg-blue-100 text-blue-600"
                />
            </div>

            {/* Business Intelligence Aumentado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="mr-2 text-primary" />
                            Insights de Operaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {kpis?.peakHours && kpis.peakHours.length > 0 && (
                                <div className="p-4 bg-muted rounded-lg border-l-4 border-primary">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm mb-2">
                                                Horas pico identificadas: {kpis.peakHours.join(', ')}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                Optimiza el personal durante estas horas para mejor servicio
                                            </p>
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                                Potencial: +15% eficiencia
                                            </Badge>
                                        </div>
                                        <Zap className="text-primary ml-2" size={20} />
                                    </div>
                                </div>
                            )}
                            
                            {kpis?.queueLength !== undefined && kpis.queueLength > 0 && (
                                <div className="p-4 bg-muted rounded-lg border-l-4 border-orange-500">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm mb-2">
                                                {kpis.queueLength} pedidos en cola
                                            </h4>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                Monitorea la cola para evitar demoras excesivas
                                            </p>
                                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                                Atención requerida
                                            </Badge>
                                        </div>
                                        <Clock className="text-orange-500 ml-2" size={20} />
                                    </div>
                                </div>
                            )}

                            {feedbackData && feedbackData.length > 0 && (
                                <div className="p-4 bg-muted rounded-lg border-l-4 border-blue-500">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm mb-2">
                                                {feedbackData.length} feedbacks recibidos
                                            </h4>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                Analiza las opiniones de tus clientes para mejorar
                                            </p>
                                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                                Ver detalles en Feedback
                                            </Badge>
                                        </div>
                                        <MessageSquare className="text-blue-500 ml-2" size={20} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Flujo de Clientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <Bar 
                                data={customerFlowChart}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false }
                                    },
                                    scales: {
                                        y: {
                                            title: { display: true, text: 'Pedidos' }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Programa de Lealtad */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Gift className="mr-2 text-primary" />
                            Programa de Lealtad
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loyaltyStats ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm font-bold">{loyaltyStats.vipMembers || 0}</p>
                                        <p className="text-xs text-muted-foreground">VIP</p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm font-bold">{loyaltyStats.regularMembers || 0}</p>
                                        <p className="text-xs text-muted-foreground">Regulares</p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm font-bold">{loyaltyStats.occasionalMembers || 0}</p>
                                        <p className="text-xs text-muted-foreground">Ocasionales</p>
                                    </div>
                                </div>
                                
                                <div className="h-48">
                                    <Doughnut 
                                        data={loyaltyDistributionChart}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { position: 'bottom' as const }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Sin datos de lealtad disponibles</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Activity className="mr-2 text-primary" />
                            Evolución de Satisfacción
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <Line 
                                data={satisfactionChart}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'top' as const }
                                    },
                                    scales: {
                                        y: {
                                            title: { display: true, text: 'Satisfacción' },
                                            min: 1,
                                            max: 5
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resumen de Impacto */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Gauge className="mr-2 text-primary" />
                        Resumen Operativo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-2">
                                {kpis?.ordersToday || 0}
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Pedidos del día</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-2">
                                {kpis?.completedOrders || 0}
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Pedidos completados</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-2">
                                {loyaltyStats?.totalMembers || 0}
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Miembros lealtad</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-2">
                                {feedbackData?.length || 0}
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Feedbacks recibidos</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OperationsAIModule;