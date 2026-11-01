import React, { useMemo, useState } from 'react';
import { Megaphone, Copy, CalendarPlus, Trophy, Flame, Coffee, CalendarDays, Sparkles, Check } from 'lucide-react';
import { ModulePageLayout, PageHeader } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMarketing, type MarketingContentRow } from '@/hooks/useMarketing';
import { DemandCalendarCard } from '@/components/marketing/DemandCalendarCard';
import {
  CHANNEL_LABEL, QUADRANT_INFO, formatTime, generateContent, weekdayOf,
  type Channel, type GeneratedContent, type MarketingMoment, type MenuOpportunity, type Quadrant,
} from '@/lib/marketing/contentGenerator';
import { formatCurrency } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';

const money = (v: number | null | undefined) => formatCurrency(Math.round(Number(v) || 0), 'COP');
const dayLabel = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
const KIND_ICON = { deporte: Trophy, festivo: CalendarDays, dia_flojo: Flame, brunch: Coffee, otro: Sparkles } as const;
const QUADRANT_STYLE: Record<Quadrant, string> = {
  estrella: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30',
  rompecabezas: 'border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/30',
  caballo: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
  perro: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
  sin_costo: 'border-muted bg-muted/30',
};
const STATUS_LABEL: Record<MarketingContentRow['status'], string> = {
  draft: 'Borrador', scheduled: 'Programado', published: 'Publicado', discarded: 'Descartado',
};

const ContentDialog: React.FC<{
  moment: MarketingMoment | null;
  generated: GeneratedContent | null;
  onClose: () => void;
  onSave: (pieces: { channel: Channel; title: string; body: string; publishAt: string }[]) => Promise<unknown>;
  saving: boolean;
}> = ({ moment, generated, onClose, onSave, saving }) => {
  const { toast } = useToast();
  const [edited, setEdited] = useState<Record<string, string>>({});
  if (!moment || !generated) return null;
  const bodyOf = (c: Channel) => edited[c] ?? generated.pieces.find(p => p.channel === c)?.body ?? '';

  return (
    <Dialog open onOpenChange={o => { if (!o) { setEdited({}); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{moment.title}</DialogTitle>
          <DialogDescription>{dayLabel(moment.date)}{moment.time ? ` · ${formatTime(moment.time)}` : ''}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {[generated.food, generated.drink].filter(Boolean).map(i => (
            <div key={i!.id} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{QUADRANT_INFO[i!.quadrant].label}</p>
              <p className="font-medium">{i!.name}</p>
              <p className="text-xs text-muted-foreground">Deja {money(i!.margin)} por unidad ({i!.margin_pct}%) · {i!.units} vendidos en 4 semanas</p>
            </div>
          ))}
        </div>
        {generated.offer && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            {generated.offer.type === 'combo' ? (
              <>Combo a <strong>{money(generated.offer.offerPrice)}</strong> (normal {money(generated.offer.regularPrice)}, −{generated.offer.discountPct}%). Margen después de la oferta: <strong>{generated.offer.marginPctAfter}%</strong>.</>
            ) : (
              <>Sin descuento: el margen no da para rebajar sin bajar del 60 %. Se ofrece valor agregado. Margen: <strong>{generated.offer.marginPctAfter}%</strong>.</>
            )}
          </div>
        )}

        <Tabs defaultValue="instagram">
          <TabsList className="flex-wrap h-auto">
            {generated.pieces.map(p => <TabsTrigger key={p.channel} value={p.channel}>{CHANNEL_LABEL[p.channel]}</TabsTrigger>)}
          </TabsList>
          {generated.pieces.map(p => (
            <TabsContent key={p.channel} value={p.channel} className="space-y-2">
              <p className="text-xs text-muted-foreground">Publicar: {dayLabel(p.publishAt.slice(0, 10))} a las {formatTime(p.publishAt.slice(11))}</p>
              <Textarea rows={p.channel === 'story' ? 5 : 9} value={bodyOf(p.channel)} onChange={e => setEdited(s => ({ ...s, [p.channel]: e.target.value }))} />
              <Button variant="outline" size="sm" onClick={async () => {
                await navigator.clipboard.writeText(bodyOf(p.channel));
                toast({ title: 'Copiado', description: CHANNEL_LABEL[p.channel] });
              }}><Copy className="mr-2 h-4 w-4" />Copiar</Button>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button disabled={saving} onClick={async () => {
            await onSave(generated.pieces.map(p => ({ channel: p.channel, title: p.title, body: bodyOf(p.channel), publishAt: p.publishAt })));
            setEdited({});
            onClose();
          }}><CalendarPlus className="mr-2 h-4 w-4" />{saving ? 'Guardando…' : 'Programar las 4 piezas'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Marketing: React.FC = () => {
  const { toast } = useToast();
  const { loading, error, items, marginThreshold, ctx, moments, slowDay, content, savePieces, setStatus, events, addEvent, deleteEvent } = useMarketing();
  const [active, setActive] = useState<{ moment: MarketingMoment; generated: GeneratedContent } | null>(null);

  const byQuadrant = useMemo(() => {
    const g: Record<Quadrant, MenuOpportunity[]> = { estrella: [], rompecabezas: [], caballo: [], perro: [], sin_costo: [] };
    items.forEach(i => g[i.quadrant].push(i));
    (Object.keys(g) as Quadrant[]).forEach(q => g[q].sort((a, b) => b.margin - a.margin));
    return g;
  }, [items]);
  const scheduledKeys = useMemo(() => new Set(content.map(c => `${c.moment_date}|${c.moment_title}`)), [content]);
  const upcoming = content.filter(c => c.status !== 'published');

  return (
    <ModulePageLayout>
      <PageHeader
        title="Marketing gastronómico"
        description="Qué empujar, cuándo y con qué mensaje, según el margen de cada plato y el calendario deportivo"
        icon={Megaphone}
      />

      {error && <p className="text-sm text-red-600">No se pudo cargar: {error.message}</p>}
      {loading ? <p className="text-sm text-muted-foreground">Analizando la carta…</p> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Platos para promocionar</p>
              <p className="mt-1 text-2xl font-bold">{byQuadrant.rompecabezas.length}</p><p className="text-xs text-muted-foreground">Buen margen, poca venta</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Margen promedio por plato</p>
              <p className="mt-1 text-2xl font-bold">{money(marginThreshold)}</p><p className="text-xs text-muted-foreground">Ponderado por unidades, 4 semanas</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Momentos en 2 semanas</p>
              <p className="mt-1 text-2xl font-bold">{moments.length}</p><p className="text-xs text-muted-foreground">{slowDay !== null ? `Día más flojo: ${['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][slowDay]}` : 'Partidos y festivos'}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Contenido programado</p>
              <p className="mt-1 text-2xl font-bold">{upcoming.length}</p><p className="text-xs text-muted-foreground">Piezas por publicar</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Qué empujar</CardTitle>
              <CardDescription>Margen = precio sin impoconsumo − costo de la receta. La promoción va a lo que deja plata y tiene espacio para vender más.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {(['rompecabezas', 'estrella', 'caballo', 'perro'] as Quadrant[]).map(q => (
                <div key={q} className={cn('rounded-xl border p-4', QUADRANT_STYLE[q])}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{QUADRANT_INFO[q].label}</p>
                    <Badge variant="outline">{byQuadrant[q].length}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{QUADRANT_INFO[q].action}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {byQuadrant[q].slice(0, 4).map(i => (
                      <li key={i.id} className="flex justify-between gap-2">
                        <span className="truncate">{i.name}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{money(i.margin)} · {i.units} u</span>
                      </li>
                    ))}
                    {byQuadrant[q].length === 0 && <li className="text-muted-foreground">Ninguno</li>}
                  </ul>
                </div>
              ))}
              {byQuadrant.sin_costo.length > 0 && (
                <p className="md:col-span-2 text-xs text-muted-foreground">{byQuadrant.sin_costo.length} plato(s) sin receta costeada quedan fuera: costéalos en Recetas y Costos.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Momentos de las próximas 2 semanas</CardTitle>
              <CardDescription>Partidos y festivos del calendario, el día más flojo y el brunch. Cada uno con el plato que más conviene empujar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {moments.length === 0 && <p className="text-sm text-muted-foreground">Agrega partidos y eventos en el calendario de abajo.</p>}
              {moments.map(m => {
                const Icon = KIND_ICON[m.kind];
                const done = scheduledKeys.has(`${m.date}|${m.title}`);
                return (
                  <div key={m.key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {dayLabel(m.date)}{m.time ? ` · ${formatTime(m.time)}` : ''}
                          {m.lift && m.lift > 1 ? ` · +${Math.round((m.lift - 1) * 100)}% demanda esperada` : ''}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant={done ? 'outline' : 'default'} onClick={() => setActive({ moment: m, generated: generateContent(ctx, m, items) })}>
                      {done ? <><Check className="mr-2 h-4 w-4" />Programado</> : <><Sparkles className="mr-2 h-4 w-4" />Crear contenido</>}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <DemandCalendarCard events={events} adding={addEvent.isPending}
            onAdd={e => addEvent.mutateAsync(e)} onDelete={id => deleteEvent.mutate(id)} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Calendario de contenido</CardTitle>
              <CardDescription>Lo programado, por fecha y hora sugerida. Copia, publica y márcalo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay contenido programado. Crea el del próximo partido.</p>}
              {content.map(c => (
                <div key={c.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{CHANNEL_LABEL[c.channel]}</Badge>
                      <span className="text-xs text-muted-foreground capitalize">
                        {c.publish_at ? new Date(c.publish_at).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' }) : dayLabel(c.moment_date)}
                      </span>
                    </div>
                    <p className="mt-1 font-medium">{c.moment_title}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{c.body}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" aria-label="Copiar" onClick={async () => { await navigator.clipboard.writeText(c.body); toast({ title: 'Copiado' }); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Select value={c.status} onValueChange={v => setStatus.mutate({ id: c.id, status: v as MarketingContentRow['status'] })}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{(Object.keys(STATUS_LABEL) as MarketingContentRow['status'][]).map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <ContentDialog
        moment={active?.moment ?? null}
        generated={active?.generated ?? null}
        saving={savePieces.isPending}
        onClose={() => setActive(null)}
        onSave={pieces => savePieces.mutateAsync(pieces.map(p => ({
          moment_date: active!.moment.date,
          moment_title: active!.moment.title,
          channel: p.channel,
          title: p.title,
          body: p.body,
          publish_at: p.publishAt,
          menu_item_ids: [active!.generated.food?.id, active!.generated.drink?.id].filter(Boolean) as string[],
          offer: active!.generated.offer as unknown as Record<string, unknown>,
        })))}
      />
    </ModulePageLayout>
  );
};

export default Marketing;
