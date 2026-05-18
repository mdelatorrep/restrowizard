import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  alerts: any[];
}

export function ConsultantAlertsCard({ alerts }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Alertas Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">Sin alertas pendientes</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 4).map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 p-2 rounded border">
                <div
                  className={`h-2 w-2 rounded-full mt-2 ${
                    alert.priority === 'high' || alert.priority === 'critical'
                      ? 'bg-destructive'
                      : 'bg-yellow-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.business_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
