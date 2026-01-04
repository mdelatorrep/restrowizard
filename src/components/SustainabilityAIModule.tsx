import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSustainabilityData, WasteCategory } from '@/hooks/useSustainabilityData';
import { ModuleEmptyState, BenchmarkComparison } from '@/components/ui/empty-state';
import { 
  Leaf, 
  Trash2, 
  TrendingDown, 
  Droplets, 
  Factory, 
  Target,
  AlertTriangle,
  CheckCircle,
  Plus,
  Sparkles,
  BarChart3,
  Brain,
  RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WasteLogFormData {
  item_name: string;
  quantity_kg: string;
  category: WasteCategory;
  reason: string;
  preventable: boolean;
  estimated_cost: string;
}

const SustainabilityAIModule = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [wasteFormData, setWasteFormData] = useState<WasteLogFormData>({
    item_name: '',
    quantity_kg: '',
    category: 'other',
    reason: '',
    preventable: true,
    estimated_cost: ''
  });

  const { 
    wasteLogs, 
    carbonItems, 
    kpis, 
    benchmarks, 
    loading, 
    hasData, 
    addWasteLog, 
    isViewingClient 
  } = useSustainabilityData();

  const runAIAnalysis = async () => {
    if (!kpis) return;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sustainability-ai-analysis', {
        body: { 
          type: 'full_analysis',
          data: {
            totalWasteKg: kpis.totalWasteKg,
            totalWasteCost: kpis.totalWasteCost,
            preventablePercentage: kpis.preventableWastePercentage,
            carbonFootprint: kpis.totalCarbonFootprint,
            localSourcingPercentage: kpis.localSourcingPercentage
          }
        }
      });

      if (error) throw error;
      setAiInsights(data.analysis);
      toast({
        title: "Análisis completado",
        description: "El análisis de sostenibilidad ha sido generado por IA",
      });
    } catch (error: any) {
      console.error('Error en análisis IA:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el análisis de IA",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogWaste = async () => {
    if (!wasteFormData.item_name || !wasteFormData.quantity_kg) {
      toast({
        title: "Campos requeridos",
        description: "Nombre del ítem y cantidad son obligatorios",
        variant: "destructive"
      });
      return;
    }

    await addWasteLog({
      item_name: wasteFormData.item_name,
      quantity_kg: parseFloat(wasteFormData.quantity_kg),
      category: wasteFormData.category,
      reason: wasteFormData.reason || null,
      preventable: wasteFormData.preventable,
      estimated_cost: wasteFormData.estimated_cost ? parseFloat(wasteFormData.estimated_cost) : null,
      waste_date: new Date().toISOString().split('T')[0]
    });

    setShowWasteForm(false);
    setWasteFormData({
      item_name: '',
      quantity_kg: '',
      category: 'other',
      reason: '',
      preventable: true,
      estimated_cost: ''
    });
  };

  // Empty state
  if (!hasData && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Leaf className="h-7 w-7 text-green-500" />
              Sostenibilidad y ESG
            </h2>
            <p className="text-muted-foreground mt-1">
              Monitorea tu impacto ambiental y cumple con estándares ESG
            </p>
          </div>
        </div>

        <ModuleEmptyState
          moduleName="Sostenibilidad IA"
          description="Registra desperdicio de alimentos y huella de carbono para obtener análisis de impacto ambiental y recomendaciones de mejora."
          features={[
            "Tracking de desperdicio de alimentos",
            "Cálculo de huella de carbono",
            "Recomendaciones IA para reducir impacto",
            "Comparación con estándares de industria"
          ]}
          onGetStarted={() => setShowWasteForm(true)}
        />

        <Dialog open={showWasteForm} onOpenChange={setShowWasteForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Desperdicio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Ítem *</Label>
                <Input
                  placeholder="Nombre del alimento"
                  value={wasteFormData.item_name}
                  onChange={(e) => setWasteFormData({ ...wasteFormData, item_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cantidad (kg) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={wasteFormData.quantity_kg}
                    onChange={(e) => setWasteFormData({ ...wasteFormData, quantity_kg: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Costo Estimado</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={wasteFormData.estimated_cost}
                    onChange={(e) => setWasteFormData({ ...wasteFormData, estimated_cost: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select 
                  value={wasteFormData.category} 
                  onValueChange={(v: WasteCategory) => setWasteFormData({ ...wasteFormData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preparation">Preparación</SelectItem>
                    <SelectItem value="overproduction">Sobreproducción</SelectItem>
                    <SelectItem value="spoilage">Caducidad</SelectItem>
                    <SelectItem value="plate_waste">Plato</SelectItem>
                    <SelectItem value="storage">Almacenamiento</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Razón</Label>
                <Input
                  placeholder="Descripción opcional"
                  value={wasteFormData.reason}
                  onChange={(e) => setWasteFormData({ ...wasteFormData, reason: e.target.value })}
                />
              </div>
              <Button onClick={handleLogWaste} className="w-full">
                Guardar Registro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Prepare chart data
  const wasteByCategory = {
    labels: Object.keys(kpis?.wasteByCategory || {}).map(cat => {
      const labels: Record<string, string> = {
        preparation: 'Preparación',
        overproduction: 'Sobreproducción',
        spoilage: 'Caducidad',
        plate_waste: 'Plato',
        storage: 'Almacenamiento',
        other: 'Otro'
      };
      return labels[cat] || cat;
    }),
    datasets: [{
      data: Object.values(kpis?.wasteByCategory || {}),
      backgroundColor: [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))'
      ],
      borderWidth: 0
    }]
  };

  const carbonByCategory = {
    labels: Object.keys(kpis?.carbonByCategory || {}),
    datasets: [{
      label: 'kg CO2',
      data: Object.values(kpis?.carbonByCategory || {}),
      backgroundColor: 'hsl(var(--primary) / 0.8)',
      borderRadius: 8
    }]
  };

  // Recent waste logs for trend
  const recentWaste = wasteLogs.slice(0, 7).reverse();
  const trendData = {
    labels: recentWaste.map(w => new Date(w.waste_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })),
    datasets: [{
      label: 'Desperdicio (kg)',
      data: recentWaste.map(w => w.quantity_kg),
      borderColor: 'hsl(var(--destructive))',
      backgroundColor: 'hsl(var(--destructive) / 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Leaf className="h-7 w-7 text-green-500" />
            Sostenibilidad y ESG
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitorea tu impacto ambiental y cumple con estándares ESG
          </p>
          {isViewingClient && (
            <Badge variant="outline" className="mt-1">Datos del cliente</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Dialog open={showWasteForm} onOpenChange={setShowWasteForm}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Desperdicio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Desperdicio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Ítem *</Label>
                  <Input
                    placeholder="Nombre del alimento"
                    value={wasteFormData.item_name}
                    onChange={(e) => setWasteFormData({ ...wasteFormData, item_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cantidad (kg) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={wasteFormData.quantity_kg}
                      onChange={(e) => setWasteFormData({ ...wasteFormData, quantity_kg: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Costo Estimado</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={wasteFormData.estimated_cost}
                      onChange={(e) => setWasteFormData({ ...wasteFormData, estimated_cost: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select 
                    value={wasteFormData.category} 
                    onValueChange={(v: WasteCategory) => setWasteFormData({ ...wasteFormData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preparation">Preparación</SelectItem>
                      <SelectItem value="overproduction">Sobreproducción</SelectItem>
                      <SelectItem value="spoilage">Caducidad</SelectItem>
                      <SelectItem value="plate_waste">Plato</SelectItem>
                      <SelectItem value="storage">Almacenamiento</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Razón</Label>
                  <Input
                    placeholder="Descripción opcional"
                    value={wasteFormData.reason}
                    onChange={(e) => setWasteFormData({ ...wasteFormData, reason: e.target.value })}
                  />
                </div>
                <Button onClick={handleLogWaste} className="w-full">
                  Guardar Registro
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={runAIAnalysis} disabled={isAnalyzing || !kpis}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analizando...' : 'Análisis IA'}
          </Button>
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Brain className="mr-2" size={20} />
              Insights IA - Sostenibilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {aiInsights}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Huella de Carbono</p>
                <p className="text-2xl font-bold">{kpis?.totalCarbonFootprint.toFixed(1) || 0} kg</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Leaf className="h-4 w-4" />
                  {carbonItems.length} ítems registrados
                </p>
              </div>
              <Factory className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Desperdicio Total</p>
                <p className="text-2xl font-bold">{kpis?.totalWasteKg.toFixed(1) || 0} kg</p>
                <p className="text-sm text-muted-foreground">
                  ${kpis?.totalWasteCost.toLocaleString() || 0} en pérdidas
                </p>
              </div>
              <Trash2 className="h-10 w-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proveedores Locales</p>
                <p className="text-2xl font-bold">{kpis?.localSourcingPercentage.toFixed(0) || 0}%</p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  Menor huella logística
                </p>
              </div>
              <Droplets className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Desperdicio Prevenible</p>
                <p className="text-2xl font-bold">{kpis?.preventableWastePercentage.toFixed(0) || 0}%</p>
                <p className="text-sm text-muted-foreground">
                  de los residuos eran evitables
                </p>
              </div>
              <AlertTriangle className="h-10 w-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="waste">Desperdicio</TabsTrigger>
          <TabsTrigger value="carbon">Huella Carbono</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Trend Chart */}
            {recentWaste.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Tendencia de Desperdicio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Line 
                    data={trendData} 
                    options={{
                      responsive: true,
                      plugins: { legend: { position: 'bottom' } },
                      scales: { y: { beginAtZero: true } }
                    }} 
                  />
                </CardContent>
              </Card>
            )}

            {/* Benchmarks */}
            {benchmarks && kpis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Comparación con Industria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <BenchmarkComparison
                    label="% Desperdicio"
                    userValue={(kpis.totalWasteKg / 100) * 10} // Simplified metric
                    benchmarkValue={benchmarks.wastePercentage}
                    higherIsBetter={false}
                  />
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Recomendación
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {kpis.preventableWastePercentage > 50 
                        ? 'Enfócate en reducir desperdicio prevenible - más del 50% era evitable.'
                        : 'Buen trabajo reduciendo desperdicio prevenible. Sigue optimizando.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="waste" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desperdicio por Categoría</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {Object.keys(kpis?.wasteByCategory || {}).length > 0 ? (
                  <div className="w-64 h-64">
                    <Doughnut 
                      data={wasteByCategory}
                      options={{
                        responsive: true,
                        plugins: { legend: { position: 'bottom' } }
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8">No hay datos de categorías</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registros Recientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {wasteLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{log.item_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.waste_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{log.quantity_kg} kg</p>
                      {log.estimated_cost && (
                        <p className="text-xs text-orange-600">${log.estimated_cost}</p>
                      )}
                    </div>
                  </div>
                ))}
                {wasteLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No hay registros de desperdicio
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="carbon" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Huella de Carbono por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(kpis?.carbonByCategory || {}).length > 0 ? (
                  <Bar 
                    data={carbonByCategory}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } }
                    }}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No hay datos de huella de carbono. Agrega ítems en la tabla de carbon_footprint_items.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Oportunidades de Reducción</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Cambiar a proveedores locales</p>
                    <p className="text-sm text-muted-foreground">Reducción estimada: 15-20% CO2</p>
                  </div>
                  <Badge className="bg-green-500">Alto impacto</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Optimizar logística de entregas</p>
                    <p className="text-sm text-muted-foreground">Reducción estimada: 5-10% CO2</p>
                  </div>
                  <Badge variant="secondary">Medio impacto</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Menú con más opciones plant-based</p>
                    <p className="text-sm text-muted-foreground">Reducción estimada: 20-30% CO2</p>
                  </div>
                  <Badge className="bg-green-500">Alto impacto</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SustainabilityAIModule;
