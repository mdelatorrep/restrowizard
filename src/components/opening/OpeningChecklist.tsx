import { ChecklistItem } from '@/hooks/useBusinessOpening';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListChecks, CheckCircle2 } from 'lucide-react';

interface OpeningChecklistProps {
  items: ChecklistItem[];
  onToggle: (itemId: string, isCompleted: boolean) => void;
}

const PHASE_LABELS: Record<string, string> = {
  planning: 'Planeación',
  legal: 'Legal y Permisos',
  location: 'Ubicación',
  equipment: 'Equipamiento',
  suppliers: 'Proveedores',
  staffing: 'Personal',
  marketing: 'Marketing',
  pre_opening: 'Pre-apertura',
  opening: 'Apertura',
};

export function OpeningChecklist({ items, onToggle }: OpeningChecklistProps) {
  const completedCount = items.filter(item => item.is_completed).length;
  const progressPercent = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  // Group items by phase
  const itemsByPhase = items.reduce((acc, item) => {
    const phase = item.phase || 'planning';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const phases = Object.keys(itemsByPhase);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <CardTitle>Checklist de Apertura</CardTitle>
          </div>
          <Badge variant={progressPercent === 100 ? "default" : "secondary"}>
            {completedCount} / {items.length} completados
          </Badge>
        </div>
        <CardDescription>
          Sigue estos pasos para asegurar una apertura exitosa
        </CardDescription>
        <Progress value={progressPercent} className="mt-3" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {phases.map((phase) => {
              const phaseItems = itemsByPhase[phase];
              const phaseCompleted = phaseItems.filter(i => i.is_completed).length;
              const allCompleted = phaseCompleted === phaseItems.length;

              return (
                <div key={phase} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium flex items-center gap-2">
                      {allCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {PHASE_LABELS[phase] || phase}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {phaseCompleted}/{phaseItems.length}
                    </span>
                  </div>
                  
                  <div className="space-y-2 pl-2 border-l-2 border-muted">
                    {phaseItems
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                            item.is_completed ? 'bg-muted/50' : 'hover:bg-muted/30'
                          }`}
                        >
                          <Checkbox
                            id={item.id}
                            checked={item.is_completed}
                            onCheckedChange={(checked) => onToggle(item.id, !!checked)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={item.id}
                              className={`text-sm font-medium cursor-pointer ${
                                item.is_completed ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {item.title}
                            </label>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
