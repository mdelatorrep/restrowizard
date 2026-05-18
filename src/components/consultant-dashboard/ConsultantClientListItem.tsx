import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DollarSign, ChefHat, Users, Utensils, Leaf } from 'lucide-react';

const getHealthColor = (h: number) =>
  h >= 80 ? 'text-green-500' : h >= 60 ? 'text-yellow-500' : 'text-destructive';

export const getHealthBadge = (h: number) => {
  if (h >= 80) return <Badge className="bg-green-500">Saludable</Badge>;
  if (h >= 60) return <Badge className="bg-yellow-500">Atención</Badge>;
  return <Badge variant="destructive">Crítico</Badge>;
};

interface Props {
  client: any;
  onWorkWith: (client: any, path: string) => void;
}

export function ConsultantClientListItem({ client, onWorkWith }: Props) {
  const score = client.diagnosis?.overall_score || 0;
  const actions = [
    { Icon: DollarSign, label: 'Finanzas', path: '/c/finances' },
    { Icon: ChefHat, label: 'Operaciones', path: '/c/operations' },
    { Icon: Users, label: 'Talento', path: '/c/talent' },
    { Icon: Utensils, label: 'Menú', path: '/c/menu-engineering' },
    { Icon: Leaf, label: 'Sostenibilidad', path: '/c/sustainability' },
  ];

  return (
    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
            🍽️
          </div>
          <div>
            <h4 className="font-semibold">{client.business?.name || 'Cliente'}</h4>
            <p className="text-sm text-muted-foreground">
              {client.business?.city || 'Sin ubicación'}
              {client.business?.cuisine_type && ` · ${client.business.cuisine_type}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getHealthBadge(score)}
          {(client.alerts_count || 0) > 0 && (
            <Badge variant="destructive">{client.alerts_count} alertas</Badge>
          )}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>Puntuación Madurez</span>
          <span className={getHealthColor(score)}>{score}%</span>
        </div>
        <Progress value={score} className="h-2" />
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map(({ Icon, label, path }) => (
          <Button key={label} variant="outline" size="sm" onClick={() => onWorkWith(client, path)}>
            <Icon className="h-4 w-4 mr-1" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
