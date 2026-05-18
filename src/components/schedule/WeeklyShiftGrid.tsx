import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { StaffShift } from '@/hooks/useStaffSchedule';

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    scheduled: { label: 'Programado', className: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'En Curso', className: 'bg-yellow-100 text-yellow-800' },
    completed: { label: 'Completado', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800' },
    no_show: { label: 'Ausente', className: 'bg-red-100 text-red-800' },
  };
  const s = config[status] || config.scheduled;
  return <Badge className={s.className}>{s.label}</Badge>;
};

interface Props {
  weekDays: Date[];
  shifts: StaffShift[];
  onClockIn: (id: string) => void;
  onClockOut: (id: string) => void;
}

export const WeeklyShiftGrid: React.FC<Props> = ({ weekDays, shifts, onClockIn, onClockOut }) => (
  <Card>
    <CardHeader>
      <CardTitle>Calendario Semanal</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="text-center">
            <div className="font-medium text-sm mb-2">{format(day, 'EEE', { locale: es })}</div>
            <div className="text-xs text-muted-foreground mb-2">{format(day, 'd MMM', { locale: es })}</div>
            <div className="space-y-1 min-h-[100px]">
              {(shifts || [])
                .filter((s) => s.shift_date === format(day, 'yyyy-MM-dd'))
                .map((shift) => (
                  <div
                    key={shift.id}
                    className="p-2 bg-muted rounded text-xs cursor-pointer hover:bg-muted/80"
                    onClick={() => {
                      if (shift.status === 'scheduled') onClockIn(shift.id);
                      else if (shift.status === 'in_progress') onClockOut(shift.id);
                    }}
                  >
                    <div className="font-medium truncate">{shift.staff_member_name}</div>
                    <div className="text-muted-foreground">
                      {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                    </div>
                    <StatusBadge status={shift.status} />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
