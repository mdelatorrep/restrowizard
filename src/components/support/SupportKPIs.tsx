import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Headphones, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  kpis: {
    totalTickets?: number;
    openTickets?: number;
    urgentTickets?: number;
    resolutionRate?: number;
  } | null | undefined;
}

export const SupportKPIs: React.FC<Props> = ({ kpis }) => (
  <div className="grid md:grid-cols-4 gap-4">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Tickets</p>
            <p className="text-3xl font-bold">{kpis?.totalTickets || 0}</p>
          </div>
          <Headphones className="h-8 w-8 text-primary" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Abiertos</p>
            <p className="text-3xl font-bold text-blue-600">{kpis?.openTickets || 0}</p>
          </div>
          <MessageSquare className="h-8 w-8 text-blue-500" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Urgentes</p>
            <p className="text-3xl font-bold text-red-600">{kpis?.urgentTickets || 0}</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">En Proceso</p>
            <p className="text-3xl font-bold text-green-600">{kpis?.resolutionRate || 0}%</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
      </CardContent>
    </Card>
  </div>
);
