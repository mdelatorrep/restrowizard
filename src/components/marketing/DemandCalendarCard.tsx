import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatTime, type DemandEventRow } from '@/lib/marketing/contentGenerator';
import { todayBusinessDay } from '@/lib/businessDay';

const CATEGORIES: Record<string, string> = {
  deporte: 'Partido / deporte', festivo: 'Festivo', evento_privado: 'Evento privado', promocion: 'Promoción', otro: 'Otro',
};
const LIFTS = [
  { v: '1.1', l: '+10 % (algo más de gente)' },
  { v: '1.25', l: '+25 % (partido normal)' },
  { v: '1.4', l: '+40 % (partido grande)' },
  { v: '1.6', l: '+60 % (final, clásico)' },
  { v: '2', l: '+100 % (casa llena)' },
];

/**
 * Calendario de partidos y eventos. Lo usan el generador de horarios (más
 * personal cuando hay partido), el flujo de caja (más venta esperada) y el
 * marketing (contenido por partido). Antes solo lo llenaba la demo.
 */
export const DemandCalendarCard: React.FC<{
  events: DemandEventRow[];
  onAdd: (e: { event_date: string; start_time: string | null; title: string; category: string; expected_lift: number }) => Promise<unknown>;
  onDelete: (id: string) => void;
  adding: boolean;
}> = ({ events, onAdd, onDelete, adding }) => {
  const [date, setDate] = useState(todayBusinessDay());
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('deporte');
  const [lift, setLift] = useState('1.25');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Calendario de partidos y eventos</CardTitle>
        <CardDescription>Lo que cargues aquí ajusta los turnos sugeridos, la venta proyectada del flujo de caja y los momentos de marketing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-lg border border-dashed p-3 md:grid-cols-[8.5rem_6.5rem_1fr_10rem_12rem_auto] md:items-end">
          <div className="grid gap-1"><Label htmlFor="ev-date" className="text-xs">Fecha</Label><Input id="ev-date" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div className="grid gap-1"><Label htmlFor="ev-time" className="text-xs">Hora</Label><Input id="ev-time" type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
          <div className="grid gap-1"><Label htmlFor="ev-title" className="text-xs">Evento</Label><Input id="ev-title" placeholder="Nacional vs. Medellín" value={title} maxLength={120} onChange={e => setTitle(e.target.value)} /></div>
          <div className="grid gap-1"><Label className="text-xs">Tipo</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(CATEGORIES).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1"><Label className="text-xs">Impacto esperado</Label>
            <Select value={lift} onValueChange={setLift}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LIFTS.map(x => <SelectItem key={x.v} value={x.v}>{x.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button disabled={!title.trim() || !date || adding} onClick={async () => {
            await onAdd({ event_date: date, start_time: time || null, title, category, expected_lift: Number(lift) });
            setTitle(''); setTime('');
          }}><Plus className="mr-2 h-4 w-4" />Agregar</Button>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos en las próximas semanas.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {events.map(e => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {new Date(`${e.event_date}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {e.start_time ? ` · ${formatTime(e.start_time)}` : ''} · {CATEGORIES[e.category] || e.category}
                    {e.expected_lift && Number(e.expected_lift) > 1 ? ` · +${Math.round((Number(e.expected_lift) - 1) * 100)} %` : ''}
                  </p>
                </div>
                <Button size="icon" variant="ghost" aria-label={`Quitar ${e.title}`} onClick={() => onDelete(e.id)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
