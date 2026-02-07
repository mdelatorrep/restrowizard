import React, { useState } from 'react';
import { GraduationCap, Plus, Users, CheckCircle2, AlertTriangle, Clock, BookOpen, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPIGrid, type KPICardData } from '@/components/layout/KPIGrid';
import { CreateTrainingDialog } from './CreateTrainingDialog';
import { TrainingProgram, TrainingProgress, TrainingKPIs, TRAINING_CATEGORIES } from '@/hooks/useStaffDevelopment';
import { StaffMemberExtended } from '@/hooks/useTalentAdvanced';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';

interface Props {
  programs: TrainingProgram[];
  progress: TrainingProgress[];
  kpis: TrainingKPIs;
  staff: StaffMemberExtended[];
  onCreateProgram: (data: any) => Promise<any>;
  onDeleteProgram: (id: string) => Promise<void>;
  onAssignTraining: (staffId: string, programId: string, dueDate?: string) => Promise<any>;
  onUpdateProgress: (id: string, updates: Partial<TrainingProgress>) => Promise<void>;
}

export const TrainingProgramsManager: React.FC<Props> = ({
  programs, progress, kpis, staff, onCreateProgram, onDeleteProgram, onAssignTraining, onUpdateProgress
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const kpiCards: KPICardData[] = [
    { label: 'Programas Activos', value: kpis.activePrograms, icon: BookOpen, subtext: `${kpis.totalPrograms} total` },
    { label: 'Tasa Completación', value: `${kpis.completionRate}%`, icon: CheckCircle2, subtext: `${kpis.staffCertified} empleados certificados` },
    { label: 'Cumplimiento Obligatorio', value: `${kpis.mandatoryComplianceRate}%`, icon: GraduationCap, subtext: 'Formaciones obligatorias' },
    { label: 'Vencidos', value: kpis.overdueCount, icon: AlertTriangle, subtext: 'Requieren atención', trend: kpis.overdueCount > 0 ? 'down' as const : undefined },
  ];

  const getCategoryInfo = (cat: string) => TRAINING_CATEGORIES.find(c => c.value === cat) || TRAINING_CATEGORIES[5];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      not_started: { label: 'Sin iniciar', variant: 'outline' },
      in_progress: { label: 'En progreso', variant: 'default' },
      completed: { label: 'Completado', variant: 'secondary' },
      expired: { label: 'Vencido', variant: 'destructive' },
    };
    const info = map[status] || map.not_started;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const getProgramProgress = (programId: string) => {
    const programProgress = progress.filter(p => p.training_program_id === programId);
    if (programProgress.length === 0) return { assigned: 0, completed: 0, rate: 0 };
    const completed = programProgress.filter(p => p.status === 'completed').length;
    return { assigned: programProgress.length, completed, rate: Math.round((completed / programProgress.length) * 100) };
  };

  const handleAssign = async () => {
    if (selectedStaffId && selectedProgramId) {
      await onAssignTraining(selectedStaffId, selectedProgramId);
      setAssignOpen(false);
      setSelectedStaffId('');
      setSelectedProgramId('');
    }
  };

  return (
    <div className="space-y-6">
      <KPIGrid kpis={kpiCards} columns={4} />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Programa
        </Button>
        <Button variant="outline" onClick={() => setAssignOpen(true)} disabled={programs.length === 0 || staff.length === 0}>
          <UserPlus className="h-4 w-4 mr-2" /> Asignar Formación
        </Button>
      </div>

      {/* Programs Grid */}
      {programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Sin programas de formación</h3>
            <p className="text-muted-foreground mt-1">Crea tu primer programa para comenzar a capacitar a tu equipo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(program => {
            const cat = getCategoryInfo(program.category);
            const prog = getProgramProgress(program.id);
            return (
              <Card key={program.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <div>
                        <CardTitle className="text-base">{program.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{cat.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {program.is_mandatory && <Badge variant="destructive" className="text-[10px]">Obligatorio</Badge>}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar programa?</AlertDialogTitle>
                            <AlertDialogDescription>Se eliminará el programa y todo el progreso asociado.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteProgram(program.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {program.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {program.estimated_hours}h</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {prog.assigned} asignados</span>
                    {program.position && <Badge variant="outline" className="text-[10px]">{program.position}</Badge>}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progreso general</span>
                      <span className="font-medium">{prog.rate}%</span>
                    </div>
                    <Progress value={prog.rate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Progress Table */}
      {progress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progreso Individual</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Límite</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.staff_name || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{getCategoryInfo(p.program_category || '').icon}</span>
                        <span className="text-sm">{p.program_title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={p.progress_percent} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-8">{p.progress_percent}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-sm">
                      {p.due_date ? new Date(p.due_date).toLocaleDateString('es') : '—'}
                    </TableCell>
                    <TableCell>
                      {p.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateProgress(p.id, {
                            status: 'completed',
                            progress_percent: 100,
                            score: 100,
                          })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Completar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CreateTrainingDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={onCreateProgram} />

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Formación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Empleado</label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {s.position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Programa</label>
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar programa" /></SelectTrigger>
                <SelectContent>
                  {programs.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={!selectedStaffId || !selectedProgramId}>Asignar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
