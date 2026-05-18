import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SalesProjection } from '@/hooks/useSalesGoals';

export const ProjectionCard = ({ projection }: { projection: SalesProjection }) => {
  const confidence = projection.confidence_level || 0;
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-medium">Proyección IA</span>
          <Badge variant="outline">{(confidence * 100).toFixed(0)}% confianza</Badge>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(projection.projection_date), 'PPPP', { locale: es })}
            </p>
            <p className="text-2xl font-bold">${projection.projected_revenue?.toLocaleString()}</p>
          </div>
          {projection.projected_covers && (
            <p className="text-sm">
              <Users className="h-4 w-4 inline mr-1" />
              {projection.projected_covers} clientes estimados
            </p>
          )}
          {projection.ai_reasoning && (
            <p className="text-sm text-muted-foreground border-t pt-3">{projection.ai_reasoning}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
