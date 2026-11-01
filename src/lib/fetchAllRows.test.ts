import { describe, it, expect } from 'vitest';
import { fetchAllRows } from './fetchAllRows';

const fakeTable = (n: number) => () => ({
  range: async (from: number, to: number) => ({
    data: Array.from({ length: Math.max(0, Math.min(n, to + 1) - from) }, (_, i) => from + i),
    error: null,
  }),
});

describe('fetchAllRows (B-47)', () => {
  it('trae más de 1.000 filas en varias páginas', async () => {
    const { data, error } = await fetchAllRows(fakeTable(2_537));
    expect(error).toBeNull();
    expect(data).toHaveLength(2_537);
    expect(data[2_536]).toBe(2_536);
  });

  it('una tabla de exactamente 1.000 filas termina con una página vacía', async () => {
    expect((await fetchAllRows(fakeTable(1_000))).data).toHaveLength(1_000);
  });

  it('propaga el error con lo leído hasta ahí', async () => {
    let calls = 0;
    const { data, error } = await fetchAllRows(() => ({
      range: async (from: number, to: number) =>
        ++calls === 1 ? { data: Array.from({ length: 1000 }, (_, i) => i), error: null } : { data: null, error: 'boom' },
    }));
    expect(error).toBe('boom');
    expect(data).toHaveLength(1000);
  });
});
