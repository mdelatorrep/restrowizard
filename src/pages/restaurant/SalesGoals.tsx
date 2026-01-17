import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSalesGoals, SalesGoal, SalesProjection } from '@/hooks/useSalesGoals';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, Plus, Loader2, TrendingUp, TrendingDown, 
  Calendar, DollarSign, Users, Sparkles, AlertTriangle
} from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

const GoalCard = ({ goal }: { goal: SalesGoal }) => {
  const progress = 0; // Will be calculated when we have actual sales data
  const isOnTrack = progress >= 80;
  const isBehind = progress < 50;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg capitalize">{goal.period_type}</CardTitle>
            <CardDescription>
              {format(new Date(goal.period_start), 'PP', { locale: es })} - {format(new Date(goal.period_end), 'PP', { locale: es })}
            </CardDescription>
          </div>
          <Badge variant={isOnTrack ? 'default' : isBehind ? 'destructive' : 'secondary'}>
            {isOnTrack ? 'En camino' : isBehind ? 'Atrasado' : 'Regular'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progreso de Ventas</span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-3" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-lg font-bold">${goal.revenue_goal?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Actual</p>
            <p className="text-lg font-bold text-primary">$0</p>
          </div>
        </div>

        {goal.covers_goal && (
          <div className="flex items-center justify-between text-sm border-t pt-3">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Meta Clientes
            </span>
            <span>{goal.covers_goal}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ProjectionCard = ({ projection }: { projection: SalesProjection }) => {
  const confidence = projection.confidence_level || 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-medium">Proyección IA</span>
          <Badge variant="outline">{(confidence * 100).toFixed(0)}% confianza</Badge>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(projection.projection_date), 'PPPP', { locale: es })}
            </p>
            <p className="text-2xl font-bold">${projection.projected_revenue?.toLocaleString()}</p>
          </div>
          {projection.projected_covers && (
            <p className="text-sm">
              <Users className="h-4 w-4 inline mr-1" />
              {projection.projected_covers} clientes estimados
            </p>
          )}
          {projection.ai_reasoning && (
            <p className="text-sm text-muted-foreground border-t pt-3">
              {projection.ai_reasoning}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SalesGoals = () => {
  const { goals, projections, kpis, loading, hasData, createGoal } = useSalesGoals();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [periodType, setPeriodType] = useState('monthly');

  const [goalForm, setGoalForm] = useState({
    period_type: 'monthly',
    period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    revenue_goal: 0,
    covers_goal: 0,
    avg_ticket_goal: 0,
  });

  const handlePeriodTypeChange = (type: string) => {
    const today = new Date();
    let start: Date, end: Date;

    switch (type) {
      case 'daily':
        start = today;
        end = today;
        break;
      case 'weekly':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'monthly':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'quarterly':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        end = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        break;
      default:
        start = startOfMonth(today);
        end = endOfMonth(today);
    }

    setGoalForm({
      ...goalForm,
      period_type: type,
      period_start: format(start, 'yyyy-MM-dd'),
      period_end: format(end, 'yyyy-MM-dd'),
    });
  };

  const handleCreateGoal = async () => {
    if (goalForm.revenue_goal <= 0) {
      toast({ title: 'Error', description: 'La meta de ventas debe ser mayor a 0', variant: 'destructive' });
      return;
    }
    await createGoal(goalForm);
    setShowCreateDialog(false);
    setGoalForm({
      period_type: 'monthly',
      period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      revenue_goal: 0,
      covers_goal: 0,
      avg_ticket_goal: 0,
    });
  };

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
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Meta de Ventas</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tipo de Período</Label>
                <Select
                  value={goalForm.period_type}
                  onValueChange={handlePeriodTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Fecha Inicio</Label>
                  <Input
                    type="date"
                    value={goalForm.period_start}
                    onChange={(e) => setGoalForm({ ...goalForm, period_start: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Fecha Fin</Label>
                  <Input
                    type="date"
                    value={goalForm.period_end}
                    onChange={(e) => setGoalForm({ ...goalForm, period_end: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Meta de Ventas ($)</Label>
                <Input
                  type="number"
                  value={goalForm.revenue_goal}
                  onChange={(e) => setGoalForm({ ...goalForm, revenue_goal: parseFloat(e.target.value) || 0 })}
                  placeholder="5000000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Meta de Clientes</Label>
                  <Input
                    type="number"
                    value={goalForm.covers_goal}
                    onChange={(e) => setGoalForm({ ...goalForm, covers_goal: parseInt(e.target.value) || 0 })}
                    placeholder="500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Ticket Promedio</Label>
                  <Input
                    type="number"
                    value={goalForm.avg_ticket_goal}
                    onChange={(e) => setGoalForm({ ...goalForm, avg_ticket_goal: parseFloat(e.target.value) || 0 })}
                    placeholder="35000"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateGoal}>Crear Meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Metas Activas</p>
                <p className="text-3xl font-bold">{kpis?.totalGoals || 0}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meta Actual</p>
                <p className="text-3xl font-bold">${(kpis?.currentGoal || 0).toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proyecciones</p>
                <p className="text-3xl font-bold">{kpis?.projectionsCount || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Promedio Confianza</p>
                <p className="text-3xl font-bold">{((kpis?.avgConfidence || 0) * 100).toFixed(0)}%</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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
                {goals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>

            {goals.length > 0 && goals.some(() => false) && (
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
              {projections.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Sin proyecciones aún</p>
                    <Button variant="outline" className="mt-4">
                      Generar Proyección
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {projections.map(projection => (
                    <ProjectionCard key={projection.id} projection={projection} />
                  ))}
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análisis Inteligente</CardTitle>
              </CardHeader>
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
