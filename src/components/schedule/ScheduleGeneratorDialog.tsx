import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addWeeks, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, CalendarRange, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Trophy, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from '@/hooks/useDataUserId';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatCurrency';
import { groupProposalByDay, type ScheduleProposal } from './scheduleProposal';

const db = supabase as unknown as {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: any; error: { message: string } | null }>;
  from: (t: string) => any;
};

const money = (n: number) => formatCurrency(Math.round(Number(n) || 0), 'COP');
const MARKER = 'Generado por RestroWizard';

/**
 * Propone el horario de una semana a partir de la demanda real (ventas por hora
 * de las últimas 8 semanas) y del calendario de partidos y festivos. Respeta
 * disponibilidad, ausencias aprobadas, un día de descanso y la jornada máxima.
 * El gerente revisa, aplica como borrador y publica.
 */
export const ScheduleGeneratorDialog = ({ viewedWeek }: { viewedWeek: Date }) => {
  const { userId } = useDataUserId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const nextMonday = useMemo(() => addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), []);
  const [open, setOpen] = useState(false);
  const [week, setWeek] = useState<Date>(viewedWeek > nextMonday ? viewedWeek : nextMonday);
  const [proposal, setProposal] = useState<ScheduleProposal | null>(null);
  const [applied, setApplied] = useState(false);

  const weekIso = format(week, 'yyyy-MM-dd');

  const run = useMutation({
    mutationFn: async (apply: boolean): Promise<ScheduleProposal> => {
      const { data, error } = await db.rpc('generate_schedule_proposal', { p_owner: userId, p_week_start: weekIso, p_apply: apply });
      if (error) throw new Error(error.message);
      return data as ScheduleProposal;
    },
    onSuccess: (data, apply) => {
      setProposal(data);
      if (apply && data.ok) {
        setApplied(true);
        queryClient.invalidateQueries({ queryKey: ['staff-schedule'] });
        queryClient.invalidateQueries({ queryKey: ['finances-aggregated'] });
        toast({ title: 'Horario aplicado como borrador', description: 'Revísalo en la grilla y publícalo cuando esté listo.' });
      }
    },
    onError: e => toast({ title: 'No se pudo generar', description: (e as Error).message, variant: 'destructive' }),
  });

  const publish = useMutation({
    mutationFn: async () => {
      const end = format(addWeeks(week, 1), 'yyyy-MM-dd');
      const { error } = await db.from('staff_shifts')
        .update({ is_published: true, published_at: new Date().toISOString() })
        .eq('user_id', userId).eq('notes', MARKER).eq('is_published', false)
        .gte('shift_date', weekIso).lt('shift_date', end);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-schedule'] });
      toast({ title: 'Horario publicado', description: 'El equipo ya puede ver sus turnos de la semana.' });
      setOpen(false);
    },
    onError: e => toast({ title: 'No se pudo publicar', description: (e as Error).message, variant: 'destructive' }),
  });

  const changeWeek = (delta: number) => {
    setWeek(w => addWeeks(w, delta));
    setProposal(null);
    setApplied(false);
  };

  const days = proposal?.ok ? groupProposalByDay(proposal) : [];

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (o) { setProposal(null); setApplied(false); } }}>
      <DialogTrigger asChild>
        <Button><Wand2 className="h-4 w-4 mr-2" />Generar semana</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar horario según la demanda</DialogTitle>
          <DialogDescription>
            Cruza las ventas por hora de las últimas 8 semanas con los partidos y festivos de la semana, y reparte los turnos
            de forma justa sin pasar la jornada máxima ni quitar el día de descanso.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => changeWeek(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Semana del {format(week, "d 'de' MMMM", { locale: es })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => changeWeek(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => run.mutate(false)} disabled={run.isPending || !userId}>
              {run.isPending && !applied ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
              {proposal ? 'Volver a proponer' : 'Proponer'}
            </Button>
            {proposal?.ok && !applied && (
              <Button onClick={() => run.mutate(true)} disabled={run.isPending}>Aplicar como borrador</Button>
            )}
            {applied && (
              <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
                {publish.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Publicar al equipo
              </Button>
            )}
          </div>
        </div>

        {proposal && !proposal.ok && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm flex gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />{proposal.message}
          </div>
        )}

        {proposal?.ok && (
          <div className="space-y-5">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <Stat label="Mesas proyectadas" value={String(proposal.projected_orders ?? '—')} />
              <Stat label="Turnos" value={String(proposal.shifts.length)} hint={`${Math.round(proposal.total_hours)} horas`} />
              <Stat label="Costo base" value={money(proposal.base_cost)} hint="Mismo cálculo que el P&L" />
              <Stat label="Recargos estimados" value={money(proposal.estimated_surcharges)} hint="Nocturno desde 7 p.m. y dominical" />
            </div>

            {proposal.events.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {proposal.events.map(e => (
                  <Badge key={`${e.date}-${e.title}`} variant="secondary" className="gap-1.5">
                    <Trophy className="h-3 w-3" />
                    {format(new Date(`${e.date}T12:00:00`), 'EEE d', { locale: es })} · {e.title} · ×{Number(e.lift).toFixed(2)}
                  </Badge>
                ))}
              </div>
            )}

            {proposal.gaps.length > 0 && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm space-y-1">
                <p className="font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600" />Faltan personas</p>
                {proposal.gaps.map((g, i) => (
                  <p key={i} className="text-muted-foreground">
                    {format(new Date(`${g.date}T12:00:00`), 'EEEE d', { locale: es })} · {g.position} ({g.block}): {g.assigned} de {g.needed}
                  </p>
                ))}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {days.map(d => (
                <div key={d.date} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <p className="font-medium capitalize">{format(new Date(`${d.date}T12:00:00`), 'EEEE d', { locale: es })}</p>
                    <p className="text-xs text-muted-foreground">{d.people} personas · {money(d.cost)}</p>
                  </div>
                  {d.blocks.map(b => (
                    <div key={b.label} className="text-xs">
                      <p className="text-muted-foreground">{b.label}</p>
                      <p>{b.byPosition.map(p => `${p.count} ${p.position.toLowerCase()}`).join(' · ')}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-lg border p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-semibold tabular-nums">{value}</p>
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);
