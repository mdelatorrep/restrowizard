import { Card, CardContent } from '@/components/ui/card';
import { Users, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

interface Props {
  activeClientsCount: number;
  totalMonthlyRevenue: number;
  highPriorityAlertsCount: number;
  totalPending: number;
}

export function ConsultantKPIs({
  activeClientsCount,
  totalMonthlyRevenue,
  highPriorityAlertsCount,
  totalPending,
}: Props) {
  const kpis = [
    { label: 'Clientes Activos', value: activeClientsCount, Icon: Users, color: 'text-primary' },
    { label: 'Ingresos Mensuales', value: `$${(totalMonthlyRevenue / 1000).toFixed(0)}k`, Icon: DollarSign, color: 'text-green-500' },
    { label: 'Alertas Pendientes', value: highPriorityAlertsCount, Icon: AlertCircle, color: 'text-destructive', valueColor: 'text-destructive' },
    { label: 'Por Cobrar', value: `$${(totalPending / 1000).toFixed(0)}k`, Icon: TrendingUp, color: 'text-yellow-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(({ label, value, Icon, color, valueColor }) => (
        <Card key={label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-3xl font-bold ${valueColor ?? ''}`}>{value}</p>
              </div>
              <Icon className={`h-10 w-10 ${color} opacity-20`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
