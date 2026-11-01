import { describe, it, expect } from 'vitest';
import { groupProposalByDay, type ProposedShift } from './scheduleProposal';

const s = (over: Partial<ProposedShift>): ProposedShift => ({
  staff_member_id: Math.random().toString(), staff_name: 'X', position: 'Mesero', shift_date: '2026-11-02',
  start_time: '12:00:00', end_time: '20:00:00', hours: 7.5, cost: 71250, block: 'apertura', ...over,
});

describe('groupProposalByDay', () => {
  it('agrupa por día y bloque, cuenta por cargo y pone la apertura primero', () => {
    const days = groupProposalByDay({
      shifts: [
        s({ block: 'cierre', start_time: '18:00:00', end_time: '02:00:00' }),
        s({}),
        s({}),
        s({ position: 'Bartender', cost: 82500 }),
        s({ shift_date: '2026-11-03' }),
      ],
    });
    expect(days.map(d => d.date)).toEqual(['2026-11-02', '2026-11-03']);
    expect(days[0].people).toBe(4);
    expect(days[0].blocks[0].label).toBe('Apertura 12:00–20:00');
    expect(days[0].blocks[0].byPosition).toEqual([{ position: 'Mesero', count: 2 }, { position: 'Bartender', count: 1 }]);
    expect(days[0].blocks[1].label).toBe('Cierre 18:00–02:00');
    expect(days[0].cost).toBe(71250 * 3 + 82500);
  });
});
