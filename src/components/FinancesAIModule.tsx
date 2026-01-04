import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { 
    TrendingUp, TrendingDown, AlertTriangle, DollarSign, 
    Calculator, Brain, Zap, Target, PieChart, BarChart3,
    Activity, Gauge, RefreshCw, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';
import { useFinancesData } from '@/hooks/useFinancesData';
import { ModuleEmptyState, BenchmarkComparison } from '@/components/ui/empty-state';

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

interface SaleFormData {
    sale_date: string;
    total_revenue: string;
    covers_count: string;
    food_cost: string;
    labor_cost: string;
    other_costs: string;
}

const FinancesAIModule = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [aiInsights, setAiInsights] = useState<string>('');
    const [formData, setFormData] = useState<SaleFormData>({
        sale_date: new Date().toISOString().split('T')[0],
        total_revenue: '',
        covers_count: '',
        food_cost: '',
        labor_cost: '',
        other_costs: ''
    });
    
    const { sales, kpis, benchmarks, loading: dataLoading, hasData, addSale, isViewingClient } = useFinancesData();
    const { loading: aiLoading, analyzeFinances } = useAIAgent();
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!formData.total_revenue) {
            toast({
                title: "Campo requerido",
                description: "El ingreso total es obligatorio",
                variant: "destructive"
            });
            return;
        }

        await addSale({
            sale_date: formData.sale_date,
            total_revenue: parseFloat(formData.total_revenue),
            covers_count: formData.covers_count ? parseInt(formData.covers_count) : null,
            average_ticket: null,
            food_cost: formData.food_cost ? parseFloat(formData.food_cost) : null,
            labor_cost: formData.labor_cost ? parseFloat(formData.labor_cost) : null,
            other_costs: formData.other_costs ? parseFloat(formData.other_costs) : null,
            notes: null
        });

        setFormData({
            sale_date: new Date().toISOString().split('T')[0],
            total_revenue: '',
            covers_count: '',
            food_cost: '',
            labor_cost: '',
            other_costs: ''
        });
        setShowAddForm(false);
    };

    const runAIAnalysis = async () => {
        if (!kpis) return;
        
        const analysis = await analyzeFinances({
            currentProfitability: kpis.grossMargin,
            foodCostPercentage: kpis.foodCostPercentage,
            laborCostPercentage: kpis.laborCostPercentage,
            totalRevenue: kpis.totalRevenue,
            averageTicket: kpis.averageTicket
        });
        
        if (analysis) {
            setAiInsights(analysis);
            toast({
                title: "Análisis IA completado",
                description: "Se han generado nuevos insights financieros",
            });
        }
    };

    // Show empty state if no data
    if (!hasData && !dataLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-lato-bold text-foreground">Finanzas y Control de Rentabilidad</h2>
                </div>
                
                <ModuleEmptyState
                    moduleName="Finanzas IA"
                    description="Registra tus ventas diarias para obtener análisis de rentabilidad, detección de anomalías y recomendaciones de precios dinámicos."
                    features={[
                        "Predicción de rentabilidad con IA",
                        "Detección automática de anomalías en costos",
                        "Recomendaciones de precios dinámicos",
                        "Comparación con benchmarks de la industria"
                    ]}
                    onGetStarted={() => setShowAddForm(true)}
                />

                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Registrar Venta Diaria</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Fecha</Label>
                                <Input
                                    type="date"
                                    value={formData.sale_date}
                                    onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Ingreso Total *</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={formData.total_revenue}
                                    onChange={(e) => setFormData({ ...formData, total_revenue: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Cubiertos</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData.covers_count}
                                        onChange={(e) => setFormData({ ...formData, covers_count: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Costo Alimentos</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData.food_cost}
                                        onChange={(e) => setFormData({ ...formData, food_cost: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Costo Mano de Obra</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData.labor_cost}
                                        onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Otros Costos</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData.other_costs}
                                        onChange={(e) => setFormData({ ...formData, other_costs: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleSubmit} className="w-full">
                                Guardar Registro
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // Prepare chart data from real sales
    const last12Sales = sales.slice(0, 12).reverse();
    const profitabilityChart = {
        labels: last12Sales.map(s => {
            const date = new Date(s.sale_date);
            return date.toLocaleDateString('es', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Ingresos',
                data: last12Sales.map(s => s.total_revenue),
                borderColor: 'hsl(var(--primary))',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const costBreakdownChart = {
        labels: ['Alimentos', 'Mano de Obra', 'Otros'],
        datasets: [{
            label: 'Costos',
            data: [
                kpis?.totalFoodCost || 0,
                kpis?.totalLaborCost || 0,
                kpis?.totalOtherCosts || 0
            ],
            backgroundColor: [
                'hsl(var(--chart-1))',
                'hsl(var(--chart-2))',
                'hsl(var(--chart-3))'
            ]
        }]
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-lato-bold text-foreground">Finanzas y Control de Rentabilidad</h2>
                    {isViewingClient && (
                        <Badge variant="outline" className="mt-1">Datos del cliente</Badge>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Registrar Venta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Registrar Venta Diaria</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Fecha</Label>
                                    <Input
                                        type="date"
                                        value={formData.sale_date}
                                        onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Ingreso Total *</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData.total_revenue}
                                        onChange={(e) => setFormData({ ...formData, total_revenue: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Cubiertos</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={formData.covers_count}
                                            onChange={(e) => setFormData({ ...formData, covers_count: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Costo Alimentos</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={formData.food_cost}
                                            onChange={(e) => setFormData({ ...formData, food_cost: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Costo Mano de Obra</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={formData.labor_cost}
                                            onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Otros Costos</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={formData.other_costs}
                                            onChange={(e) => setFormData({ ...formData, other_costs: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleSubmit} className="w-full">
                                    Guardar Registro
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button 
                        onClick={runAIAnalysis} 
                        disabled={aiLoading || !kpis}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
                        Análisis IA
                    </Button>
                </div>
            </div>

            {/* AI Insights Panel */}
            {aiInsights && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center text-primary">
                            <Brain className="mr-2" size={20} />
                            Insights IA - Finanzas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                            {aiInsights}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    icon={<DollarSign />}
                    title="Ingresos Totales"
                    value={`$${kpis ? new Intl.NumberFormat().format(kpis.totalRevenue) : '0'}`}
                    trend="up"
                    description={`${sales.length} registros`}
                    colorClass="bg-green-100 text-green-600"
                />
                <MetricCard
                    icon={<Target />}
                    title="Margen Bruto"
                    value={`${kpis?.grossMargin.toFixed(1) || 0}%`}
                    trend={kpis && kpis.grossMargin > 60 ? 'up' : 'down'}
                    description="Ingresos - Costo alimentos"
                    colorClass="bg-blue-100 text-blue-600"
                />
                <MetricCard
                    icon={<Calculator />}
                    title="Food Cost"
                    value={`${kpis?.foodCostPercentage.toFixed(1) || 0}%`}
                    trend={kpis && kpis.foodCostPercentage < 30 ? 'up' : 'down'}
                    description="% de costo de alimentos"
                    colorClass="bg-orange-100 text-orange-600"
                />
                <MetricCard
                    icon={<Gauge />}
                    title="Ticket Promedio"
                    value={`$${kpis?.averageTicket.toFixed(0) || 0}`}
                    trend="neutral"
                    description={`${kpis?.totalCovers || 0} cubiertos totales`}
                    colorClass="bg-purple-100 text-purple-600"
                />
            </div>

            {/* Charts and Benchmarks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <PieChart className="mr-2 text-primary" />
                            Tendencia de Ingresos
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
                                            title: { display: true, text: 'Ingresos ($)' },
                                            ticks: {
                                                callback: (value) => `$${((value as number) / 1000).toFixed(0)}k`
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
                        <CardTitle className="text-lg">Comparación con Industria</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {benchmarks && kpis && (
                            <>
                                <BenchmarkComparison
                                    label="Food Cost"
                                    userValue={kpis.foodCostPercentage}
                                    benchmarkValue={benchmarks.foodCostAvg}
                                    higherIsBetter={false}
                                />
                                <BenchmarkComparison
                                    label="Labor Cost"
                                    userValue={kpis.laborCostPercentage}
                                    benchmarkValue={benchmarks.laborCostAvg}
                                    higherIsBetter={false}
                                />
                                <BenchmarkComparison
                                    label="Margen Bruto"
                                    userValue={kpis.grossMargin}
                                    benchmarkValue={benchmarks.grossMarginAvg}
                                    higherIsBetter={true}
                                />
                                <BenchmarkComparison
                                    label="Ticket Promedio"
                                    userValue={kpis.averageTicket}
                                    benchmarkValue={benchmarks.averageTicketAvg}
                                    unit=""
                                    higherIsBetter={true}
                                />
                            </>
                        )}
                        {!benchmarks && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Los benchmarks de industria se cargarán pronto
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Cost Breakdown */}
            {kpis && (kpis.totalFoodCost > 0 || kpis.totalLaborCost > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="mr-2 text-primary" />
                            Desglose de Costos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <Bar 
                                data={costBreakdownChart}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FinancesAIModule;
