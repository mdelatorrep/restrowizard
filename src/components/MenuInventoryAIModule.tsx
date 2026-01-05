import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { 
    Brain, UtensilsCrossed, Package, TrendingUp, Zap, AlertTriangle,
    Calculator, ShoppingCart, Truck, Leaf, Star, DollarSign,
    BarChart3, PieChart, Activity, Target, RefreshCw, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';
import { useMenuItemsData } from '@/hooks/useMenuItemsData';
import { useInventoryData } from '@/hooks/useInventoryData';
import { EmptyState } from '@/components/ui/empty-state';
import { useActiveClient } from '@/contexts/ActiveClientContext';

// Mock data para el módulo de menú e inventario
const mockMenuInventoryData = {
    menuEngineering: {
        simulation: {
            currentDish: 'Bandeja Paisa',
            currentProfit: 15.2,
            scenarios: [
                { change: 'Cambiar carne por pollo', newProfit: 18.7, impact: '+23%', savings: 3500 },
                { change: 'Reducir porción arroz 15%', newProfit: 17.1, impact: '+12%', savings: 1800 },
                { change: 'Ingrediente premium (aguacate)', newProfit: 13.8, impact: '-9%', cost: 2200 }
            ]
        },
        dishPerformance: [
            { dish: 'Lomo Saltado', popularity: 85, profitability: 75, category: 'Estrella' },
            { dish: 'Bandeja Paisa', popularity: 30, profitability: 90, category: 'Vaca Lechera' },
            { dish: 'Salmón Maracuyá', popularity: 90, profitability: 25, category: 'Incógnita' },
            { dish: 'Sopa del Día', popularity: 20, profitability: 15, category: 'Perro' },
            { dish: 'Ajiaco Santafereño', popularity: 65, profitability: 88, category: 'Estrella' },
            { dish: 'Paella Mixta', popularity: 45, profitability: 55, category: 'Intermedio' }
        ]
    },
    inventoryPredictive: {
        shortage: 23, // reducción del 77%
        predictions: [
            { item: 'Carne de Res', currentStock: 25, predictedNeed: 18, status: 'Exceso', action: 'Reducir pedido 30%' },
            { item: 'Pechuga de Pollo', currentStock: 15, predictedNeed: 22, status: 'Faltante', action: 'Aumentar pedido 45%' },
            { item: 'Camarones', currentStock: 8, predictedNeed: 12, status: 'Bajo', action: 'Pedido urgente 5kg' },
            { item: 'Aguacate', currentStock: 30, predictedNeed: 35, status: 'Óptimo', action: 'Mantener nivel' }
        ],
        wasteReduction: 67,
        automatedOrders: 89
    },
    deliveryOptimization: {
        packagingInsights: [
            { dish: 'Lomo Saltado', currentPackage: 'Cartón básico', suggestedPackage: 'Compartimentos térmicos', quality: '+40%', cost: '+8%' },
            { dish: 'Sopa de Tomate', currentPackage: 'Envase plástico', suggestedPackage: 'Termo-sellado premium', quality: '+65%', cost: '+12%' },
            { dish: 'Ensalada César', currentPackage: 'Recipiente simple', suggestedPackage: 'Separadores ingredientes', quality: '+30%', cost: '+5%' }
        ],
        qualityMetrics: {
            arrivalQuality: 86,
            customerSatisfaction: 4.1,
            willingToPay: 62
        }
    },
    ecommerceEngine: {
        recommendations: [
            { customer: 'María González', historial: 'Pescados frecuentes', recommendation: 'Kit Salmón Premium + Salsa Maracuyá', likelihood: '78%' },
            { customer: 'Carlos Mendoza', historial: 'Fan de carnes', recommendation: 'Kit BBQ Casero + Marinados', likelihood: '84%' },
            { customer: 'Ana Silva', historial: 'Vegetariana', recommendation: 'Kit Ensaladas Gourmet + Aderezos', likelihood: '91%' }
        ],
        newChannels: {
            kitsRevenue: 2800000,
            retailProducts: 1200000,
            merchandise: 450000
        }
    },
    varietyBalance: {
        customerDesire: 86, // 86% quiere variedad
        current: 24,
        optimal: 18,
        recommendations: [
            'Eliminar: Sopa del Día (baja rotación)',
            'Añadir: Opción vegana principal',
            'Rotar: Postre especial mensual',
            'Simplificar: Menos variaciones de carnes'
        ]
    }
};

interface MenuMetricProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
    description: string;
    colorClass: string;
}

const MenuMetric: React.FC<MenuMetricProps> = ({ icon, title, value, trend, description, colorClass }) => (
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

const MenuInventoryAIModule: React.FC = () => {
    const [selectedSimulation, setSelectedSimulation] = useState(0);
    const [aiInsights, setAiInsights] = useState<string>('');
    const [realTimeData, setRealTimeData] = useState(mockMenuInventoryData);
    const { loading, analyzeMenu, predictInventory } = useAIAgent();
    const { toast } = useToast();
    const { activeClient } = useActiveClient();
    const { menuItems, hasData: hasMenuData, isViewingClient } = useMenuItemsData();
    const { inventory, kpis: inventoryKpis, hasData: hasInventoryData } = useInventoryData();
    
    const hasData = hasMenuData || hasInventoryData;
    const lowStockItems = inventory.filter(i => i.current_stock <= (i.reorder_point || 0));

    useEffect(() => {
        // Simulate real-time data updates
        const interval = setInterval(() => {
            setRealTimeData(prev => ({
                ...prev,
                inventoryPredictive: {
                    ...prev.inventoryPredictive,
                    shortage: Math.max(0, prev.inventoryPredictive.shortage + (Math.random() - 0.5) * 2)
                }
            }));
        }, 45000); // Update every 45 seconds

        return () => clearInterval(interval);
    }, []);

    const runAIAnalysis = async () => {
        const analysis = await analyzeMenu({
            menuItems: realTimeData.menuEngineering.dishPerformance,
            inventory: realTimeData.inventoryPredictive.predictions,
            deliveryData: realTimeData.deliveryOptimization
        });
        
        if (analysis) {
            setAiInsights(analysis);
            toast({
                title: "Análisis IA completado",
                description: "Se han generado nuevos insights de menú e inventario",
            });
        }
    };

    const dishPerformanceChart = {
        datasets: [{
            label: 'Rendimiento de Platos',
            data: mockMenuInventoryData.menuEngineering.dishPerformance.map(dish => ({
                x: dish.profitability,
                y: dish.popularity,
                label: dish.dish
            })),
            backgroundColor: mockMenuInventoryData.menuEngineering.dishPerformance.map(dish => {
                switch(dish.category) {
                    case 'Estrella': return 'rgba(34, 197, 94, 0.8)';
                    case 'Vaca Lechera': return 'rgba(59, 130, 246, 0.8)';
                    case 'Incógnita': return 'rgba(251, 146, 60, 0.8)';
                    case 'Perro': return 'rgba(239, 68, 68, 0.8)';
                    default: return 'rgba(156, 163, 175, 0.8)';
                }
            }),
            pointRadius: 8
        }]
    };

    const inventoryPredictionChart = {
        labels: mockMenuInventoryData.inventoryPredictive.predictions.map(p => p.item),
        datasets: [
            {
                label: 'Stock Actual',
                data: mockMenuInventoryData.inventoryPredictive.predictions.map(p => p.currentStock),
                backgroundColor: 'hsl(var(--muted))'
            },
            {
                label: 'Necesidad Predicha IA',
                data: mockMenuInventoryData.inventoryPredictive.predictions.map(p => p.predictedNeed),
                backgroundColor: 'hsl(var(--primary))'
            }
        ]
    };

    const newChannelsChart = {
        labels: ['Kits de Comida', 'Productos Retail', 'Mercancía'],
        datasets: [{
            data: [
                mockMenuInventoryData.ecommerceEngine.newChannels.kitsRevenue,
                mockMenuInventoryData.ecommerceEngine.newChannels.retailProducts,
                mockMenuInventoryData.ecommerceEngine.newChannels.merchandise
            ],
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
                        Menú, Inventario y Nuevas Fuentes de Ingreso IA
                    </h1>
                    <p className="text-muted-foreground font-lato-light mt-2">
                        Optimizando la oferta actual y desbloqueando nuevos canales de crecimiento
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={runAIAnalysis} 
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Análisis IA
                    </Button>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <Activity className="w-4 h-4 mr-1" />
                        Activo
                    </Badge>
                </div>
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MenuMetric
                    icon={<Calculator />}
                    title="Simulaciones de Menú"
                    value={mockMenuInventoryData.menuEngineering.simulation.scenarios.length.toString()}
                    trend="up"
                    description="Escenarios analizados"
                    colorClass="bg-blue-100 text-blue-600"
                />
                <MenuMetric
                    icon={<Package />}
                    title="Reducción Escasez"
                    value={`${realTimeData.inventoryPredictive.shortage.toFixed(0)}%`}
                    trend="up"
                    description="vs. gestión manual"
                    colorClass="bg-green-100 text-green-600"
                />
                <MenuMetric
                    icon={<Truck />}
                    title="Calidad Delivery"
                    value={`${mockMenuInventoryData.deliveryOptimization.qualityMetrics.arrivalQuality}%`}
                    trend="up"
                    description="Llegada en condiciones óptimas"
                    colorClass="bg-orange-100 text-orange-600"
                />
                <MenuMetric
                    icon={<ShoppingCart />}
                    title="Nuevos Canales"
                    value={`$${(Object.values(mockMenuInventoryData.ecommerceEngine.newChannels).reduce((a, b) => a + b, 0) / 1000000).toFixed(1)}M`}
                    trend="up"
                    description="Ingresos mensuales adicionales"
                    colorClass="bg-purple-100 text-purple-600"
                />
            </div>

            {/* Ingeniería de Menú y Simulación */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <PieChart className="mr-2 text-primary" />
                            Matriz de Rendimiento de Platos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <Scatter 
                                data={dishPerformanceChart}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context: any) {
                                                    const point = mockMenuInventoryData.menuEngineering.dishPerformance.find(
                                                        p => p.profitability === context.parsed.x && p.popularity === context.parsed.y
                                                    );
                                                    return point ? `${point.dish} (${point.category})` : '';
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        x: { 
                                            title: { display: true, text: 'Rentabilidad (%)' }, 
                                            min: 0, 
                                            max: 100 
                                        },
                                        y: { 
                                            title: { display: true, text: 'Popularidad (%)' }, 
                                            min: 0, 
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
                        <CardTitle className="text-lg">Simulador de Menú IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-3 bg-muted rounded-lg">
                                <h4 className="font-lato-bold text-sm mb-1">Plato Analizado</h4>
                                <p className="text-lg font-lato-bold text-primary">
                                    {mockMenuInventoryData.menuEngineering.simulation.currentDish}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Rentabilidad actual: {mockMenuInventoryData.menuEngineering.simulation.currentProfit}%
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="font-lato-bold text-sm">Simulaciones IA:</h4>
                                {mockMenuInventoryData.menuEngineering.simulation.scenarios.map((scenario, i) => (
                                    <div key={i} className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-lato-bold">{scenario.change}</span>
                                            <Badge variant="outline" className={
                                                scenario.impact.startsWith('+') ? 'text-green-600' : 'text-red-600'
                                            }>
                                                {scenario.impact}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-muted-foreground">Nueva rentabilidad:</span>
                                            <span className="text-xs font-lato-bold text-primary">{scenario.newProfit}%</span>
                                        </div>
                                        {scenario.savings && (
                                            <p className="text-xs text-green-600 font-lato-medium">
                                                Ahorro: ${new Intl.NumberFormat().format(scenario.savings)}/mes
                                            </p>
                                        )}
                                        {scenario.cost && (
                                            <p className="text-xs text-red-600 font-lato-medium">
                                                Costo extra: ${new Intl.NumberFormat().format(scenario.cost)}/mes
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gestión de Inventario Predictivo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="mr-2 text-primary" />
                            Gestión de Inventario Predictivo IA
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <Bar 
                                data={inventoryPredictionChart}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'top' as const }
                                    },
                                    scales: {
                                        y: {
                                            title: { display: true, text: 'Cantidad (kg)' }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recomendaciones de Compra IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {mockMenuInventoryData.inventoryPredictive.predictions.map((pred, i) => (
                                <div key={i} className={`p-3 rounded-lg border-l-4 ${
                                    pred.status === 'Faltante' ? 'bg-red-50 border-red-500' :
                                    pred.status === 'Exceso' ? 'bg-orange-50 border-orange-500' :
                                    pred.status === 'Bajo' ? 'bg-yellow-50 border-yellow-500' :
                                    'bg-green-50 border-green-500'
                                }`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-lato-bold text-sm">{pred.item}</h4>
                                        <Badge variant="outline" className={
                                            pred.status === 'Faltante' ? 'text-red-600' :
                                            pred.status === 'Exceso' ? 'text-orange-600' :
                                            pred.status === 'Bajo' ? 'text-yellow-600' :
                                            'text-green-600'
                                        }>
                                            {pred.status}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Stock actual:</span>
                                            <span className="font-lato-medium">{pred.currentStock} kg</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Necesidad predicha:</span>
                                            <span className="font-lato-medium">{pred.predictedNeed} kg</span>
                                        </div>
                                        <p className="text-xs text-primary font-lato-bold mt-2">
                                            IA Sugiere: {pred.action}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Optimización de Delivery y E-commerce */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Package className="mr-2 text-primary" />
                            Optimización de Empaques IA
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {mockMenuInventoryData.deliveryOptimization.packagingInsights.map((insight, i) => (
                                <div key={i} className="p-3 bg-muted rounded-lg">
                                    <h4 className="font-lato-bold text-sm mb-2">{insight.dish}</h4>
                                    <div className="space-y-2">
                                        <div className="text-xs">
                                            <span className="text-muted-foreground">Actual: </span>
                                            <span className="font-lato-medium">{insight.currentPackage}</span>
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-muted-foreground">IA Sugiere: </span>
                                            <span className="font-lato-medium text-primary">{insight.suggestedPackage}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                Calidad {insight.quality}
                                            </Badge>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                                Costo {insight.cost}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Target className="mr-2 text-primary" />
                            Motor de Recomendación E-commerce
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {mockMenuInventoryData.ecommerceEngine.recommendations.map((rec, i) => (
                                <div key={i} className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-lato-bold text-sm">{rec.customer}</h4>
                                        <Badge variant="outline" className="text-xs text-green-600">
                                            {rec.likelihood} conversión
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                        Perfil: {rec.historial}
                                    </p>
                                    <p className="text-xs font-lato-bold text-primary">
                                        IA Recomienda: {rec.recommendation}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Nuevos Canales de Ingreso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="h-48">
                                <Doughnut 
                                    data={newChannelsChart}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { position: 'bottom' as const }
                                        }
                                    }}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-lato-medium">Total Ingresos Nuevos:</span>
                                    <span className="font-lato-bold text-primary">
                                        ${new Intl.NumberFormat().format(
                                            Object.values(mockMenuInventoryData.ecommerceEngine.newChannels)
                                                .reduce((a, b) => a + b, 0)
                                        )}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Ingresos mensuales de canales que el 73% de clientes demanda activamente
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Balance de Variedad */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Star className="mr-2 text-primary" />
                        Balance Inteligente de Variedad vs. Control de Costos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-lato-bold text-lg mb-3">Análisis de Variedad IA</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-lato-medium">Demanda de Variedad:</span>
                                        <span className="font-lato-bold text-primary">{mockMenuInventoryData.varietyBalance.customerDesire}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-lato-medium">Opciones Actuales:</span>
                                        <span className="font-lato-bold">{mockMenuInventoryData.varietyBalance.current}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-lato-medium">IA Recomienda:</span>
                                        <span className="font-lato-bold text-green-600">{mockMenuInventoryData.varietyBalance.optimal}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="font-lato-bold text-sm">Impacto Económico</h4>
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="p-2 bg-green-50 rounded">
                                        <p className="text-lg font-lato-bold text-green-600">-{mockMenuInventoryData.inventoryPredictive.wasteReduction}%</p>
                                        <p className="text-xs text-muted-foreground">Reducción merma</p>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded">
                                        <p className="text-lg font-lato-bold text-blue-600">{mockMenuInventoryData.inventoryPredictive.automatedOrders}%</p>
                                        <p className="text-xs text-muted-foreground">Órdenes automatizadas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <h4 className="font-lato-bold text-sm">Recomendaciones de Optimización IA:</h4>
                            {mockMenuInventoryData.varietyBalance.recommendations.map((rec, i) => (
                                <div key={i} className="p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                                    <p className="text-sm font-lato-medium">{rec}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Insights Panel */}
            {aiInsights && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Brain className="mr-2 text-primary" />
                            Insights del Agente IA
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-primary/5 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">{aiInsights}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MenuInventoryAIModule;