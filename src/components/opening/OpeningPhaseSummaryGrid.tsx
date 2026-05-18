import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ChevronRight, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LinkifyText } from '@/lib/linkifyText';
import { PHASES } from '@/hooks/useBusinessOpening';
import type { PhaseAnalysis } from '@/hooks/useBusinessProject';
import {
  PHASE_ICONS, PHASE_COLORS, PHASE_DESCRIPTIONS, getRecommendations, getPhaseHighlight,
} from './openingResultsHelpers';

interface Props {
  analyses: PhaseAnalysis[];
  currencySymbol: string;
  onSelectPhase: () => void;
}

export const OpeningPhaseSummaryGrid: React.FC<Props> = ({ analyses, currencySymbol, onSelectPhase }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {PHASES.map((phase) => {
      const analysis = analyses.find((a) => a.phase === phase.id);
      if (!analysis) return null;
      const Icon = PHASE_ICONS[phase.id];
      const colors = PHASE_COLORS[phase.id];
      const recommendations = getRecommendations(analysis);
      const highlight = getPhaseHighlight(analysis, phase.id);
      const timeEstimate = analysis.estimated_time_days;
      const costEstimate = analysis.estimated_cost;

      return (
        <Card
          key={phase.id}
          className={cn('relative overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer', colors.border)}
          onClick={onSelectPhase}
        >
          <div className={cn('absolute inset-0 opacity-30', colors.bg)} />
          <CardHeader className="pb-2 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-xl shadow-sm', colors.bg)}>
                  <Icon className={cn('h-5 w-5', colors.text)} />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">{phase.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{PHASE_DESCRIPTIONS[phase.id]}</p>
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="relative pt-0 space-y-3">
            {highlight && (
              <div className={cn('p-2.5 rounded-lg border', colors.bg, colors.border)}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{highlight.label}</p>
                <LinkifyText className={cn('text-sm font-semibold mt-0.5 block', colors.text)}>{highlight.value}</LinkifyText>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {costEstimate && (
                <Badge variant="outline" className={cn('text-xs', colors.text, colors.border)}>
                  <DollarSign className="h-3 w-3 mr-0.5" />
                  {currencySymbol}{costEstimate.toLocaleString()}
                </Badge>
              )}
              {timeEstimate && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />{timeEstimate} días
                </Badge>
              )}
            </div>
            {recommendations.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Puntos Clave</p>
                {recommendations.slice(0, 3).map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5', colors.text.replace('text-', 'bg-'))} />
                    <LinkifyText className="text-foreground/80 line-clamp-2 block">{rec}</LinkifyText>
                  </div>
                ))}
              </div>
            )}
            {recommendations.length === 0 && !highlight && (
              <p className="text-xs text-muted-foreground italic">Análisis completado. Haz clic para ver detalles.</p>
            )}
            <div className="flex items-center justify-end pt-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Ver análisis completo</span><ChevronRight className="h-3 w-3 ml-1" />
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
