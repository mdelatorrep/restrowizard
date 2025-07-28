import React, { useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
    TrendingUp, TrendingDown, AlertTriangle, DollarSign, 
    Calculator, Brain, Zap, Target, PieChart, BarChart3,
    Activity, Gauge
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data para el módulo de finanzas
const mockFinancesData = {
    profitabilityPrediction: {
        current: 15.2,
        predicted: 18.5,
        trend: 'up',
        confidence: 87
    },
    costAnomalies: [
        { item: 'Carne de Res', currentPrice: 28000, normalPrice: 25000, increase: 12, severity: 'high' },
        { item: 'Servicios Públicos', currentCost: 450000, normalCost: 380000, increase: 18, severity: 'critical' },
        { item: 'Aceite de Cocina', currentPrice: 8500, normalPrice: 7200, increase: 18, severity: 'medium' }
    ],
    dynamicPricing: {
        recommendations: [
            { dish: 'Lomo Saltado', currentPrice: 32000, suggestedPrice: 35000, reason: 'Alta demanda en horario pico', impact: '+15% ingresos' },
            { dish: 'Bandeja Paisa', currentPrice: 28000, suggestedPrice: 26000, reason: 'Baja rotación, reducir para impulsar ventas', impact: '+8% ventas' },
            { dish: 'Ajiaco', currentPrice: 22000, suggestedPrice: 24000, reason: 'Ingredientes económicos disponibles', impact: '+22% margen' }
        ]
    },
    cashFlowSimulation: {
        scenarios: [
            { name: 'Optimista', cashFlow: 15500000, debtReduction: 2800000, months: 8 },
            { name: 'Realista', cashFlow: 12200000, debtReduction: 2100000, months: 12 },
            { name: 'Pesimista', cashFlow: 8900000, debtReduction: 1400000, months: 18 }
        ]
    },
    revenueOptimization: [
        { hour: '6-8', traffic: 20, currentRevenue: 850000, optimizedRevenue: 1100000, improvement: 29 },
        { hour: '12-14', traffic: 95, currentRevenue: 3200000, optimizedRevenue: 3680000, improvement: 15 },
        { hour: '19-21', traffic: 85, currentRevenue: 2800000, optimizedRevenue: 3360000, improvement: 20 },
        { hour: '21-23', traffic: 35, currentRevenue: 950000, optimizedRevenue: 760000, improvement: -20 }
    ]
};

interface MetricCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
    description: string;
    colorClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, trend, description, colorClass }) => (
    <Card className="relative overflow-hidden">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className={`rounded-full p-3 ${colorClass}`}>
                    {React.cloneElement(icon as React.ReactElement, { size: 24 })}
                </div>
                {trend && (
                    <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {trend === 'up' ? <TrendingUp size={20} /> : trend === 'down' ? <TrendingDown size={20} /> : <Activity size={20} />}
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

const FinancesAIModule: React.FC = () => {
    const [selectedScenario, setSelectedScenario] = useState('Realista');

    const profitabilityChart = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        datasets: [
            {
                label: 'Rentabilidad Real',
                data: [12.5, 14.2, 13.8, 15.1, 16.2, 15.8, 17.1, 16.5, 15.2, 0, 0, 0],
                borderColor: 'hsl(var(--primary))',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Predicción IA',
                data: [0, 0, 0, 0, 0, 0, 0, 0, 15.2, 16.8, 18.2, 18.5],
                borderColor: 'hsl(var(--secondary))',
                backgroundColor: 'hsl(var(--secondary) / 0.1)',
                borderDash: [5, 5],
                fill: true,
                tension: 0.4
            }
        ]
    };

    const revenueOptimizationChart = {
        labels: mockFinancesData.revenueOptimization.map(d => d.hour),
        datasets: [
            {
                label: 'Ingresos Actuales',
                data: mockFinancesData.revenueOptimization.map(d => d.currentRevenue),
                backgroundColor: 'hsl(var(--muted))'
            },
            {
                label: 'Ingresos Optimizados IA',
                data: mockFinancesData.revenueOptimization.map(d => d.optimizedRevenue),
                backgroundColor: 'hsl(var(--primary))'
            }
        ]
    };

    return (
        <div className="space-y-6">
            {/* Header del módulo */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-lato-bold text-foreground flex items-center">
                        <Brain className="mr-3 text-primary" size={32} />
                        Finanzas y Control de Rentabilidad IA
                    </h1>
                    <p className="text-muted-foreground font-lato-light mt-2">
                        Transformando la gestión financiera de reactiva a predictiva con inteligencia artificial
                    </p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                    IA Activa
                </Badge>
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    icon={<Target />}
                    title="Rentabilidad Predictiva"
                    value={`${mockFinancesData.profitabilityPrediction.predicted}%`}
                    trend="up"
                    description={`Confianza: ${mockFinancesData.profitabilityPrediction.confidence}%`}
                    colorClass="bg-green-100 text-green-600"
                />
                <MetricCard
                    icon={<AlertTriangle />}
                    title="Anomalías Detectadas"
                    value={mockFinancesData.costAnomalies.length.toString()}
                    trend="down"
                    description="Requieren atención inmediata"
                    colorClass="bg-red-100 text-red-600"
                />
                <MetricCard
                    icon={<Zap />}
                    title="Precios Dinámicos"
                    value={mockFinancesData.dynamicPricing.recommendations.length.toString()}
                    trend="up"
                    description="Recomendaciones activas"
                    colorClass="bg-blue-100 text-blue-600"
                />
                <MetricCard
                    icon={<Calculator />}
                    title="Optimización Ingresos"
                    value="+18%"
                    trend="up"
                    description="Potencial de mejora promedio"
                    colorClass="bg-purple-100 text-purple-600"
                />
            </div>

            {/* Análisis de Rentabilidad Predictiva */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <PieChart className="mr-2 text-primary" />
                            Análisis de Rentabilidad Predictiva
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <Line 
                                data={profitabilityChart}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'top' as const }
                                    },
                                    scales: {
                                        y: {
                                            title: { display: true, text: 'Rentabilidad (%)' }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Detección de Anomalías en Costos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockFinancesData.costAnomalies.map((anomaly, i) => (
                                <div key={i} className={`p-3 rounded-lg border-l-4 ${
                                    anomaly.severity === 'critical' ? 'bg-red-50 border-red-500' :
                                    anomaly.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                                    'bg-yellow-50 border-yellow-500'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-lato-bold text-sm">{anomaly.item}</h4>
                                        <Badge variant="outline" className={
                                            anomaly.severity === 'critical' ? 'text-red-600' :
                                            anomaly.severity === 'high' ? 'text-orange-600' :
                                            'text-yellow-600'
                                        }>
                                            +{anomaly.increase}%
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-lato-light mt-1">
                                        ${new Intl.NumberFormat().format(anomaly.currentPrice)} 
                                        (normal: ${new Intl.NumberFormat().format(anomaly.normalPrice)})
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Motor de Precios Dinámicos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Gauge className="mr-2 text-primary" />
                        Motor de Precios Dinámicos IA
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {mockFinancesData.dynamicPricing.recommendations.map((rec, i) => (
                            <div key={i} className="p-4 bg-muted rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-lato-bold">{rec.dish}</h4>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground line-through">
                                            ${new Intl.NumberFormat().format(rec.currentPrice)}
                                        </p>
                                        <p className="font-lato-bold text-primary">
                                            ${new Intl.NumberFormat().format(rec.suggestedPrice)}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground font-lato-light mb-2">{rec.reason}</p>
                                <Badge variant="secondary" className="text-xs">
                                    {rec.impact}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Optimización de Ingresos por Hora */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="mr-2 text-primary" />
                            Optimización de Ingresos por Horario
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <Bar 
                                data={revenueOptimizationChart}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'top' as const }
                                    },
                                    scales: {
                                        y: {
                                            title: { display: true, text: 'Ingresos (COP)' },
                                            ticks: {
                                                callback: (value) => `${((value as number) / 1000000).toFixed(1)}M`
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Planificación Financiera Inteligente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex space-x-2">
                                {mockFinancesData.cashFlowSimulation.scenarios.map((scenario) => (
                                    <Button
                                        key={scenario.name}
                                        variant={selectedScenario === scenario.name ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedScenario(scenario.name)}
                                        className="text-xs"
                                    >
                                        {scenario.name}
                                    </Button>
                                ))}
                            </div>
                            
                            {mockFinancesData.cashFlowSimulation.scenarios
                                .filter(s => s.name === selectedScenario)
                                .map((scenario) => (
                                <div key={scenario.name} className="space-y-3">
                                    <div className="p-4 bg-muted rounded-lg">
                                        <h4 className="font-lato-bold text-lg mb-2">Escenario {scenario.name}</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-lato-medium">Flujo de Caja Proyectado:</span>
                                                <span className="font-lato-bold text-primary">
                                                    ${new Intl.NumberFormat().format(scenario.cashFlow)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-lato-medium">Reducción de Deuda:</span>
                                                <span className="font-lato-bold text-green-600">
                                                    ${new Intl.NumberFormat().format(scenario.debtReduction)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-lato-medium">Tiempo de Saneamiento:</span>
                                                <span className="font-lato-bold">
                                                    {scenario.months} meses
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FinancesAIModule;