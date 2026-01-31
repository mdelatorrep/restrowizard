import React, { useState } from 'react';
import { Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { 
    Brain, Package, TrendingUp,
    Calculator, ShoppingCart, Truck, Star,
    PieChart, Activity, Target, RefreshCw, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';
import { useMenuItemsData } from '@/hooks/useMenuItemsData';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useMenuEngineeringData } from '@/hooks/useMenuEngineeringData';
import { useActiveClient } from '@/contexts/ActiveClientContext';
import { EmptyState } from '@/components/ui/empty-state';
import SupplierAnalyzer from '@/components/SupplierAnalyzer';
import { BCGMatrixView } from '@/components/menu-engineering/BCGMatrixView';

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
    const [aiInsights, setAiInsights] = useState<string>('');
    const { loading: aiLoading, analyzeMenu } = useAIAgent();
    const { toast } = useToast();
    const { activeClient } = useActiveClient();
    const { menuItems, kpis: menuKpis, hasData: hasMenuData, isViewingClient, loading: menuLoading } = useMenuItemsData();
    const { inventory, kpis: inventoryKpis, hasData: hasInventoryData, loading: inventoryLoading } = useInventoryData();
    const { menuItems: menuItemsWithCosts, insights: engineeringKpis, loading: engineeringLoading } = useMenuEngineeringData();
    
    const isLoading = menuLoading || inventoryLoading || engineeringLoading;
    const hasData = hasMenuData || hasInventoryData;
    const lowStockItems = inventory.filter(i => i.current_stock <= (i.reorder_point || 0));

    const runAIAnalysis = async () => {
        const analysisData = {
            menuItems: menuItemsWithCosts.map(item => ({
                name: item.name,
                price: item.price,
                cost: item.recipe_cost || 0,
                margin: item.margin_percent || 0,
                category: item.bcg_category
            })),
            inventory: inventory.map(item => ({
                name: item.item_name,
                stock: item.current_stock,
                reorderPoint: item.reorder_point,
                status: item.current_stock <= (item.reorder_point || 0) ? 'Bajo' : 'Normal'
            })),
            kpis: {
                totalItems: menuKpis?.totalItems || 0,
                avgMargin: engineeringKpis?.avgMargin || 0,
                lowStockCount: lowStockItems.length
            }
        };
        
        const analysis = await analyzeMenu(analysisData);
        
        if (analysis) {
            setAiInsights(analysis);
            toast({
                title: "Análisis IA completado",
                description: "Se han generado nuevos insights de menú e inventario",
            });
        }
    };

    // Build BCG chart from real data
    const bcgChartData = {
        datasets: [{
            label: 'Rendimiento de Platos',
            data: menuItemsWithCosts.map(item => ({
                x: item.profitability_score || (item.margin_percent || 50),
                y: item.popularity_score || 50,
                label: item.name
            })),
            backgroundColor: menuItemsWithCosts.map(item => {
                switch(item.bcg_category) {
                    case 'star': return 'rgba(34, 197, 94, 0.8)';
                    case 'cash_cow': return 'rgba(59, 130, 246, 0.8)';
                    case 'question_mark': return 'rgba(251, 146, 60, 0.8)';
                    case 'dog': return 'rgba(239, 68, 68, 0.8)';
                    default: return 'rgba(156, 163, 175, 0.8)';
                }
            }),
            pointRadius: 8
        }]
    };

    // Inventory chart from real data
    const inventoryChartData = {
        labels: inventory.slice(0, 6).map(i => i.item_name),
        datasets: [
            {
                label: 'Stock Actual',
                data: inventory.slice(0, 6).map(i => i.current_stock),
                backgroundColor: 'hsl(var(--muted))'
            },
            {
                label: 'Punto de Reorden',
                data: inventory.slice(0, 6).map(i => i.reorder_point || 0),
                backgroundColor: 'hsl(var(--primary))'
            }
        ]
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
            </div>
        );
    }

    if (!hasData) {
        return (
            <EmptyState
                icon={<PieChart className="h-12 w-12" />}
                title="Sin datos de menú o inventario"
                description="Agrega productos a tu menú y registra inventario para ver análisis de ingeniería de menú."
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-lato-bold text-foreground flex items-center">
                        <Brain className="mr-3 text-primary" size={32} />
                        Ingeniería de Menú e Inventario IA
                    </h1>
                    <p className="text-muted-foreground font-lato-light mt-2">
                        Optimiza tu oferta basándote en datos reales de rentabilidad y popularidad
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={runAIAnalysis} 
                        disabled={aiLoading}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
                        Análisis IA
                    </Button>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <Activity className="w-4 h-4 mr-1" />
                        Datos Reales
                    </Badge>
                </div>
            </div>

            {/* AI Insights */}
            {aiInsights && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center text-primary">
                            <Brain className="mr-2" size={20} />
                            Insights IA - Menú e Inventario
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                            {aiInsights}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Tabs */}
            <Tabs defaultValue="menu-engineering" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="menu-engineering">
                        <PieChart className="h-4 w-4 mr-2" />
                        Ingeniería de Menú
                    </TabsTrigger>
                    <TabsTrigger value="inventory">
                        <Package className="h-4 w-4 mr-2" />
                        Inventario
                    </TabsTrigger>
                    <TabsTrigger value="supplier-analyzer">
                        <Search className="h-4 w-4 mr-2" />
                        Analizador Proveedores
                    </TabsTrigger>
                    <TabsTrigger value="bcg-matrix">
                        <Target className="h-4 w-4 mr-2" />
                        Matriz BCG
                    </TabsTrigger>
                </TabsList>

                {/* Menu Engineering Tab */}
                <TabsContent value="menu-engineering" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MenuMetric
                            icon={<Calculator />}
                            title="Productos en Menú"
                            value={menuKpis?.totalItems.toString() || '0'}
                            trend="neutral"
                            description={`${menuKpis?.categoriesCount || 0} categorías`}
                            colorClass="bg-blue-100 text-blue-600"
                        />
                        <MenuMetric
                            icon={<Target />}
                            title="Margen Promedio"
                            value={`${engineeringKpis?.avgMargin?.toFixed(1) || 0}%`}
                            trend={engineeringKpis?.avgMargin && engineeringKpis.avgMargin > 60 ? 'up' : 'down'}
                            description="Rentabilidad del menú"
                            colorClass="bg-green-100 text-green-600"
                        />
                        <MenuMetric
                            icon={<Star />}
                            title="Productos Estrella"
                            value={menuItemsWithCosts.filter(i => i.bcg_category === 'star').length.toString()}
                            trend="up"
                            description="Alta popularidad + rentabilidad"
                            colorClass="bg-yellow-100 text-yellow-600"
                        />
                        <MenuMetric
                            icon={<Package />}
                            title="Stock Bajo"
                            value={lowStockItems.length.toString()}
                            trend={lowStockItems.length > 0 ? 'down' : 'up'}
                            description="Productos bajo punto de reorden"
                            colorClass="bg-red-100 text-red-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <PieChart className="mr-2 text-primary" />
                                    Rendimiento de Productos (Popularidad vs Rentabilidad)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {menuItemsWithCosts.length > 0 ? (
                                    <div className="h-80">
                                        <Scatter 
                                            data={bcgChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { display: false },
                                                    tooltip: {
                                                        callbacks: {
                                                            label: function(context: any) {
                                                                const item = menuItemsWithCosts[context.dataIndex];
                                                                return item ? `${item.name} - Margen: ${(item.margin_percent || 0).toFixed(1)}%` : '';
                                                            }
                                                        }
                                                    }
                                                },
                                                scales: {
                                                    x: { title: { display: true, text: 'Rentabilidad (%)' }, min: 0, max: 100 },
                                                    y: { title: { display: true, text: 'Popularidad (%)' }, min: 0, max: 100 }
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                                        Agrega productos con recetas para ver el análisis BCG
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Distribución por Categoría</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {menuKpis?.categoryBreakdown && Object.keys(menuKpis.categoryBreakdown).length > 0 ? (
                                    <div className="space-y-3">
                                        {Object.entries(menuKpis.categoryBreakdown).map(([category, count]) => (
                                            <div key={category} className="flex justify-between items-center p-2 bg-muted rounded">
                                                <span className="text-sm font-medium">{category}</span>
                                                <Badge variant="secondary">{count} items</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Sin categorías registradas
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Inventory Tab */}
                <TabsContent value="inventory" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Package className="mr-2 text-primary" />
                                    Niveles de Inventario
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {inventory.length > 0 ? (
                                    <div className="h-80">
                                        <Bar 
                                            data={inventoryChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { position: 'top' as const } },
                                                scales: { y: { title: { display: true, text: 'Cantidad' } } }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                                        Registra items de inventario para ver el gráfico
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Alertas de Inventario</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {lowStockItems.length > 0 ? (
                                    <div className="space-y-3">
                                        {lowStockItems.map((item) => (
                                            <div key={item.id} className="p-3 rounded-lg border-l-4 bg-red-50 border-red-500">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-lato-bold text-sm">{item.item_name}</h4>
                                                    <Badge variant="outline" className="text-red-600">Stock Bajo</Badge>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Stock actual:</span>
                                                        <span className="font-lato-medium">{item.current_stock} {item.unit}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Punto de reorden:</span>
                                                        <span className="font-lato-medium">{item.reorder_point} {item.unit}</span>
                                                    </div>
                                                    {item.supplier_name && (
                                                        <p className="text-xs text-primary font-lato-bold mt-2">
                                                            Proveedor: {item.supplier_name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No hay alertas de stock bajo</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Inventory Summary */}
                    {inventoryKpis && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Calculator className="mr-2 text-primary" />
                                    Resumen de Inventario
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <p className="text-2xl font-bold">{inventoryKpis.totalItems}</p>
                                        <p className="text-sm text-muted-foreground">Items Totales</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <p className="text-2xl font-bold">${inventoryKpis.totalValue.toLocaleString()}</p>
                                        <p className="text-sm text-muted-foreground">Valor Total</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <p className="text-2xl font-bold text-red-600">{inventoryKpis.lowStockItems.length}</p>
                                        <p className="text-sm text-muted-foreground">Stock Bajo</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <p className="text-2xl font-bold text-orange-600">{inventoryKpis.outOfStockItems.length}</p>
                                        <p className="text-sm text-muted-foreground">Agotados</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Supplier Analyzer Tab */}
                <TabsContent value="supplier-analyzer" className="mt-6">
                    <SupplierAnalyzer />
                </TabsContent>

                {/* BCG Matrix Tab */}
                <TabsContent value="bcg-matrix" className="mt-6">
                    <BCGMatrixView />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MenuInventoryAIModule;
