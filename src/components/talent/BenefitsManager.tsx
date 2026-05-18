import React, { useState } from 'react';
import { Gift, Plus, Users, DollarSign, Heart, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPIGrid, type KPICardData } from '@/components/layout/KPIGrid';
import { CreateBenefitDialog } from './CreateBenefitDialog';
import { StaffBenefit, BenefitAssignment, BenefitKPIs, BENEFIT_TYPES } from '@/hooks/useStaffDevelopment';
import { StaffMemberExtended } from '@/hooks/useTalentAdvanced';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';

interface Props {
  benefits: StaffBenefit[];
  assignments: BenefitAssignment[];
  kpis: BenefitKPIs;
  staff: StaffMemberExtended[];
  onCreateBenefit: (data: any) => Promise<any>;
  onDeleteBenefit: (id: string) => Promise<void>;
  onAssignBenefit: (staffId: string, benefitId: string, notes?: string) => Promise<any>;
  onUpdateAssignment: (id: string, updates: Partial<BenefitAssignment>) => Promise<void>;
  onRemoveAssignment: (id: string) => Promise<void>;
}

export const BenefitsManager: React.FC<Props> = ({
  benefits, assignments, kpis, staff, onCreateBenefit, onDeleteBenefit, onAssignBenefit, onUpdateAssignment, onRemoveAssignment
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedBenefitId, setSelectedBenefitId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const kpiCards: KPICardData[] = [
    { label: 'Beneficios Activos', value: kpis.activeBenefits, icon: Gift, subtext: `${kpis.totalBenefits} total` },
    { label: 'Empleados Cubiertos', value: kpis.staffCovered, icon: Users, subtext: `${kpis.coverageRate}% cobertura` },
    { label: 'Costo Mensual Est.', value: `$${kpis.estimatedMonthlyCost.toLocaleString()}`, icon: DollarSign, subtext: 'Beneficios fijos' },
    { label: 'Satisfacción', value: `${kpis.coverageRate}%`, icon: Heart, subtext: 'Cobertura del equipo' },
  ];

  const getTypeInfo = (type: string) => BENEFIT_TYPES.find(t => t.value === type) || BENEFIT_TYPES[7];

  const getValueDisplay = (benefit: StaffBenefit) => {
    if (benefit.value_type === 'percentage') return `${benefit.value}%`;
    if (benefit.value_type === 'unlimited') return 'Ilimitado';
    return `$${benefit.value?.toLocaleString() || 0}`;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Activo', variant: 'default' },
      paused: { label: 'Pausado', variant: 'secondary' },
      expired: { label: 'Expirado', variant: 'outline' },
      revoked: { label: 'Revocado', variant: 'destructive' },
    };
    const info = map[status] || map.active;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const getBenefitAssignments = (benefitId: string) => assignments.filter(a => a.benefit_id === benefitId);

  const handleAssign = async () => {
    const parsed = BenefitAssignmentSchema.safeParse({
      staff_member_id: selectedStaffId,
      benefit_id: selectedBenefitId,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    await onAssignBenefit(selectedStaffId, selectedBenefitId);
    setAssignOpen(false);
    setSelectedStaffId('');
    setSelectedBenefitId('');
  };

  return (
    <div className="space-y-6">
      <KPIGrid kpis={kpiCards} columns={4} />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Beneficio
        </Button>
        <Button variant="outline" onClick={() => setAssignOpen(true)} disabled={benefits.length === 0 || staff.length === 0}>
          <UserPlus className="h-4 w-4 mr-2" /> Asignar Beneficio
        </Button>
      </div>

      {/* Benefits Catalog */}
      {benefits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Gift className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Sin beneficios configurados</h3>
            <p className="text-muted-foreground mt-1">Crea tu primer beneficio para empezar a cuidar a tu equipo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map(benefit => {
            const typeInfo = getTypeInfo(benefit.benefit_type);
            const benefitAssigns = getBenefitAssignments(benefit.id);
            return (
              <Card key={benefit.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{typeInfo.icon}</span>
                      <div>
                        <CardTitle className="text-base">{benefit.benefit_name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{typeInfo.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!benefit.is_active && <Badge variant="outline">Inactivo</Badge>}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar beneficio?</AlertDialogTitle>
                            <AlertDialogDescription>Se eliminará el beneficio y todas las asignaciones asociadas.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteBenefit(benefit.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {benefit.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{benefit.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-semibold">{getValueDisplay(benefit)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Antigüedad mínima</span>
                    <span>{benefit.eligibility_months} meses</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Asignados</span>
                    <Badge variant="secondary">{benefitAssigns.length} empleados</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignments Table */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asignaciones Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Beneficio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.staff_name || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span>{getTypeInfo(a.benefit_type || '').icon}</span>
                        <span className="text-sm">{a.benefit_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(a.status)}</TableCell>
                    <TableCell className="text-sm">{new Date(a.start_date).toLocaleDateString('es')}</TableCell>
                    <TableCell className="text-sm">{a.usage_count}</TableCell>
                    <TableCell>
                      {a.status === 'active' && (
                        <Button variant="outline" size="sm" onClick={() => onUpdateAssignment(a.id, { status: 'paused' })}>
                          Pausar
                        </Button>
                      )}
                      {a.status === 'paused' && (
                        <Button variant="outline" size="sm" onClick={() => onUpdateAssignment(a.id, { status: 'active' })}>
                          Reactivar
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

      <CreateBenefitDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={onCreateBenefit} />

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Beneficio</DialogTitle>
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
              <label className="text-sm font-medium">Beneficio</label>
              <Select value={selectedBenefitId} onValueChange={setSelectedBenefitId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar beneficio" /></SelectTrigger>
                <SelectContent>
                  {benefits.filter(b => b.is_active).map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {getTypeInfo(b.benefit_type).icon} {b.benefit_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={!selectedStaffId || !selectedBenefitId}>Asignar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
