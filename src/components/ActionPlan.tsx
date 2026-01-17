import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Circle, ArrowRight, Sparkles, Target, TrendingUp, Loader2, Brain, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDiagnosis, AIActionPlan, DiagnosisResult } from '@/hooks/useDiagnosis';
import { maturityModel, getLevelFromScore } from '@/data/maturityModel';
import AIActionPlanComponent from '@/components/AIActionPlan';
import MaturityInsights from '@/components/MaturityInsights';
import MaturityBenchmark from '@/components/MaturityBenchmark';

interface ActionItem {
  id: string;
  pillar: string;
  pillarId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  route: string;
}

const ActionPlan: React.FC = () => {
  const { user } = useAuth();
  const { getLastDiagnosis, getAIActionPlan, generateAIAnalysis, getBenchmarkComparison, aiLoading } = useDiagnosis();
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [aiActionPlan, setAiActionPlan] = useState<AIActionPlan | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiBenchmark, setAiBenchmark] = useState<any>(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    const loadDiagnosis = async () => {
      if (!user) return;
      
      try {
        const data = await getLastDiagnosis(user.id);
        if (data) {
          setDiagnosis(data);
          
          // Load cached AI data if available
          if (data.ai_action_plan) {
            setAiActionPlan(data.ai_action_plan as unknown as AIActionPlan);
          }
          if (data.ai_analysis) {
            setAiAnalysis(data.ai_analysis);
          }
          if (data.ai_benchmark) {
            setAiBenchmark(data.ai_benchmark);
          }
          
          // Generate fallback action items
          if (!data.ai_action_plan) {
            generateActionItems(data.pillar_scores as Record<string, number>);
          }
        }
      } catch (error) {
        console.error('Error loading diagnosis:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDiagnosis();
  }, [user]);

  const generateAIContent = async () => {
    if (!diagnosis || !user) return;
    
    setGeneratingAI(true);
    
    const diagnosisResult: DiagnosisResult = {
      pillarScores: diagnosis.pillar_scores,
      overallScore: diagnosis.overall_score,
      overallLevel: diagnosis.overall_level
    };
    
    const context = diagnosis.restaurant_context || {};
    
    try {
      // Generate all AI content
      const [analysis, plan, benchmark] = await Promise.all([
        generateAIAnalysis(diagnosis.id, diagnosisResult, context),
        getAIActionPlan(diagnosis.id, diagnosisResult, context),
        getBenchmarkComparison(diagnosis.id, diagnosisResult, context)
      ]);
      
      if (analysis) setAiAnalysis(analysis);
      if (plan) setAiActionPlan(plan);
      if (benchmark) setAiBenchmark(benchmark);
    } catch (error) {
      console.error('Error generating AI content:', error);
    } finally {
      setGeneratingAI(false);
    }
  };

  const generateActionItems = (pillarScores: Record<string, number>) => {
    const items: ActionItem[] = [];
    
    const pillarRoutes: Record<string, string> = {
      'p1': '/r/finances',
      'p2': '/r/operations',
      'p3': '/r/talent',
      'p4': '/r/menu-engineering'
    };

    const pillarActions: Record<string, { low: string[], medium: string[], high: string[] }> = {
      'p1': {
        low: ['Implementar control básico de costos', 'Establecer presupuesto mensual', 'Crear reporte de ingresos diarios'],
        medium: ['Analizar márgenes por categoría', 'Optimizar precios con IA', 'Reducir food cost un 5%'],
        high: ['Automatizar reportes financieros', 'Proyección de flujo de caja', 'Análisis predictivo de ventas']
      },
      'p2': {
        low: ['Digitalizar registro de inventario', 'Establecer checklist diario de apertura', 'Documentar procesos clave'],
        medium: ['Integrar sistema de gestión de inventario', 'Automatizar órdenes a proveedores', 'Optimizar layout de cocina'],
        high: ['Dashboard de operaciones en tiempo real', 'Predicción de demanda con IA', 'Certificación de procesos']
      },
      'p3': {
        low: ['Crear descripciones de puesto', 'Implementar evaluación de desempeño', 'Establecer horarios rotativos'],
        medium: ['Programa de capacitación continua', 'Sistema de incentivos por rendimiento', 'Optimizar programación de turnos'],
        high: ['Plan de carrera para empleados', 'Análisis predictivo de rotación', 'Cultura de mejora continua']
      },
      'p4': {
        low: ['Digitalizar menú con QR', 'Recolectar feedback de clientes', 'Establecer programa de lealtad básico'],
        medium: ['Análisis de ingeniería de menú', 'Segmentación de clientes', 'Estrategia de marketing digital'],
        high: ['Personalización de experiencia', 'Predicción de preferencias', 'Optimización dinámica del menú']
      }
    };

    Object.entries(pillarScores).forEach(([pillarId, score]) => {
      const pillar = maturityModel.pillars.find(p => p.id === pillarId);
      if (!pillar) return;

      const actions = pillarActions[pillarId];
      if (!actions) return;

      let selectedActions: string[] = [];
      let priority: 'high' | 'medium' | 'low' = 'medium';

      if (score < 2) {
        selectedActions = actions.low;
        priority = 'high';
      } else if (score < 3.5) {
        selectedActions = actions.medium;
        priority = 'medium';
      } else {
        selectedActions = actions.high;
        priority = 'low';
      }

      selectedActions.forEach((action, index) => {
        items.push({
          id: `${pillarId}-${index}`,
          pillar: pillar.name,
          pillarId,
          title: action,
          description: `Acción recomendada para mejorar ${pillar.name.toLowerCase()}`,
          priority,
          completed: false,
          route: pillarRoutes[pillarId] || '/r/finances'
        });
      });
    });

    items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    setActionItems(items);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!diagnosis) {
    return (
      <Card className="border-dashed border-2 border-primary/30">
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-headline font-bold mb-2">
            Completa tu Diagnóstico
          </h3>
          <p className="text-muted-foreground mb-4">
            Realiza el diagnóstico de madurez para obtener tu plan de acción personalizado
          </p>
          <Button onClick={() => window.location.href = '/diagnosis'}>
            <Sparkles className="mr-2 h-4 w-4" />
            Iniciar Diagnóstico
          </Button>
        </CardContent>
      </Card>
    );
  }

  const overallScore = diagnosis.overall_score || 0;
  const overallLevel = getLevelFromScore(overallScore);

  const diagnosisResult: DiagnosisResult = {
    pillarScores: diagnosis.pillar_scores,
    overallScore: diagnosis.overall_score,
    overallLevel: diagnosis.overall_level
  };

  // If we have AI Action Plan, show the enhanced version
  if (aiActionPlan) {
    return (
      <Tabs defaultValue="plan" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Plan de Acción
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2" disabled={!aiAnalysis}>
            <Brain className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="benchmark" className="flex items-center gap-2" disabled={!aiBenchmark}>
            <BarChart3 className="h-4 w-4" />
            Benchmark
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plan">
          <AIActionPlanComponent 
            actionPlan={aiActionPlan} 
            diagnosisId={diagnosis.id}
            diagnosisResult={diagnosisResult}
          />
        </TabsContent>

        <TabsContent value="insights">
          {aiAnalysis && <MaturityInsights analysis={aiAnalysis} />}
        </TabsContent>

        <TabsContent value="benchmark">
          {aiBenchmark && <MaturityBenchmark benchmark={aiBenchmark} />}
        </TabsContent>
      </Tabs>
    );
  }

  // Fallback to basic action plan with option to generate AI version
  const completedItems = actionItems.filter(item => item.completed).length;
  const progress = actionItems.length > 0 ? (completedItems / actionItems.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Generate AI Plan CTA */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-headline font-bold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Genera tu Plan con IA
              </h3>
              <p className="text-sm text-muted-foreground">
                Obtén recomendaciones personalizadas, benchmarks y KPIs
              </p>
            </div>
            <Button 
              onClick={generateAIContent} 
              disabled={generatingAI}
              className="shrink-0"
            >
              {generatingAI ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Generar con IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Target className="h-5 w-5 text-primary" />
                Tu Plan de Acción
              </CardTitle>
              <CardDescription className="font-lato-light">
                Basado en tu diagnóstico de madurez
              </CardDescription>
            </div>
            <Badge 
              style={{ backgroundColor: overallLevel.color, color: 'white' }}
              className="text-sm px-3 py-1"
            >
              Nivel {overallLevel.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-lato-medium">Progreso del Plan</span>
                <span className="font-lato-bold">{completedItems} de {actionItems.length} acciones</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-headline font-bold text-primary">
                {Math.round(progress)}%
              </div>
              <div className="text-xs text-muted-foreground">completado</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items by Priority */}
      <div className="grid gap-4">
        {['high', 'medium', 'low'].map(priority => {
          const priorityItems = actionItems.filter(item => item.priority === priority);
          if (priorityItems.length === 0) return null;

          return (
            <Card key={priority}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(priority) as any}>
                    Prioridad {getPriorityLabel(priority)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({priorityItems.length} acciones)
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {priorityItems.slice(0, 6).map(item => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                    onClick={() => window.location.href = item.route}
                  >
                    <div className={`p-1.5 rounded-full ${item.completed ? 'bg-success/20' : 'bg-muted'}`}>
                      {item.completed ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-lato-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.pillar}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ActionPlan;
