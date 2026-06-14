import React, { useState } from 'react';
import { Brain, RefreshCw, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';
import { useTalentData } from '@/hooks/useTalentData';
import { ModuleEmptyState } from '@/components/ui/empty-state';
import { StaffFormDialog, StaffFormData } from './talent/StaffFormDialog';
import { TalentKPIs } from './talent/TalentKPIs';
import { TalentChartsSection } from './talent/TalentChartsSection';
import { TalentNeedsAttention } from './talent/TalentNeedsAttention';

const initialForm: StaffFormData = {
  name: '', position: '', hourly_rate: '', performance_score: '70', training_progress: '0',
  employee_id: '', email: '', phone: '', contract_type: '',
  hire_date: new Date().toISOString().split('T')[0],
};

const TalentAIModule = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [formData, setFormData] = useState<StaffFormData>(initialForm);

  const { staff, kpis, benchmarks, loading: dataLoading, hasData, addStaffMember, isViewingClient } = useTalentData();
  const { loading: aiLoading, optimizeStaff } = useAIAgent();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.name || !formData.position) {
      toast({ title: 'Campos requeridos', description: 'Nombre y posición son obligatorios', variant: 'destructive' });
      return;
    }
    await addStaffMember({
      name: formData.name,
      position: formData.position,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      hire_date: formData.hire_date || new Date().toISOString().split('T')[0],
      performance_score: parseFloat(formData.performance_score),
      training_progress: parseInt(formData.training_progress),
      is_active: true,
      employee_id: formData.employee_id || null,
      email: formData.email || null,
      phone: formData.phone || null,
      contract_type: formData.contract_type || null,
    } as any);
    setFormData(initialForm);
    setShowAddForm(false);
  };

  const runStaffAnalysis = async () => {
    if (!kpis) return;
    const analysis = await optimizeStaff({
      totalStaff: kpis.totalStaff,
      avgPerformance: kpis.avgPerformance,
      avgTrainingProgress: kpis.avgTrainingProgress,
      positionBreakdown: kpis.positionBreakdown,
    });
    if (analysis) {
      setAiInsights(analysis);
      toast({ title: 'Análisis de talento completado', description: 'Se han generado recomendaciones de optimización' });
    }
  };

  if (!hasData && !dataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-lato-bold text-foreground">Gestión y Optimización del Talento</h2>
        </div>
        <ModuleEmptyState
          moduleName="Talento IA"
          description="Registra tu equipo para obtener análisis de rendimiento, planificación predictiva de horarios y recomendaciones de capacitación."
          features={[
            'Planificación predictiva de horarios',
            'Análisis de rendimiento con IA',
            'Capacitación adaptativa personalizada',
            'Identificación de top performers',
          ]}
          onGetStarted={() => setShowAddForm(true)}
        />
        <StaffFormDialog open={showAddForm} onOpenChange={setShowAddForm}
          formData={formData} setFormData={setFormData} onSubmit={handleSubmit} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-lato-bold text-foreground">Gestión y Optimización del Talento</h2>
          {isViewingClient && <Badge variant="outline" className="mt-1">Datos del cliente</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <StaffFormDialog
            open={showAddForm} onOpenChange={setShowAddForm}
            formData={formData} setFormData={setFormData} onSubmit={handleSubmit}
            trigger={
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />Agregar Empleado
              </Button>
            }
          />
          <Button onClick={runStaffAnalysis} disabled={aiLoading || !kpis} className="bg-primary hover:bg-primary/90">
            <RefreshCw className={`w-4 h-4 mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
            Análisis IA
          </Button>
        </div>
      </div>

      {aiInsights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-primary"><Brain className="mr-2" size={20} />Insights IA - Talento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{aiInsights}</div>
          </CardContent>
        </Card>
      )}

      <TalentKPIs kpis={kpis} />
      <TalentChartsSection
        positionBreakdown={kpis?.positionBreakdown || {}}
        topPerformers={kpis?.topPerformers || []}
      />
      <TalentNeedsAttention kpis={kpis} benchmarks={benchmarks} />
    </div>
  );
};

export default TalentAIModule;
