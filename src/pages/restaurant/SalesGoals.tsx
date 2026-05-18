import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSalesGoals } from '@/hooks/useSalesGoals';
import { Target, Plus, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { GoalCard } from '@/components/sales-goals/GoalCard';
import { ProjectionCard } from '@/components/sales-goals/ProjectionCard';
import { SalesGoalsKPIs } from '@/components/sales-goals/SalesGoalsKPIs';
import { CreateGoalDialog } from '@/components/sales-goals/CreateGoalDialog';

const SalesGoals = () => <SalesGoalsContent />;

export const SalesGoalsContent = () => {
  const { goals, projections, kpis, loading, hasData, createGoal } = useSalesGoals();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Metas de Ventas</h1>
          <p className="text-muted-foreground">Define y monitorea tus objetivos comerciales</p>
        </div>
        <CreateGoalDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreate={createGoal}
        />
      </div>

      <SalesGoalsKPIs
        goalsCount={(goals || []).length}
        currentGoal={kpis?.currentGoal || 0}
        projectionsCount={(projections || []).length}
        progressPercent={kpis?.progressPercent || 0}
      />

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin metas definidas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Establece objetivos para medir el desempeño de tu restaurante
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Metas Activas</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(goals || []).map(goal => <GoalCard key={goal.id} goal={goal} />)}
              </div>
            </div>

            {(goals || []).length > 0 && goals.some(() => false) && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800">Atención Requerida</p>
                      <p className="text-sm text-orange-700">
                        Algunas metas están por debajo del 50% de cumplimiento.
                        Considera estrategias para aumentar las ventas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Proyecciones IA
              </h2>
              {(projections || []).length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Sin proyecciones aún</p>
                    <Button variant="outline" className="mt-4">Generar Proyección</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {(projections || []).map(p => <ProjectionCard key={p.id} projection={p} />)}
                </div>
              )}
            </div>

            <Card>
              <CardHeader><CardTitle className="text-lg">Análisis Inteligente</CardTitle></CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Proyección con IA
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesGoals;
