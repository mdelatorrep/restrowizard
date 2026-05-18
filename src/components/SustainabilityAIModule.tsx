import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSustainabilityData } from '@/hooks/useSustainabilityData';
import { ModuleEmptyState } from '@/components/ui/empty-state';
import { Leaf, Plus, Brain, RefreshCw } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { WasteLogDialog, emptyWasteForm, WasteLogFormData } from './sustainability/WasteLogDialog';
import { SustainabilityKPIs } from './sustainability/SustainabilityKPIs';
import { SustainabilityOverviewTab } from './sustainability/SustainabilityOverviewTab';
import { SustainabilityWasteTab } from './sustainability/SustainabilityWasteTab';
import { SustainabilityCarbonTab } from './sustainability/SustainabilityCarbonTab';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const SustainabilityAIModule = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [wasteFormData, setWasteFormData] = useState<WasteLogFormData>(emptyWasteForm);

  const { wasteLogs, carbonItems, kpis, benchmarks, loading, hasData, addWasteLog, isViewingClient } = useSustainabilityData();

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
            localSourcingPercentage: kpis.localSourcingPercentage,
          },
        },
      });
      if (error) throw error;
      setAiInsights(data.analysis);
      toast({ title: 'Análisis completado', description: 'El análisis de sostenibilidad ha sido generado por IA' });
    } catch (error) {
      console.error('Error en análisis IA:', error);
      toast({ title: 'Error', description: 'No se pudo completar el análisis de IA', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogWaste = async () => {
    if (!wasteFormData.item_name || !wasteFormData.quantity_kg) {
      toast({ title: 'Campos requeridos', description: 'Nombre del ítem y cantidad son obligatorios', variant: 'destructive' });
      return;
    }
    await addWasteLog({
      item_name: wasteFormData.item_name,
      quantity_kg: parseFloat(wasteFormData.quantity_kg),
      category: wasteFormData.category,
      reason: wasteFormData.reason || null,
      preventable: wasteFormData.preventable,
      estimated_cost: wasteFormData.estimated_cost ? parseFloat(wasteFormData.estimated_cost) : null,
      waste_date: new Date().toISOString().split('T')[0],
    });
    setShowWasteForm(false);
    setWasteFormData(emptyWasteForm);
  };

  if (!hasData && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Leaf className="h-7 w-7 text-green-500" />
              Sostenibilidad y ESG
            </h2>
            <p className="text-muted-foreground mt-1">Monitorea tu impacto ambiental y cumple con estándares ESG</p>
          </div>
        </div>
        <ModuleEmptyState
          moduleName="Sostenibilidad IA"
          description="Registra desperdicio de alimentos y huella de carbono para obtener análisis de impacto ambiental y recomendaciones de mejora."
          features={[
            'Tracking de desperdicio de alimentos',
            'Cálculo de huella de carbono',
            'Recomendaciones IA para reducir impacto',
            'Comparación con estándares de industria',
          ]}
          onGetStarted={() => setShowWasteForm(true)}
        />
        <WasteLogDialog
          open={showWasteForm}
          onOpenChange={setShowWasteForm}
          data={wasteFormData}
          onChange={setWasteFormData}
          onSubmit={handleLogWaste}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Leaf className="h-7 w-7 text-green-500" />
            Sostenibilidad y ESG
          </h2>
          <p className="text-muted-foreground mt-1">Monitorea tu impacto ambiental y cumple con estándares ESG</p>
          {isViewingClient && <Badge variant="outline" className="mt-1">Datos del cliente</Badge>}
        </div>
        <div className="flex gap-2">
          <WasteLogDialog
            open={showWasteForm}
            onOpenChange={setShowWasteForm}
            data={wasteFormData}
            onChange={setWasteFormData}
            onSubmit={handleLogWaste}
            trigger={
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Desperdicio
              </Button>
            }
          />
          <Button onClick={runAIAnalysis} disabled={isAnalyzing || !kpis}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analizando...' : 'Análisis IA'}
          </Button>
        </div>
      </div>

      {aiInsights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Brain className="mr-2" size={20} />
              Insights IA - Sostenibilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{aiInsights}</div>
          </CardContent>
        </Card>
      )}

      <SustainabilityKPIs kpis={kpis} carbonItems={carbonItems} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="waste">Desperdicio</TabsTrigger>
          <TabsTrigger value="carbon">Huella Carbono</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4 mt-4">
          <SustainabilityOverviewTab kpis={kpis} wasteLogs={wasteLogs} benchmarks={benchmarks} />
        </TabsContent>
        <TabsContent value="waste" className="space-y-4 mt-4">
          <SustainabilityWasteTab kpis={kpis} wasteLogs={wasteLogs} />
        </TabsContent>
        <TabsContent value="carbon" className="space-y-4 mt-4">
          <SustainabilityCarbonTab kpis={kpis} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SustainabilityAIModule;
