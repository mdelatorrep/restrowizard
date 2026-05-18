import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface Props {
  goalsCount: number;
  currentGoal: number;
  projectionsCount: number;
  progressPercent: number;
}

export const SalesGoalsKPIs = ({ goalsCount, currentGoal, projectionsCount, progressPercent }: Props) => (
  <div className="grid md:grid-cols-4 gap-4">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Metas Activas</p>
            <p className="text-3xl font-bold">{goalsCount}</p>
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
            <p className="text-3xl font-bold">${currentGoal.toLocaleString()}</p>
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
            <p className="text-3xl font-bold">{projectionsCount}</p>
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
            <p className="text-3xl font-bold">{progressPercent}%</p>
          </div>
          <DollarSign className="h-8 w-8 text-orange-500" />
        </div>
      </CardContent>
    </Card>
  </div>
);
