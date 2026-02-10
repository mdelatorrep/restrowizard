import { Calendar, MapPin, DollarSign, MessageSquare, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const urgencyConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  flexible: { label: 'Flexible', color: 'bg-green-100 text-green-700' },
};

const categoryLabels: Record<string, string> = {
  equipment: 'Equipamiento', technology: 'Tecnología', food_supplies: 'Ingredientes',
  consulting: 'Consultoría', design: 'Diseño', catering: 'Catering',
  photography: 'Fotografía', music: 'Música', decoration: 'Decoración',
  lighting: 'Iluminación', entertainment: 'Entretenimiento', flowers: 'Flores', other: 'Otro',
};

interface RequestCardProps {
  request: any;
  showActions?: boolean;
}

const RequestCard = ({ request, showActions = true }: RequestCardProps) => {
  const navigate = useNavigate();
  const urgency = urgencyConfig[request.urgency] || urgencyConfig.normal;

  return (
    <Card className="bg-card hover:shadow-lg transition-all border border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">{categoryLabels[request.category] || request.category}</Badge>
              <Badge className={`${urgency.color} border-0 text-[10px]`}>
                {request.urgency === 'urgent' && <AlertTriangle className="h-3 w-3 mr-0.5" />}
                {urgency.label}
              </Badge>
            </div>
            <CardTitle className="text-base">{request.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {request.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{request.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
          {request.city && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{request.city}</span>
          )}
          {(request.budget_min || request.budget_max) && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {request.budget_min && request.budget_max
                ? `$${request.budget_min.toLocaleString()} - $${request.budget_max.toLocaleString()}`
                : request.budget_max ? `Hasta $${request.budget_max.toLocaleString()}` : `Desde $${request.budget_min?.toLocaleString()}`
              }
            </span>
          )}
          {request.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(request.deadline), 'dd MMM yyyy', { locale: es })}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {request.proposals_count || 0} propuestas
          </span>
          {showActions && (
            <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate(`/services/request/${request.id}`)}>
              Ver Detalle
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestCard;
