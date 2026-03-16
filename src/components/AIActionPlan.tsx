import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, Circle, ArrowRight, Sparkles, Target, TrendingUp, 
  Zap, Clock, PlayCircle, BarChart3, DollarSign, ListChecks
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDiagnosis, AIActionPlan as AIActionPlanType, ActionPlanItem, DiagnosisResult } from '@/hooks/useDiagnosis';
import { maturityModel, getLevelFromScore } from '@/data/maturityModel';

interface AIActionPlanProps {
  actionPlan: AIActionPlanType;
  diagnosisId: string;
  diagnosisResult: DiagnosisResult;
}

const AIActionPlanComponent: React.FC<AIActionPlanProps> = ({ 
  actionPlan, 
  diagnosisId,
  diagnosisResult 
}) => {
  const { user } = useAuth();
  const { updateActionTracking, getActionTracking } = useDiagnosis();
  const [actionStatuses, setActionStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActionTracking();
  }, [diagnosisId]);

  const loadActionTracking = async () => {
    const tracking = await getActionTracking(diagnosisId);
    const statuses: Record<string, string> = {};
    tracking.forEach(t => {
      statuses[t.action_id] = t.status;
    });
    setActionStatuses(statuses);
  };

  const toggleActionStatus = async (action: ActionPlanItem, priority: 'high' | 'medium' | 'low') => {
    if (!user) return;
    setLoading(true);

    const currentStatus = actionStatuses[action.id] || 'pending';
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    await updateActionTracking(
      diagnosisId,
      action.id,
      action.title,
      action.pillar_id,
      priority,
      newStatus,
      user.id
    );

    setActionStatuses(prev => ({
      ...prev,
      [action.id]: newStatus
    }));
    setLoading(false);
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'bajo': return 'bg-success/20 text-success';
      case 'medio': return 'bg-amber-500/20 text-amber-600';
      case 'alto': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'alto': return 'bg-success/20 text-success';
      case 'medio': return 'bg-amber-500/20 text-amber-600';
      case 'bajo': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPillarName = (pillarId: string) => {
    const pillar = maturityModel.pillars.find(p => p.id === pillarId);
    return pillar?.name || pillarId;
  };

  const allActions = [
    ...(actionPlan.quick_wins || []).map(a => ({ ...a, category: 'quick_wins' as const, priority: 'high' as const })),
    ...(actionPlan.priority_actions || []).map(a => ({ ...a, category: 'priority' as const, priority: 'medium' as const })),
    ...(actionPlan.strategic_initiatives || []).map(a => ({ ...a, category: 'strategic' as const, priority: 'low' as const }))
  ];

  const completedCount = Object.values(actionStatuses).filter(s => s === 'completed').length;
  const totalActions = allActions.length;
  const progressPercent = totalActions > 0 ? (completedCount / totalActions) * 100 : 0;

  const overallLevel = getLevelFromScore(diagnosisResult.overallScore);

  const renderActionItem = (action: ActionPlanItem, priority: 'high' | 'medium' | 'low') => {
    const isCompleted = actionStatuses[action.id] === 'completed';

    return (
      <div 
        key={action.id}
        className={`p-4 rounded-lg border transition-all ${
          isCompleted 
            ? 'bg-success/5 border-success/30' 
            : 'bg-muted/30 border-border hover:border-primary/30'
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleActionStatus(action, priority)}
            disabled={loading}
            className="mt-1 shrink-0"
          >
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            )}
          </button>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-lato-bold ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {action.title}
              </h4>
              <div className="flex gap-1 shrink-0">
                <Badge className={getEffortColor(action.effort)} variant="outline">
                  Esfuerzo: {action.effort}
                </Badge>
                <Badge className={getImpactColor(action.impact)} variant="outline">
                  Impacto: {action.impact}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">{action.description}</p>
            
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {getPillarName(action.pillar_id)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {action.timeframe}
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {action.success_metric}
              </span>
            </div>
            
            {action.resources && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Recursos:</span> {action.resources}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Sparkles className="h-5 w-5 text-primary" />
                Plan de Acción Personalizado
              </CardTitle>
              <CardDescription className="font-lato-light mt-1">
                Generado por IA basado en tu diagnóstico de madurez
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
          <p className="text-muted-foreground mb-4">{actionPlan.overview}</p>
          
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-background/60">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                ROI Estimado
              </div>
              <p className="font-lato-bold text-foreground">{actionPlan.estimated_roi}</p>
            </div>
            <div className="p-3 rounded-lg bg-background/60">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <ListChecks className="h-4 w-4" />
                Acciones Totales
              </div>
              <p className="font-lato-bold text-foreground">{totalActions} acciones</p>
            </div>
            <div className="p-3 rounded-lg bg-background/60">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                Progreso
              </div>
              <p className="font-lato-bold text-foreground">{completedCount} completadas</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-lato-medium">Progreso del Plan</span>
              <span className="font-lato-bold">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Action Tabs */}
      <Tabs defaultValue="quick_wins" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="quick_wins" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Wins</span>
            <Badge variant="secondary" className="ml-1">{(actionPlan.quick_wins || []).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Prioritarias</span>
            <Badge variant="secondary" className="ml-1">{(actionPlan.priority_actions || []).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="strategic" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Estratégicas</span>
            <Badge variant="secondary" className="ml-1">{(actionPlan.strategic_initiatives || []).length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick_wins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-headline">
                <Zap className="h-5 w-5 text-secondary" />
                Quick Wins
              </CardTitle>
              <CardDescription>
                Acciones de alto impacto que puedes implementar en menos de 2 semanas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(actionPlan.quick_wins || []).map(action => renderActionItem(action, 'high'))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-headline">
                <PlayCircle className="h-5 w-5 text-primary" />
                Acciones Prioritarias
              </CardTitle>
              <CardDescription>
                Implementar en los próximos 1-3 meses para resultados significativos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {actionPlan.priority_actions.map(action => renderActionItem(action, 'medium'))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-headline">
                <Target className="h-5 w-5 text-amber-500" />
                Iniciativas Estratégicas
              </CardTitle>
              <CardDescription>
                Transformación a largo plazo (3-6 meses) para consolidar tu liderazgo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {actionPlan.strategic_initiatives.map(action => renderActionItem(action, 'low'))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* KPIs Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <BarChart3 className="h-5 w-5 text-primary" />
            KPIs para Medir tu Progreso
          </CardTitle>
          <CardDescription>
            Métricas clave para evaluar el impacto de tu plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {actionPlan.kpis.map((kpi, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg bg-muted/30 border border-border"
              >
                <h4 className="font-lato-bold text-foreground mb-2">{kpi.name}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Baseline actual:</span>
                    <span className="font-medium">{kpi.current_baseline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meta:</span>
                    <span className="font-medium text-primary">{kpi.target}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Medición:</span>
                    <span className="font-medium">{kpi.measurement_frequency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIActionPlanComponent;
