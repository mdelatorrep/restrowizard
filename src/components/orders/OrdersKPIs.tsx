import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, DollarSign, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface Props {
  kpis: {
    todayOrders?: number;
    todaySales?: number;
    avgOrderValue?: number;
    pendingOrders?: number;
    completionRate?: number;
  } | null | undefined;
}

export const OrdersKPIs: React.FC<Props> = ({ kpis }) => (
  <div className="grid md:grid-cols-4 gap-4">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Pedidos Hoy</p>
            <p className="text-3xl font-bold">{kpis?.todayOrders || 0}</p>
          </div>
          <ShoppingBag className="h-8 w-8 text-primary" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Ventas Hoy</p>
            <p className="text-3xl font-bold">{formatCurrency(kpis?.todaySales ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ticket prom.: {formatCurrency(kpis?.avgOrderValue ?? 0)}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-green-500" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
            <p className="text-3xl font-bold text-orange-600">{kpis?.pendingOrders || 0}</p>
          </div>
          <Clock className="h-8 w-8 text-orange-500" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Completados</p>
            <p className="text-3xl font-bold">{kpis?.completionRate || 0}%</p>
          </div>
          <ShoppingBag className="h-8 w-8 text-blue-500" />
        </div>
      </CardContent>
    </Card>
  </div>
);
