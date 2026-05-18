import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChecklistItem } from '@/hooks/useBusinessProject';
import { CHECKLIST_PHASE_LABELS, CHECKLIST_PHASE_ICONS } from './openingResultsHelpers';

interface Props {
  checklist: ChecklistItem[];
  checklistProgress: number;
  groupedChecklist: Record<string, ChecklistItem[]>;
  orderedChecklistPhases: string[];
  onToggleChecklistItem: (id: string, c: boolean) => void;
  onGenerateChecklist?: () => Promise<unknown> | void;
  isGeneratingChecklist?: boolean;
}

export const OpeningChecklistTab: React.FC<Props> = ({
  checklist, checklistProgress, groupedChecklist, orderedChecklistPhases,
  onToggleChecklistItem, onGenerateChecklist, isGeneratingChecklist,
}) => {
  const hasChecklist = checklist.length > 0;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Checklist de Apertura</CardTitle>
            <CardDescription>
              {checklist.filter((c) => c.is_completed).length} de {checklist.length} tareas completadas
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{Math.round(checklistProgress)}%</p>
          </div>
        </div>
        <Progress value={checklistProgress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        {!hasChecklist ? (
          <div className="space-y-3 py-6">
            <p className="text-sm text-muted-foreground">No hay tareas aún. Genera un checklist para empezar con acciones concretas.</p>
            {onGenerateChecklist && (
              <Button variant="outline" onClick={() => void onGenerateChecklist()} disabled={!!isGeneratingChecklist} className="w-full">
                {isGeneratingChecklist ? 'Generando checklist…' : 'Generar checklist'}
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <Accordion type="multiple" defaultValue={orderedChecklistPhases} className="space-y-2">
              {orderedChecklistPhases.map((phase, phaseIndex) => {
                const items = groupedChecklist[phase];
                const completedInPhase = items.filter((i) => i.is_completed).length;
                const allCompleted = completedInPhase === items.length;
                const Icon = CHECKLIST_PHASE_ICONS[phase] || ListChecks;
                const phaseName = CHECKLIST_PHASE_LABELS[phase] || phase;
                return (
                  <AccordionItem key={phase} value={phase} className={cn(
                    'border rounded-lg px-4 transition-colors',
                    allCompleted && 'bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800'
                  )}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                          allCompleted ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary')}>
                          {phaseIndex + 1}
                        </div>
                        <Icon className={cn('h-5 w-5', allCompleted ? 'text-green-600' : 'text-primary')} />
                        <span className="font-medium">{phaseName}</span>
                        <Badge variant={allCompleted ? 'default' : 'secondary'} className={cn(allCompleted && 'bg-green-500')}>
                          {completedInPhase}/{items.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {items.map((item) => (
                          <div key={item.id} className={cn(
                            'flex items-start gap-3 p-3 rounded-lg transition-colors',
                            item.is_completed ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/50 hover:bg-muted'
                          )}>
                            <Checkbox checked={item.is_completed}
                              onCheckedChange={(c) => onToggleChecklistItem(item.id, c as boolean)} className="mt-0.5" />
                            <div className="flex-1">
                              <p className={cn('font-medium', item.is_completed && 'line-through text-muted-foreground')}>{item.title}</p>
                              {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
