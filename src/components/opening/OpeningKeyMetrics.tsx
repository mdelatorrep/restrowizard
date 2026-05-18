import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Target, Calendar, Zap } from 'lucide-react';
import type { ProjectMetrics } from './openingResultsHelpers';

interface Props {
  investmentLabel: string;
  currencyCode: string;
  roiLabel: string;
  metrics: ProjectMetrics;
  daysUntilOpening: number | null;
}

export const OpeningKeyMetrics: React.FC<Props> = ({ investmentLabel, currencyCode, roiLabel, metrics, daysUntilOpening }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
      <CardContent className="pt-6 relative">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl shadow-inner"><DollarSign className="h-7 w-7 text-primary" /></div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Inversión Total</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{investmentLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{currencyCode}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="relative overflow-hidden border-green-500/30 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-green-500/10 blur-2xl group-hover:bg-green-500/20 transition-colors" />
      <CardContent className="pt-6 relative">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-500/20 rounded-xl shadow-inner"><TrendingUp className="h-7 w-7 text-green-600 dark:text-green-400" /></div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">ROI Anual</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{roiLabel}</p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Retorno proyectado
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-colors" />
      <CardContent className="pt-6 relative">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-xl shadow-inner"><Target className="h-7 w-7 text-blue-600 dark:text-blue-400" /></div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Break-Even</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.breakEvenMonths} meses</p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">Punto de equilibrio</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="relative overflow-hidden border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl group-hover:bg-orange-500/20 transition-colors" />
      <CardContent className="pt-6 relative">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/20 rounded-xl shadow-inner"><Calendar className="h-7 w-7 text-orange-600 dark:text-orange-400" /></div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Countdown</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{daysUntilOpening !== null ? `${daysUntilOpening}` : '—'}</p>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-0.5">
              {daysUntilOpening !== null ? 'días hasta apertura' : 'Fecha por definir'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
