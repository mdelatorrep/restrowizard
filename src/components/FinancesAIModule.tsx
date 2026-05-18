import React, { useState } from 'react';
import { Brain, RefreshCw, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';
import { useFinancesData } from '@/hooks/useFinancesData';
import { ModuleEmptyState } from '@/components/ui/empty-state';
import { SaleFormDialog, SaleFormData } from './finances/SaleFormDialog';
import { FinancesKPIs } from './finances/FinancesKPIs';
import { FinancesCharts } from './finances/FinancesCharts';

const initialForm: SaleFormData = {
  sale_date: new Date().toISOString().split('T')[0],
  total_revenue: '', covers_count: '', food_cost: '', labor_cost: '', other_costs: '',
};

const FinancesAIModule = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [formData, setFormData] = useState<SaleFormData>(initialForm);

  const { sales, kpis, benchmarks, loading: dataLoading, hasData, addSale, isViewingClient } = useFinancesData();
  const { loading: aiLoading, analyzeFinances } = useAIAgent();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.total_revenue) {
      toast({ title: 'Campo requerido', description: 'El ingreso total es obligatorio', variant: 'destructive' });
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
      notes: null,
    });
    setFormData({ ...initialForm, sale_date: new Date().toISOString().split('T')[0] });
    setShowAddForm(false);
  };

  const runAIAnalysis = async () => {
    if (!kpis) return;
    const analysis = await analyzeFinances({
      currentProfitability: kpis.grossMargin,
      foodCostPercentage: kpis.foodCostPercentage,
      laborCostPercentage: kpis.laborCostPercentage,
      totalRevenue: kpis.totalRevenue,
      averageTicket: kpis.averageTicket,
    });
    if (analysis) {
      setAiInsights(analysis);
      toast({ title: 'Análisis IA completado', description: 'Se han generado nuevos insights financieros' });
    }
  };

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
            'Predicción de rentabilidad con IA',
            'Detección automática de anomalías en costos',
            'Recomendaciones de precios dinámicos',
            'Comparación con benchmarks de la industria',
          ]}
          onGetStarted={() => setShowAddForm(true)}
        />
        <SaleFormDialog open={showAddForm} onOpenChange={setShowAddForm}
          formData={formData} setFormData={setFormData} onSubmit={handleSubmit} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-lato-bold text-foreground">Finanzas y Control de Rentabilidad</h2>
          {isViewingClient && <Badge variant="outline" className="mt-1">Datos del cliente</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <SaleFormDialog
            open={showAddForm} onOpenChange={setShowAddForm}
            formData={formData} setFormData={setFormData} onSubmit={handleSubmit}
            trigger={
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />Registrar Venta
              </Button>
            }
          />
          <Button onClick={runAIAnalysis} disabled={aiLoading || !kpis} className="bg-primary hover:bg-primary/90">
            <RefreshCw className={`w-4 h-4 mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
            Análisis IA
          </Button>
        </div>
      </div>

      {aiInsights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-primary"><Brain className="mr-2" size={20} />Insights IA - Finanzas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{aiInsights}</div>
          </CardContent>
        </Card>
      )}

      <FinancesKPIs kpis={kpis} salesCount={sales.length} />
      <FinancesCharts sales={sales} kpis={kpis} benchmarks={benchmarks} />
    </div>
  );
};

export default FinancesAIModule;
