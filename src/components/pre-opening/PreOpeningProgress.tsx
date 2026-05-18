import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  progressPercent: number;
  completedTasks: number;
  totalTasks: number;
  overdueCount: number;
  upcomingCount: number;
}

export const PreOpeningProgress: React.FC<Props> = ({
  progressPercent, completedTasks, totalTasks, overdueCount, upcomingCount,
}) => (
  <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
    <Card>
      <CardContent className="p-3 sm:p-4 md:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1">
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Completado</span>
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5 sm:h-2" />
        <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
          {completedTasks} de {totalTasks} tareas
        </p>
      </CardContent>
    </Card>

    <Card className={overdueCount > 0 ? 'border-warning' : ''}>
      <CardContent className="p-3 sm:p-4 md:pt-6">
        <div className="flex items-center gap-1 sm:gap-2 mb-2">
          {overdueCount > 0
            ? <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-warning shrink-0" />
            : <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-success shrink-0" />}
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Pendientes</span>
        </div>
        <p className="text-sm sm:text-lg md:text-2xl font-bold">
          {overdueCount > 0
            ? <span className="text-warning">{overdueCount} atrasadas</span>
            : <span className="text-success">Al día</span>}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-3 sm:p-4 md:pt-6">
        <div className="flex items-center gap-1 sm:gap-2 mb-2">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-info shrink-0" />
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Próximas</span>
        </div>
        <p className="text-lg sm:text-xl md:text-2xl font-bold text-info">{upcomingCount}</p>
        <p className="text-[9px] sm:text-xs text-muted-foreground">por completar</p>
      </CardContent>
    </Card>
  </div>
);
