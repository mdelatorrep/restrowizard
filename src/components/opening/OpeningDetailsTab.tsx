import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PHASES } from '@/hooks/useBusinessOpening';
import type { PhaseAnalysis } from '@/hooks/useBusinessProject';
import { AnalysisContentRenderer } from './AnalysisContentRenderer';
import { PHASE_ICONS, PHASE_COLORS, PHASE_DESCRIPTIONS, getAnalysisContent } from './openingResultsHelpers';

interface Props {
  analyses: PhaseAnalysis[];
  currencySymbol: string;
}

export const OpeningDetailsTab: React.FC<Props> = ({ analyses, currencySymbol }) => (
  <Card>
    <CardContent className="pt-6">
      <Accordion type="single" collapsible className="space-y-3">
        {PHASES.map((phase) => {
          const analysis = analyses.find((a) => a.phase === phase.id);
          if (!analysis) return null;
          const Icon = PHASE_ICONS[phase.id];
          const colors = PHASE_COLORS[phase.id];
          const content = getAnalysisContent(analysis);
          const costEstimate = analysis.estimated_cost;
          const timeEstimate = analysis.estimated_time_days;
          return (
            <AccordionItem key={phase.id} value={phase.id}
              className={cn('border rounded-xl overflow-hidden transition-all', colors.border)}>
              <AccordionTrigger className="hover:no-underline px-5 py-4 data-[state=open]:bg-muted/30">
                <div className="flex items-center gap-4 w-full">
                  <div className={cn('p-3 rounded-xl shadow-sm', colors.bg)}>
                    <Icon className={cn('h-6 w-6', colors.text)} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-base">{phase.name}</p>
                    <p className="text-sm text-muted-foreground">{PHASE_DESCRIPTIONS[phase.id]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {costEstimate && (
                      <Badge variant="secondary" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-1" />{currencySymbol}{costEstimate.toLocaleString()}
                      </Badge>
                    )}
                    {timeEstimate && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />{timeEstimate}d
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className={cn('px-5 py-5 border-t', colors.border, 'bg-gradient-to-b from-muted/20 to-transparent')}>
                  <AnalysisContentRenderer content={content} phaseId={phase.id} />
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </CardContent>
  </Card>
);
