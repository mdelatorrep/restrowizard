import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Calendar, RefreshCw } from 'lucide-react';

export type PeriodType = 'week' | 'month' | 'quarter';

interface Props {
  period: PeriodType;
  onPeriodChange: (p: PeriodType) => void;
  refreshing: boolean;
  onRefresh: () => void;
  aiLoading: boolean;
  onRunAI: () => void;
  aiDisabled?: boolean;
}

export const FinancesHeader = ({
  period,
  onPeriodChange,
  refreshing,
  onRefresh,
  aiLoading,
  onRunAI,
  aiDisabled,
}: Props) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-bold">Centro Financiero</h2>
      <p className="text-muted-foreground">Control en tiempo real de Prime Cost, P&L y rentabilidad</p>
    </div>
    <div className="flex items-center gap-3">
      <Select value={period} onValueChange={(v) => onPeriodChange(v as PeriodType)}>
        <SelectTrigger className="w-[140px]">
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">Esta Semana</SelectItem>
          <SelectItem value="month">Este Mes</SelectItem>
          <SelectItem value="quarter">Trimestre</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        Actualizar
      </Button>
      <Button onClick={onRunAI} disabled={aiLoading || aiDisabled}>
        <Brain className={`h-4 w-4 mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
        Análisis IA
      </Button>
    </div>
  </div>
);
