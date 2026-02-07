import React, { useState } from 'react';
import { GraduationCap, Gift, CheckCircle2, Clock, AlertTriangle, BookOpen, Play, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPIGrid } from '@/components/layout/KPIGrid';
import { ModulePageLayout, PageHeader } from '@/components/layout/ModulePageLayout';
import { useMyDevelopment } from '@/hooks/useMyDevelopment';
import { TRAINING_CATEGORIES, BENEFIT_TYPES } from '@/hooks/useStaffDevelopment';
import type { KPICardData } from '@/components/layout/KPIGrid';

const MyDevelopment: React.FC = () => {
  const {
    loading, isLinked, staffName, staffPosition,
    training, benefits, requests, availableBenefits, stats,
    updateMyProgress, requestBenefit
  } = useMyDevelopment();

  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedBenefitId, setSelectedBenefitId] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLinked) {
    return (
      <ModulePageLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Cuenta no vinculada</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            Tu cuenta aún no está vinculada a un perfil de empleado. Pide a tu administrador que vincule tu cuenta desde el módulo de Talento.
          </p>
        </div>
      </ModulePageLayout>
    );
  }

  const getCategoryInfo = (cat: string) => TRAINING_CATEGORIES.find(c => c.value === cat) || TRAINING_CATEGORIES[5];
  const getTypeInfo = (type: string) => BENEFIT_TYPES.find(t => t.value === type) || BENEFIT_TYPES[7];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      not_started: { label: 'Sin iniciar', variant: 'outline' },
      in_progress: { label: 'En progreso', variant: 'default' },
      completed: { label: 'Completado', variant: 'secondary' },
      expired: { label: 'Vencido', variant: 'destructive' },
      active: { label: 'Activo', variant: 'default' },
      paused: { label: 'Pausado', variant: 'secondary' },
      pending: { label: 'Pendiente', variant: 'outline' },
      approved: { label: 'Aprobado', variant: 'secondary' },
      denied: { label: 'Denegado', variant: 'destructive' },
      revoked: { label: 'Revocado', variant: 'destructive' },
    };
    const info = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const kpiCards: KPICardData[] = [
    { label: 'Formaciones', value: `${stats.completedTraining}/${stats.totalTraining}`, icon: GraduationCap, subtext: `${stats.completionRate}% completado` },
    { label: 'Cumplimiento', value: `${stats.mandatoryCompliance}%`, icon: CheckCircle2, subtext: 'Formaciones obligatorias' },
    { label: 'Beneficios Activos', value: stats.activeBenefits, icon: Gift, subtext: `${stats.pendingRequests} solicitudes pendientes` },
    { label: 'Vencidos', value: stats.overdueCount, icon: AlertTriangle, subtext: 'Requieren atención', highlightColor: stats.overdueCount > 0 ? 'danger' as const : undefined, highlight: stats.overdueCount > 0 },
  ];

  const handleRequestBenefit = async () => {
    if (!selectedBenefitId) return;
    setSubmitting(true);
    await requestBenefit(selectedBenefitId, requestMessage);
    setSubmitting(false);
    setRequestOpen(false);
    setSelectedBenefitId('');
    setRequestMessage('');
  };

  // Filter available benefits that aren't already assigned
  const requestableBenefits = availableBenefits.filter(
    ab => !benefits.some(b => b.benefit_id === ab.id && b.status === 'active')
  );

  return (
    <ModulePageLayout>
      <PageHeader
        title={`Mi Desarrollo`}
        description={`${staffName} — ${staffPosition}`}
        icon={GraduationCap}
      />

      <KPIGrid kpis={kpiCards} columns={4} />

      <Tabs defaultValue="training" className="mt-6">
        <TabsList>
          <TabsTrigger value="training" className="gap-1.5">
            <GraduationCap className="h-4 w-4" /> Formación
          </TabsTrigger>
          <TabsTrigger value="benefits" className="gap-1.5">
            <Gift className="h-4 w-4" /> Beneficios
          </TabsTrigger>
        </TabsList>

        {/* TRAINING TAB */}
        <TabsContent value="training" className="space-y-4 mt-4">
          {training.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Sin formaciones asignadas</h3>
                <p className="text-muted-foreground mt-1">Tu administrador aún no te ha asignado programas de formación</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {training.map(t => {
                const cat = getCategoryInfo(t.program_category);
                const isOverdue = t.due_date && t.due_date < new Date().toISOString().split('T')[0] && t.status !== 'completed';
                return (
                  <Card key={t.id} className={isOverdue ? 'border-destructive/50' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cat.icon}</span>
                          <div>
                            <CardTitle className="text-base">{t.program_title}</CardTitle>
                            <CardDescription className="text-xs">{cat.label} · {t.program_estimated_hours}h</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {t.program_is_mandatory && <Badge variant="destructive" className="text-[10px]">Obligatorio</Badge>}
                          {getStatusBadge(t.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {t.program_description && (
                        <p className="text-sm text-muted-foreground">{t.program_description}</p>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Progreso</span>
                          <span className="font-medium">{t.progress_percent}%</span>
                        </div>
                        <Progress value={t.progress_percent} className="h-2" />
                      </div>
                      {t.due_date && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Fecha límite: {new Date(t.due_date).toLocaleDateString('es')}</span>
                          {isOverdue && <Badge variant="destructive" className="text-[10px]">Vencido</Badge>}
                        </div>
                      )}
                      {t.score !== null && (
                        <div className="text-xs text-muted-foreground">
                          Puntaje: <span className="font-semibold">{t.score}/{t.program_passing_score}</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        {t.status === 'not_started' && (
                          <Button size="sm" onClick={() => updateMyProgress(t.id, { status: 'in_progress' })}>
                            <Play className="h-3.5 w-3.5 mr-1" /> Comenzar
                          </Button>
                        )}
                        {t.status === 'in_progress' && (
                          <Button size="sm" onClick={() => updateMyProgress(t.id, { status: 'completed', score: 100 })}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Marcar Completado
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* BENEFITS TAB */}
        <TabsContent value="benefits" className="space-y-4 mt-4">
          {/* Request benefit button */}
          {requestableBenefits.length > 0 && (
            <div>
              <Button onClick={() => setRequestOpen(true)}>
                <Send className="h-4 w-4 mr-2" /> Solicitar Beneficio
              </Button>
            </div>
          )}

          {/* Active benefits */}
          {benefits.length === 0 && requests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Sin beneficios asignados</h3>
                <p className="text-muted-foreground mt-1">Aún no tienes beneficios activos. Puedes solicitar uno si hay beneficios disponibles.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {benefits.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {benefits.map(b => {
                    const typeInfo = getTypeInfo(b.benefit_type);
                    const valueDisplay = b.benefit_value_type === 'percentage' ? `${b.benefit_value}%`
                      : b.benefit_value_type === 'unlimited' ? 'Ilimitado'
                      : `$${b.benefit_value?.toLocaleString() || 0}`;
                    return (
                      <Card key={b.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{typeInfo.icon}</span>
                            <div>
                              <CardTitle className="text-base">{b.benefit_name}</CardTitle>
                              <CardDescription className="text-xs">{typeInfo.label}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {b.benefit_description && (
                            <p className="text-sm text-muted-foreground">{b.benefit_description}</p>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Valor</span>
                            <span className="font-semibold">{valueDisplay}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Estado</span>
                            {getStatusBadge(b.status)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Desde: {new Date(b.start_date).toLocaleDateString('es')}
                            {b.end_date && ` — Hasta: ${new Date(b.end_date).toLocaleDateString('es')}`}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Requests history */}
              {requests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Mis Solicitudes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {requests.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <span className="text-sm font-medium">
                              {getTypeInfo(r.benefit_type || '').icon} {r.benefit_name}
                            </span>
                            {r.message && <p className="text-xs text-muted-foreground mt-0.5">{r.message}</p>}
                            {r.review_notes && (
                              <p className="text-xs text-muted-foreground mt-0.5 italic">Respuesta: {r.review_notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {getStatusBadge(r.status)}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(r.created_at).toLocaleDateString('es')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Benefit Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Beneficio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Beneficio</label>
              <Select value={selectedBenefitId} onValueChange={setSelectedBenefitId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar beneficio" /></SelectTrigger>
                <SelectContent>
                  {requestableBenefits.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {getTypeInfo(b.benefit_type).icon} {b.benefit_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensaje (opcional)</label>
              <Textarea
                value={requestMessage}
                onChange={e => setRequestMessage(e.target.value)}
                placeholder="¿Por qué solicitas este beneficio?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancelar</Button>
            <Button onClick={handleRequestBenefit} disabled={!selectedBenefitId || submitting}>
              {submitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePageLayout>
  );
};

export default MyDevelopment;
