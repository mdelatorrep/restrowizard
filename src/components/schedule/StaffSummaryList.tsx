import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface StaffRow {
  id: string;
  name: string;
  position: string | null;
  total_hours: number;
  total_cost: number;
  shifts: unknown[];
}

export const StaffSummaryList: React.FC<{ staff: StaffRow[] }> = ({ staff }) => (
  <Card>
    <CardHeader>
      <CardTitle>Resumen por Empleado</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {(staff || []).map((s) => (
          <div key={s.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.position}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-lg font-bold">{s.shifts.length}</p>
                <p className="text-xs text-muted-foreground">Turnos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{s.total_hours.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">Horas</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">${s.total_cost.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Costo</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
