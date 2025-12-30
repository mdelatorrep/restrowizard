import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';
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
  FileText,
  Sparkles,
  BarChart3
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

// Mock data for demonstration
const mockSustainabilityData = {
  carbonFootprint: {
    total: 2450,
    target: 2000,
    byCategory: {
      meat: 1200,
      dairy: 450,
      vegetables: 150,
      transport: 350,
      energy: 300
    },
    trend: -12
  },
  foodWaste: {
    totalKg: 156,
    totalCost: 4680,
    byCategory: {
      preparation: 45,
      overproduction: 38,
      spoilage: 28,
      plate_waste: 32,
      storage: 13
    },
    preventablePercent: 72
  },
  waterUsage: {
    total: 45000,
    perCover: 85,
    trend: -8
  },
  goals: [
    { id: 1, name: 'Reducir desperdicio 20%', progress: 65, target: '20%', current: '13%' },
    { id: 2, name: 'Proveedores locales 50%', progress: 42, target: '50%', current: '21%' },
    { id: 3, name: 'Huella carbono -15%', progress: 80, target: '15%', current: '12%' }
  ],
  recommendations: [
    { priority: 'high', text: 'Reducir porciones de carne roja un 15% podría disminuir emisiones en 180kg CO2/mes' },
    { priority: 'medium', text: 'Cambiar 3 proveedores a opciones locales ahorraría 45kg CO2 en transporte' },
    { priority: 'low', text: 'Implementar compostaje reduciría residuos orgánicos en 60%' }
  ]
};

interface WasteLogFormData {
  item_name: string;
  quantity_kg: string;
  category: string;
  reason: string;
  preventable: boolean;
}

const SustainabilityAIModule = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [wasteFormData, setWasteFormData] = useState<WasteLogFormData>({
    item_name: '',
    quantity_kg: '',
    category: 'other',
    reason: '',
    preventable: true
  });

  const runAIAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sustainability-ai-analysis', {
        body: { 
          type: 'full_analysis',
          data: mockSustainabilityData 
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
      setIsLoading(false);
    }
  };

  const handleLogWaste = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase.from('food_waste_logs').insert({
        user_id: user.id,
        item_name: wasteFormData.item_name,
        quantity_kg: parseFloat(wasteFormData.quantity_kg),
        category: wasteFormData.category as any,
        reason: wasteFormData.reason,
        preventable: wasteFormData.preventable
      });

      if (error) throw error;

      toast({
        title: "Registro guardado",
        description: "El desperdicio ha sido registrado exitosamente",
      });
      setShowWasteForm(false);
      setWasteFormData({
        item_name: '',
        quantity_kg: '',
        category: 'other',
        reason: '',
        preventable: true
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const wasteByCategory = {
    labels: ['Preparación', 'Sobreproducción', 'Caducidad', 'Plato', 'Almacén'],
    datasets: [{
      data: Object.values(mockSustainabilityData.foodWaste.byCategory),
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
    labels: ['Carnes', 'Lácteos', 'Vegetales', 'Transporte', 'Energía'],
    datasets: [{
      label: 'kg CO2',
      data: Object.values(mockSustainabilityData.carbonFootprint.byCategory),
      backgroundColor: 'hsl(var(--primary) / 0.8)',
      borderRadius: 8
    }]
  };

  const trendData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Desperdicio (kg)',
        data: [180, 165, 172, 158, 160, 156],
        borderColor: 'hsl(var(--destructive))',
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'CO2 (kg)',
        data: [2800, 2650, 2580, 2500, 2480, 2450],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
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
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowWasteForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Desperdicio
          </Button>
          <Button onClick={runAIAnalysis} disabled={isLoading}>
            <Sparkles className="h-4 w-4 mr-2" />
            {isLoading ? 'Analizando...' : 'Análisis IA'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Huella de Carbono</p>
                <p className="text-2xl font-bold">{mockSustainabilityData.carbonFootprint.total} kg</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  {mockSustainabilityData.carbonFootprint.trend}% vs mes anterior
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
                <p className="text-sm text-muted-foreground">Desperdicio Mensual</p>
                <p className="text-2xl font-bold">{mockSustainabilityData.foodWaste.totalKg} kg</p>
                <p className="text-sm text-muted-foreground">
                  ${mockSustainabilityData.foodWaste.totalCost.toLocaleString()} en pérdidas
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
                <p className="text-sm text-muted-foreground">Uso de Agua</p>
                <p className="text-2xl font-bold">{(mockSustainabilityData.waterUsage.total / 1000).toFixed(1)}k L</p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  {mockSustainabilityData.waterUsage.trend}% reducción
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
                <p className="text-2xl font-bold">{mockSustainabilityData.foodWaste.preventablePercent}%</p>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="waste">Desperdicio</TabsTrigger>
          <TabsTrigger value="carbon">Huella Carbono</TabsTrigger>
          <TabsTrigger value="goals">Metas ESG</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tendencia de Impacto Ambiental
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Line 
                  data={trendData} 
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } },
                    scales: { y: { beginAtZero: false } }
                  }} 
                />
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Recomendaciones IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockSustainabilityData.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                      {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                    <p className="text-sm">{rec.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Goals Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Progreso de Metas de Sostenibilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockSustainabilityData.goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {goal.current} / {goal.target}
                    </span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waste" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desperdicio por Categoría</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-64 h-64">
                  <Doughnut 
                    data={wasteByCategory}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: 'bottom' } }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análisis de Desperdicio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200">Mayor pérdida: Preparación</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    45kg este mes (~$1,350). Considera estandarizar porciones de corte.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Mejora detectada
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Desperdicio por caducidad bajó 23% tras optimizar rotación FIFO.
                  </p>
                </div>
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
                <Bar 
                  data={carbonByCategory}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                  }}
                />
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
                    <p className="text-sm text-muted-foreground">Reducción estimada: 180 kg CO2/mes</p>
                  </div>
                  <Badge className="bg-green-500">Alto impacto</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Optimizar logística de entregas</p>
                    <p className="text-sm text-muted-foreground">Reducción estimada: 85 kg CO2/mes</p>
                  </div>
                  <Badge variant="secondary">Medio impacto</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Menú con opciones plant-based</p>
                    <p className="text-sm text-muted-foreground">Reducción estimada: 320 kg CO2/mes</p>
                  </div>
                  <Badge className="bg-green-500">Alto impacto</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Metas de Sostenibilidad Activas
              </CardTitle>
              <CardDescription>
                Define y monitorea tus objetivos de impacto ambiental
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockSustainabilityData.goals.map((goal) => (
                <div key={goal.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{goal.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Objetivo: {goal.target} | Actual: {goal.current}
                      </p>
                    </div>
                    <Badge variant={goal.progress >= 75 ? 'default' : goal.progress >= 50 ? 'secondary' : 'outline'}>
                      {goal.progress}%
                    </Badge>
                  </div>
                  <Progress value={goal.progress} className="h-3" />
                </div>
              ))}
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Nueva Meta
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Insights Panel */}
      {aiInsights && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Análisis de Sostenibilidad por IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{aiInsights}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waste Log Form Modal */}
      {showWasteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Registrar Desperdicio</CardTitle>
              <CardDescription>Ingresa los detalles del desperdicio alimenticio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Producto</Label>
                <Input 
                  placeholder="Ej: Tomates, Pollo, etc."
                  value={wasteFormData.item_name}
                  onChange={(e) => setWasteFormData(prev => ({ ...prev, item_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cantidad (kg)</Label>
                <Input 
                  type="number"
                  placeholder="0.00"
                  value={wasteFormData.quantity_kg}
                  onChange={(e) => setWasteFormData(prev => ({ ...prev, quantity_kg: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select 
                  value={wasteFormData.category}
                  onValueChange={(value) => setWasteFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preparation">Preparación</SelectItem>
                    <SelectItem value="overproduction">Sobreproducción</SelectItem>
                    <SelectItem value="spoilage">Caducidad</SelectItem>
                    <SelectItem value="plate_waste">Plato</SelectItem>
                    <SelectItem value="storage">Almacén</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Razón</Label>
                <Input 
                  placeholder="Describe la razón del desperdicio"
                  value={wasteFormData.reason}
                  onChange={(e) => setWasteFormData(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowWasteForm(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleLogWaste}>
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SustainabilityAIModule;
