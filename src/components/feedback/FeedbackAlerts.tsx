import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { CustomerFeedback } from '@/hooks/useFeedbackData';

interface Props {
  feedback: CustomerFeedback[];
  onRespond: (item: CustomerFeedback) => void;
}

export const FeedbackAlerts = ({ feedback, onRespond }: Props) => {
  const alerts = feedback.filter(f => f.sentiment_label === 'negative' && !f.responded);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alertas de Feedback Negativo
        </CardTitle>
        <CardDescription>Feedback que requiere atención inmediata</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            ¡Excelente! No hay alertas pendientes
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map(item => (
              <div key={item.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.customer_name || 'Anónimo'}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.comment}</p>
                  </div>
                  <Button size="sm" onClick={() => onRespond(item)}>
                    Responder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
