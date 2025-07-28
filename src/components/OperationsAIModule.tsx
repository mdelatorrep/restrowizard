import React, { useState } from 'react';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { 
    Brain, Target, Heart, TrendingUp, Zap, Eye, MessageSquare,
    Clock, Star, ChefHat, Smartphone, BarChart3, Users,
    Activity, Gauge, Gift, Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data para el módulo de operaciones
const mockOperationsData = {
    businessIntelligence: {
        salesInsights: [
            { insight: 'Lomo Saltado + Chicha Morada se ordenan juntos 67% de las veces', action: 'Crear combo "Tradición Peruana"', revenue: '+15%' },
            { insight: 'Clientes que piden postre gastan 40% más', action: 'Capacitar meseros en sugerencias de postre', revenue: '+22%' },
            { insight: 'Viernes pico de ventas de bebidas alcohólicas', action: 'Promocionar cócteles en redes los jueves', revenue: '+18%' }
        ],
        customerFlow: [
            { hour: '11-12', customers: 15, satisfaction: 4.8, avgSpend: 28000 },
            { hour: '12-13', customers: 45, satisfaction: 4.6, avgSpend: 32000 },
            { hour: '13-14', customers: 38, satisfaction: 4.5, avgSpend: 30000 },
            { hour: '18-19', customers: 52, satisfaction: 4.7, avgSpend: 45000 },
            { hour: '19-20', customers: 68, satisfaction: 4.4, avgSpend: 42000 },
            { hour: '20-21', customers: 41, satisfaction: 4.6, avgSpend: 38000 }
        ]
    },
    loyaltyProgram: {
        membershipRate: 19, // 81% no miembros
        memberSegments: [
            { segment: 'VIP Frecuentes', count: 156, avgSpend: 85000, frequency: 'Semanal' },
            { segment: 'Regulares', count: 324, avgSpend: 45000, frequency: 'Quincenal' },
            { segment: 'Ocasionales', count: 198, avgSpend: 32000, frequency: 'Mensual' }
        ],
        personalizedOffers: [
            { customer: 'María González', preference: 'Pescados', offer: '20% desc. en Salmón Maracuyá', likelihood: '89%' },
            { customer: 'Carlos Mendoza', preference: 'Carnes', offer: 'Lomo gratis en compra +$60k', likelihood: '76%' },
            { customer: 'Ana Rodríguez', preference: 'Vegetariano', offer: 'Nueva ensalada premium', likelihood: '92%' }
        ]
    },
    predictiveMarketing: {
        riskCustomers: [
            { name: 'Pedro Silva', lastVisit: '45 días', riskLevel: 'Alto', suggestedAction: 'Cupón 30% + mensaje personalizado' },
            { name: 'Lucía Torres', lastVisit: '28 días', riskLevel: 'Medio', suggestedAction: 'Invitación a probar nuevo menú' },
            { name: 'Diego Vargas', lastVisit: '21 días', riskLevel: 'Bajo', suggestedAction: 'Recordatorio de puntos acumulados' }
        ],
        campaignResults: {
            retention: 73,
            newServiceUptake: 24, // kits de comida
            avgCampaignROI: 340
        }
    },
    customerExperience: {
        satisfactionTrend: [85, 87, 89, 88, 92, 94, 96],
        touchpoints: [
            { channel: 'En Local', satisfaction: 4.6, volume: 75 },
            { channel: 'Delivery', satisfaction: 4.2, volume: 45 },
            { channel: 'Takeaway', satisfaction: 4.4, volume: 25 },
            { channel: 'Reservas Online', satisfaction: 4.8, volume: 15 }
        ],
        feedbackAnalysis: {
            positive: ['servicio rápido', 'ambiente acogedor', 'comida deliciosa', 'buena presentación'],
            negative: ['tiempo de espera', 'precio alto', 'ruido excesivo', 'delivery frío'],
            suggestions: ['más opciones veganas', 'música más suave', 'descuentos estudiantes', 'empaques ecológicos']
        }
    }
};

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
                <h3 className="text-2xl font-lato-bold text-foreground">{value}</h3>
                <p className="text-sm font-lato-medium text-muted-foreground">{title}</p>
                <p className="text-xs font-lato-light text-muted-foreground mt-1">{description}</p>
            </div>
        </CardContent>
    </Card>
);

const OperationsAIModule: React.FC = () => {
    const [selectedTimeframe, setSelectedTimeframe] = useState('week');

    const satisfactionChart = {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7'],
        datasets: [{
            label: 'Satisfacción del Cliente (%)',
            data: mockOperationsData.customerExperience.satisfactionTrend,
            borderColor: 'hsl(var(--primary))',
            backgroundColor: 'hsl(var(--primary) / 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const customerFlowChart = {
        labels: mockOperationsData.businessIntelligence.customerFlow.map(d => d.hour),
        datasets: [
            {
                label: 'Número de Clientes',
                data: mockOperationsData.businessIntelligence.customerFlow.map(d => d.customers),
                backgroundColor: 'hsl(var(--primary))',
                yAxisID: 'y'
            },
            {
                label: 'Gasto Promedio (k)',
                data: mockOperationsData.businessIntelligence.customerFlow.map(d => d.avgSpend / 1000),
                backgroundColor: 'hsl(var(--secondary))',
                yAxisID: 'y1'
            }
        ]
    };

    const loyaltyDistributionChart = {
        labels: mockOperationsData.loyaltyProgram.memberSegments.map(s => s.segment),
        datasets: [{
            data: mockOperationsData.loyaltyProgram.memberSegments.map(s => s.count),
            backgroundColor: [
                'hsl(var(--primary))',
                'hsl(var(--secondary))',
                'hsl(var(--accent))'
            ]
        }]
    };

    return (
        <div className="space-y-6">
            {/* Header del módulo */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-lato-bold text-foreground flex items-center">
                        <Brain className="mr-3 text-primary" size={32} />
                        Operaciones Inteligentes y Experiencia del Cliente IA
                    </h1>
                    <p className="text-muted-foreground font-lato-light mt-2">
                        Usando tecnología para operar con máxima eficiencia y entregar valor excepcional
                    </p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                    IA Activa
                </Badge>
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <OperationsMetric
                    icon={<Star />}
                    title="Satisfacción Cliente"
                    value="4.6/5"
                    trend="up"
                    description="Promedio ponderado omnicanal"
                    colorClass="bg-yellow-100 text-yellow-600"
                />
                <OperationsMetric
                    icon={<Heart />}
                    title="Tasa de Lealtad"
                    value={`${mockOperationsData.loyaltyProgram.membershipRate}%`}
                    trend="up"
                    description="Potencial 81% disponible"
                    colorClass="bg-pink-100 text-pink-600"
                />
                <OperationsMetric
                    icon={<Target />}
                    title="ROI Campañas IA"
                    value={`${mockOperationsData.predictiveMarketing.campaignResults.avgCampaignROI}%`}
                    trend="up"
                    description="Retorno promedio de inversión"
                    colorClass="bg-green-100 text-green-600"
                />
                <OperationsMetric
                    icon={<BarChart3 />}
                    title="Insights Accionables"
                    value={mockOperationsData.businessIntelligence.salesInsights.length.toString()}
                    trend="up"
                    description="Recomendaciones activas IA"
                    colorClass="bg-blue-100 text-blue-600"
                />
            </div>

            {/* Business Intelligence Aumentado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="mr-2 text-primary" />
                            Business Intelligence Aumentado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockOperationsData.businessIntelligence.salesInsights.map((insight, i) => (
                                <div key={i} className="p-4 bg-muted rounded-lg border-l-4 border-primary">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-lato-bold text-sm mb-2">{insight.insight}</h4>
                                            <p className="text-xs text-muted-foreground font-lato-light mb-2">{insight.action}</p>
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                                Potencial: {insight.revenue}
                                            </Badge>
                                        </div>
                                        <Zap className="text-primary ml-2" size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Análisis de Flujo de Clientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <Bar 
                                data={customerFlowChart}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    interaction: { mode: 'index' as const, intersect: false },
                                    scales: {
                                        y: {
                                            type: 'linear' as const,
                                            display: true,
                                            position: 'left' as const,
                                            title: { display: true, text: 'Clientes' }
                                        },
                                        y1: {
                                            type: 'linear' as const,
                                            display: true,
                                            position: 'right' as const,
                                            title: { display: true, text: 'Gasto (miles COP)' },
                                            grid: { drawOnChartArea: false }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Hiper-Personalización de Lealtad */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Gift className="mr-2 text-primary" />
                            Hiper-Personalización de Lealtad IA
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                {mockOperationsData.loyaltyProgram.memberSegments.map((segment, i) => (
                                    <div key={i} className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm font-lato-bold">{segment.count}</p>
                                        <p className="text-xs text-muted-foreground">{segment.segment}</p>
                                        <p className="text-xs text-primary font-lato-bold">
                                            ${new Intl.NumberFormat().format(segment.avgSpend)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="font-lato-bold text-sm">Ofertas Personalizadas Activas:</h4>
                                {mockOperationsData.loyaltyProgram.personalizedOffers.map((offer, i) => (
                                    <div key={i} className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-lato-bold text-sm">{offer.customer}</span>
                                            <Badge variant="outline" className="text-xs text-green-600">
                                                {offer.likelihood} conversión
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{offer.offer}</p>
                                        <p className="text-xs text-primary font-lato-medium">Preferencia: {offer.preference}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Mail className="mr-2 text-primary" />
                            Marketing Predictivo IA
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <h4 className="font-lato-bold text-red-600 mb-2">Clientes en Riesgo</h4>
                                <div className="text-2xl font-lato-bold text-red-600">
                                    {mockOperationsData.predictiveMarketing.riskCustomers.length}
                                </div>
                                <p className="text-xs text-muted-foreground">Requieren intervención inmediata</p>
                            </div>
                            
                            <div className="space-y-2">
                                {mockOperationsData.predictiveMarketing.riskCustomers.map((customer, i) => (
                                    <div key={i} className={`p-3 rounded-lg border-l-4 ${
                                        customer.riskLevel === 'Alto' ? 'bg-red-50 border-red-500' :
                                        customer.riskLevel === 'Medio' ? 'bg-orange-50 border-orange-500' :
                                        'bg-yellow-50 border-yellow-500'
                                    }`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-lato-bold text-sm">{customer.name}</span>
                                            <Badge variant="outline" className={
                                                customer.riskLevel === 'Alto' ? 'text-red-600' :
                                                customer.riskLevel === 'Medio' ? 'text-orange-600' :
                                                'text-yellow-600'
                                            }>
                                                {customer.riskLevel}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Última visita: {customer.lastVisit}
                                        </p>
                                        <p className="text-xs text-primary font-lato-medium">
                                            IA Sugiere: {customer.suggestedAction}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Experiencia del Cliente y Análisis de Satisfacción */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Activity className="mr-2 text-primary" />
                            Evolución de Satisfacción del Cliente
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
                                            title: { display: true, text: 'Satisfacción (%)' },
                                            min: 80,
                                            max: 100
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Análisis de Feedback IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-lato-bold text-green-600 mb-2 flex items-center">
                                    <TrendingUp className="mr-1" size={16} />
                                    Aspectos Positivos
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {mockOperationsData.customerExperience.feedbackAnalysis.positive.map((item, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs bg-green-100 text-green-700">
                                            {item}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-lato-bold text-red-600 mb-2 flex items-center">
                                    <Target className="mr-1" size={16} />
                                    Áreas de Mejora
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {mockOperationsData.customerExperience.feedbackAnalysis.negative.map((item, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs bg-red-100 text-red-700">
                                            {item}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-lato-bold text-blue-600 mb-2 flex items-center">
                                    <Eye className="mr-1" size={16} />
                                    Sugerencias de Clientes
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {mockOperationsData.customerExperience.feedbackAnalysis.suggestions.map((item, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                            {item}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resumen de Impacto */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Gauge className="mr-2 text-primary" />
                        Impacto de la IA en Operaciones y CX
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-lato-bold text-primary mb-2">79%</div>
                            <p className="text-sm font-lato-medium text-muted-foreground">Mejora en atracción</p>
                            <p className="text-xs font-lato-light text-muted-foreground mt-1">de nuevos clientes</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-lato-bold text-primary mb-2">{mockOperationsData.predictiveMarketing.campaignResults.retention}%</div>
                            <p className="text-sm font-lato-medium text-muted-foreground">Efectividad retención</p>
                            <p className="text-xs font-lato-light text-muted-foreground mt-1">campañas predictivas</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-lato-bold text-primary mb-2">{mockOperationsData.predictiveMarketing.campaignResults.newServiceUptake}%</div>
                            <p className="text-sm font-lato-medium text-muted-foreground">Adopción kits comida</p>
                            <p className="text-xs font-lato-light text-muted-foreground mt-1">nuevo canal de ingresos</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-lato-bold text-primary mb-2">4.6</div>
                            <p className="text-sm font-lato-medium text-muted-foreground">Satisfacción promedio</p>
                            <p className="text-xs font-lato-light text-muted-foreground mt-1">+12% vs. año anterior</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OperationsAIModule;