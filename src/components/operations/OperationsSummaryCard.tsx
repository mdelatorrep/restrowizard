import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from 'lucide-react';

interface Props {
  kpis: any;
  loyaltyTotal: number;
  feedbackCount: number;
}

export const OperationsSummaryCard: React.FC<Props> = ({ kpis, loyaltyTotal, feedbackCount }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <Gauge className="mr-2 text-primary" />
        Resumen Operativo
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">{kpis?.ordersToday || 0}</div>
          <p className="text-sm font-medium text-muted-foreground">Pedidos del día</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">{kpis?.completedOrders || 0}</div>
          <p className="text-sm font-medium text-muted-foreground">Pedidos completados</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">{loyaltyTotal}</div>
          <p className="text-sm font-medium text-muted-foreground">Miembros lealtad</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">{feedbackCount}</div>
          <p className="text-sm font-medium text-muted-foreground">Feedbacks recibidos</p>
        </div>
      </div>
    </CardContent>
  </Card>
);
