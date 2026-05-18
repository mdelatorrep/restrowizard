import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStaffSchedule } from '@/hooks/useStaffSchedule';
import { useTalentData } from '@/hooks/useTalentData';
import { useAIAgent } from '@/hooks/useAIAgent';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { Calendar, Plus, Loader2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { format, addWeeks, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { AddShiftDialog } from '@/components/schedule/AddShiftDialog';
import { ScheduleKPIs } from '@/components/schedule/ScheduleKPIs';
import { WeeklyShiftGrid } from '@/components/schedule/WeeklyShiftGrid';
import { StaffSummaryList } from '@/components/schedule/StaffSummaryList';

const StaffSchedule: React.FC = () => {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const { shifts, staffWithShifts, kpis, loading, addShift, clockIn, clockOut } = useStaffSchedule(weekStart);
  const { staff } = useTalentData();
  const { optimizeSchedule, loading: aiLoading } = useAIAgent();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleAnalyzeSchedule = async () => {
    const scheduleData = {
      shifts: (shifts || []).map((s) => ({
        staffName: s.staff_member_name,
        date: s.shift_date,
        start: s.start_time,
        end: s.end_time,
        status: s.status,
        hoursWorked: s.hours_worked,
        cost: s.cost,
      })),
      kpis,
      staffSummary: (staffWithShifts || []).map((s) => ({
        name: s.name,
        position: s.position,
        totalHours: s.total_hours,
        totalCost: s.total_cost,
        shiftsCount: s.shifts.length,
      })),
      weekRange: {
        start: format(weekStart, 'yyyy-MM-dd'),
        end: format(weekDays[6], 'yyyy-MM-dd'),
      },
    };
    const result = await optimizeSchedule(scheduleData);
    if (result) setAiInsights(result);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAnalyzeSchedule} disabled={aiLoading || shifts.length === 0}>
            <Sparkles className="h-4 w-4 mr-2" />
            {aiLoading ? 'Analizando...' : 'Optimizar con IA'}
          </Button>
          <AddShiftDialog open={showAddDialog} onOpenChange={setShowAddDialog} staff={staff} onAdd={addShift} />
        </div>
      </div>

      <AIInsightsPanel
        title="Optimización de Turnos IA"
        description="Recomendaciones de horarios, predicción de horas extra y análisis de cobertura"
        insights={aiInsights}
        loading={aiLoading}
        onAnalyze={handleAnalyzeSchedule}
      />

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setWeekStart(addWeeks(weekStart, -1))}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Semana Anterior
        </Button>
        <h2 className="text-xl font-semibold">
          {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(weekDays[6], "d 'de' MMMM yyyy", { locale: es })}
        </h2>
        <Button variant="outline" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
          Semana Siguiente
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {kpis && <ScheduleKPIs kpis={kpis} />}

      <WeeklyShiftGrid weekDays={weekDays} shifts={shifts} onClockIn={clockIn} onClockOut={clockOut} />

      {staffWithShifts.length > 0 && <StaffSummaryList staff={staffWithShifts} />}

      {shifts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin turnos programados</h3>
            <p className="text-muted-foreground text-center mb-4">
              Programa turnos para calcular automáticamente el costo de labor
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primer Turno
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StaffSchedule;
