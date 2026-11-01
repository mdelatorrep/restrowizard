/** Respuesta de la RPC generate_schedule_proposal y cómo se agrupa para mostrarla. */
export interface ProposedShift {
  staff_member_id: string;
  staff_name: string;
  position: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  hours: number;
  cost: number;
  block: 'apertura' | 'cierre' | 'jornada';
}

export interface ScheduleProposal {
  ok: boolean;
  message?: string;
  week_start: string;
  applied: boolean;
  shifts: ProposedShift[];
  gaps: { date: string; position: string; block: string; needed: number; assigned: number; reason: string }[];
  total_hours: number;
  base_cost: number;
  estimated_surcharges: number;
  events: { date: string; title: string; lift: number }[];
  projected_orders: number | null;
}

const hhmm = (t: string) => t.slice(0, 5);

export interface ProposalDay {
  date: string;
  people: number;
  cost: number;
  blocks: { label: string; byPosition: { position: string; count: number }[] }[];
}

/** Agrupa por día y por bloque horario ("Apertura 12:00–20:00") contando personas por cargo. */
export const groupProposalByDay = (p: Pick<ScheduleProposal, 'shifts'>): ProposalDay[] => {
  const days = new Map<string, ProposedShift[]>();
  for (const s of p.shifts) days.set(s.shift_date, [...(days.get(s.shift_date) || []), s]);

  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, shifts]) => {
      const blocks = new Map<string, Map<string, number>>();
      for (const s of shifts) {
        const label = `${s.block === 'apertura' ? 'Apertura' : s.block === 'cierre' ? 'Cierre' : 'Jornada'} ${hhmm(s.start_time)}–${hhmm(s.end_time)}`;
        const m = blocks.get(label) || new Map<string, number>();
        m.set(s.position, (m.get(s.position) || 0) + 1);
        blocks.set(label, m);
      }
      return {
        date,
        people: new Set(shifts.map(s => s.staff_member_id)).size,
        cost: shifts.reduce((t, s) => t + (Number(s.cost) || 0), 0),
        blocks: [...blocks.entries()]
          .sort(([a], [b]) => (a.startsWith('Apertura') ? -1 : b.startsWith('Apertura') ? 1 : a.localeCompare(b)))
          .map(([label, m]) => ({
            label,
            byPosition: [...m.entries()].sort((a, b) => b[1] - a[1]).map(([position, count]) => ({ position, count })),
          })),
      };
    });
};
