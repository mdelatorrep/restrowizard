import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle } from 'lucide-react';
import type { ChecklistItem } from '@/hooks/useBusinessProject';

interface Props {
  urgentItems: ChecklistItem[];
  onToggleChecklistItem: (id: string, c: boolean) => void;
  onGenerateChecklist?: () => Promise<unknown> | void;
  isGeneratingChecklist?: boolean;
}

export const OpeningUrgentActions: React.FC<Props> = ({ urgentItems, onToggleChecklistItem, onGenerateChecklist, isGeneratingChecklist }) => (
  <Card className="border-orange-200 dark:border-orange-800">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <CardTitle className="text-lg">Acciones Inmediatas</CardTitle>
      </div>
      <CardDescription>Las primeras 5 tareas que debes completar para comenzar</CardDescription>
    </CardHeader>
    <CardContent>
      {urgentItems.length > 0 ? (
        <div className="space-y-3">
          {urgentItems.map((item, index) => (
            <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
              </div>
              <Checkbox checked={item.is_completed} onCheckedChange={(c) => onToggleChecklistItem(item.id, c as boolean)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Aún no se generó el checklist para este proyecto.</p>
          {onGenerateChecklist && (
            <Button variant="outline" onClick={() => void onGenerateChecklist()} disabled={!!isGeneratingChecklist} className="w-full">
              {isGeneratingChecklist ? 'Generando checklist…' : 'Generar checklist ahora'}
            </Button>
          )}
        </div>
      )}
    </CardContent>
  </Card>
);
