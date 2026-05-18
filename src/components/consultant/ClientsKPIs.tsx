import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CheckCircle, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface Props {
  total: number;
  active: number;
  prospects: number;
  pending: number;
  withAlerts: number;
}

export const ClientsKPIs: React.FC<Props> = ({ total, active, prospects, pending, withAlerts }) => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Clientes</p>
            <p className="text-3xl font-bold">{total}</p>
          </div>
          <Users className="h-8 w-8 text-primary opacity-20" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Activos</p>
            <p className="text-3xl font-bold text-green-500">{active}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Prospectos</p>
            <p className="text-3xl font-bold text-blue-500">{prospects}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-500 opacity-20" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
            <p className="text-3xl font-bold text-amber-500">{pending}</p>
          </div>
          <Clock className="h-8 w-8 text-amber-500 opacity-20" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Con Alertas</p>
            <p className="text-3xl font-bold text-destructive">{withAlerts}</p>
          </div>
          <AlertCircle className="h-8 w-8 text-destructive opacity-20" />
        </div>
      </CardContent>
    </Card>
  </div>
);
