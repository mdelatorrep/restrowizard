import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStaffSchedule, StaffShift } from '@/hooks/useStaffSchedule';
import { useTalentData } from '@/hooks/useTalentData';
import { useAIAgent } from '@/hooks/useAIAgent';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { 
  Calendar, Clock, Users, DollarSign, Plus, 
  Play, Square, Loader2, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle, Sparkles
} from 'lucide-react';
import { format, addWeeks, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    scheduled: { label: 'Programado', className: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'En Curso', className: 'bg-yellow-100 text-yellow-800' },
    completed: { label: 'Completado', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800' },
    no_show: { label: 'Ausente', className: 'bg-red-100 text-red-800' }
  };
  const s = config[status] || config.scheduled;
  return <Badge className={s.className}>{s.label}</Badge>;
};

const StaffSchedule: React.FC = () => {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  
  const { 
    shifts, 
    staffWithShifts, 
    kpis, 
    loading, 
    addShift, 
    updateShift, 
    deleteShift,
    clockIn,
    clockOut
  } = useStaffSchedule(weekStart);
  
  const { staff } = useTalentData();
  const { optimizeSchedule, forecastLaborCost, loading: aiLoading } = useAIAgent();

  const [shiftForm, setShiftForm] = useState({
    staff_member_id: '',
    shift_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '17:00',
    break_minutes: 30,
    notes: ''
  });

  const handleAddShift = async () => {
    if (!shiftForm.staff_member_id) return;
    
    await addShift({
      staff_member_id: shiftForm.staff_member_id,
      shift_date: shiftForm.shift_date,
      start_time: shiftForm.start_time,
      end_time: shiftForm.end_time,
      break_minutes: shiftForm.break_minutes,
      hourly_rate_override: null,
      actual_start_time: null,
      actual_end_time: null,
      status: 'scheduled',
      notes: shiftForm.notes || null
    });
    
    setShowAddDialog(false);
    setShiftForm({
      staff_member_id: '',
      shift_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '17:00',
      break_minutes: 30,
      notes: ''
    });
  };

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
      shifts: shifts.map(s => ({
        staffName: s.staff_member_name,
        date: s.shift_date,
        start: s.start_time,
        end: s.end_time,
        status: s.status,
        hoursWorked: s.hours_worked,
        cost: s.cost
      })),
      kpis: kpis,
      staffSummary: staffWithShifts.map(s => ({
        name: s.name,
        position: s.position,
        totalHours: s.total_hours,
        totalCost: s.total_cost,
        shiftsCount: s.shifts.length
      })),
      weekRange: {
        start: format(weekStart, 'yyyy-MM-dd'),
        end: format(weekDays[6], 'yyyy-MM-dd')
      }
    };
    
    const result = await optimizeSchedule(scheduleData);
    if (result) setAiInsights(result);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAnalyzeSchedule} disabled={aiLoading || shifts.length === 0}>
            <Sparkles className="h-4 w-4 mr-2" />
            {aiLoading ? 'Analizando...' : 'Optimizar con IA'}
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Turno
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Turno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Empleado</Label>
                <Select 
                  value={shiftForm.staff_member_id} 
                  onValueChange={(v) => setShiftForm({ ...shiftForm, staff_member_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona empleado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input 
                  type="date"
                  value={shiftForm.shift_date}
                  onChange={(e) => setShiftForm({ ...shiftForm, shift_date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora Inicio</Label>
                  <Input 
                    type="time"
                    value={shiftForm.start_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hora Fin</Label>
                  <Input 
                    type="time"
                    value={shiftForm.end_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Descanso (minutos)</Label>
                <Input 
                  type="number"
                  value={shiftForm.break_minutes}
                  onChange={(e) => setShiftForm({ ...shiftForm, break_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Notas</Label>
                <Input 
                  placeholder="Notas opcionales..."
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleAddShift} className="w-full">
                Agregar Turno
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel
        title="Optimización de Turnos IA"
        description="Recomendaciones de horarios, predicción de horas extra y análisis de cobertura"
        insights={aiInsights}
        loading={aiLoading}
        onAnalyze={handleAnalyzeSchedule}
      />

      {/* Week Navigation */}
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

      {/* KPIs */}
      {kpis && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Turnos</p>
                  <p className="text-3xl font-bold">{kpis.totalShifts}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Horas Programadas</p>
                  <p className="text-3xl font-bold">{kpis.totalHoursScheduled.toFixed(0)}h</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Costo Labor</p>
                  <p className="text-3xl font-bold">${kpis.totalLaborCost.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cumplimiento</p>
                  <p className="text-3xl font-bold">{kpis.completionRate.toFixed(0)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weekly Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Calendario Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day.toISOString()} className="text-center">
                <div className="font-medium text-sm mb-2">
                  {format(day, 'EEE', { locale: es })}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {format(day, 'd MMM', { locale: es })}
                </div>
                <div className="space-y-1 min-h-[100px]">
                  {shifts
                    .filter(s => s.shift_date === format(day, 'yyyy-MM-dd'))
                    .map(shift => (
                      <div 
                        key={shift.id} 
                        className="p-2 bg-muted rounded text-xs cursor-pointer hover:bg-muted/80"
                        onClick={() => {
                          if (shift.status === 'scheduled') {
                            clockIn(shift.id);
                          } else if (shift.status === 'in_progress') {
                            clockOut(shift.id);
                          }
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

      {/* Staff Summary */}
      {staffWithShifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Empleado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffWithShifts.map(staff => (
                <div key={staff.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{staff.name}</p>
                      <p className="text-sm text-muted-foreground">{staff.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-lg font-bold">{staff.shifts.length}</p>
                      <p className="text-xs text-muted-foreground">Turnos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{staff.total_hours.toFixed(1)}h</p>
                      <p className="text-xs text-muted-foreground">Horas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">${staff.total_cost.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Costo</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
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
