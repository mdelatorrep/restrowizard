import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Zap, Clock, MessageSquare } from 'lucide-react';

interface Props {
  kpis: any;
  feedbackCount: number;
}

export const OperationsInsightsCard: React.FC<Props> = ({ kpis, feedbackCount }) => (
  <Card className="lg:col-span-2">
    <CardHeader>
      <CardTitle className="flex items-center">
        <BarChart3 className="mr-2 text-primary" />
        Insights de Operaciones
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {kpis?.peakHours && kpis.peakHours.length > 0 && (
          <div className="p-4 bg-muted rounded-lg border-l-4 border-primary">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-2">
                  Horas pico identificadas: {kpis.peakHours.join(', ')}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Optimiza el personal durante estas horas para mejor servicio
                </p>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  Potencial: +15% eficiencia
                </Badge>
              </div>
              <Zap className="text-primary ml-2" size={20} />
            </div>
          </div>
        )}

        {kpis?.queueLength !== undefined && kpis.queueLength > 0 && (
          <div className="p-4 bg-muted rounded-lg border-l-4 border-orange-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-2">
                  {kpis.queueLength} pedidos en cola
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Monitorea la cola para evitar demoras excesivas
                </p>
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                  Atención requerida
                </Badge>
              </div>
              <Clock className="text-orange-500 ml-2" size={20} />
            </div>
          </div>
        )}

        {feedbackCount > 0 && (
          <div className="p-4 bg-muted rounded-lg border-l-4 border-blue-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-2">
                  {feedbackCount} feedbacks recibidos
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Analiza las opiniones de tus clientes para mejorar
                </p>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  Ver detalles en Feedback
                </Badge>
              </div>
              <MessageSquare className="text-blue-500 ml-2" size={20} />
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);
