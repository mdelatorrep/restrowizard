import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, AlertTriangle, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CustomerFeedback } from '@/hooks/useFeedbackData';
import { SentimentBadge, StarRating } from './FeedbackBadges';

interface Props {
  feedback: CustomerFeedback[];
  onAddClick: () => void;
  onRespond: (item: CustomerFeedback) => void;
}

export const FeedbackList = ({ feedback, onAddClick, onRespond }: Props) => {
  if (feedback.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sin feedback aún</h3>
          <p className="text-muted-foreground text-center mb-4">
            Empieza a recopilar opiniones de tus clientes
          </p>
          <Button onClick={onAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primer Feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {feedback.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-semibold">{item.customer_name || 'Anónimo'}</p>
                  <StarRating rating={item.rating} />
                  <SentimentBadge label={item.sentiment_label} />
                  {!item.responded && item.sentiment_label === 'negative' && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Requiere atención
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">{item.comment}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{format(new Date(item.created_at!), 'PPp', { locale: es })}</span>
                  <Badge variant="outline">{item.source}</Badge>
                  {item.customer_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {item.customer_email}
                    </span>
                  )}
                </div>
                {item.responded && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Tu respuesta:</p>
                    <p className="text-sm">{item.response_text}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!item.responded && (
                  <Button variant="outline" size="sm" onClick={() => onRespond(item)}>
                    Responder
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
