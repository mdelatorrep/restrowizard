import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SalesGoal } from '@/hooks/useSalesGoals';

export const GoalCard = ({ goal }: { goal: SalesGoal }) => {
  const progress = 0;
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
