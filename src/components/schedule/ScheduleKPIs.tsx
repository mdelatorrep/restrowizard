import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, DollarSign, CheckCircle } from 'lucide-react';

interface KPIs {
  totalShifts: number;
  totalHoursScheduled: number;
  totalLaborCost: number;
  completionRate: number;
}

const Item = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        {icon}
      </div>
    </CardContent>
  </Card>
);

export const ScheduleKPIs: React.FC<{ kpis: KPIs }> = ({ kpis }) => (
  <div className="grid md:grid-cols-4 gap-4">
    <Item label="Turnos" value={String(kpis.totalShifts)} icon={<Calendar className="h-8 w-8 text-primary" />} />
    <Item label="Horas Programadas" value={`${kpis.totalHoursScheduled.toFixed(0)}h`} icon={<Clock className="h-8 w-8 text-blue-500" />} />
    <Item label="Costo Labor" value={`$${kpis.totalLaborCost.toLocaleString()}`} icon={<DollarSign className="h-8 w-8 text-green-500" />} />
    <Item label="Cumplimiento" value={`${kpis.completionRate.toFixed(0)}%`} icon={<CheckCircle className="h-8 w-8 text-purple-500" />} />
  </div>
);
